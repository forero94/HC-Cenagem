// ===============================
// src/routes/PhotosPage.jsx — Galería de fotos (adjuntos categoría PHOTO)
// ===============================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { cenagemApi } from '@/lib/apiClient';
import { getUser } from '@/modules/auth/useAuth';
import { useCenagemStore } from '@/store/cenagemStore';

const PHOTO_CATEGORY = 'PHOTO';
const AUTO_REFRESH_INTERVAL_MS = 15_000;

const yearsSince = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) years -= 1;
  return `${years}a`;
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    const value = new Date(iso);
    return value.toLocaleString();
  } catch (error) {
    console.warn('No se pudo formatear la fecha de la foto', error);
    return iso;
  }
};

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB límite objetivo por imagen
const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('No se pudo leer el archivo'));
    };
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('No se pudo generar la imagen comprimida'));
    };
    reader.onerror = () =>
      reject(reader.error || new Error('No se pudo generar la imagen comprimida'));
    reader.readAsDataURL(blob);
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('No se pudo crear la imagen comprimida'));
      },
      type,
      quality,
    );
  });

const loadImageSource = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, width, height) => ctx.drawImage(bitmap, 0, 0, width, height),
        cleanup: () => {
          if (typeof bitmap.close === 'function') {
            bitmap.close();
          }
        },
      };
    } catch {
      // Fallback to Image element below
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      URL.revokeObjectURL(url);
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      resolve({
        width,
        height,
        draw: (ctx, targetWidth, targetHeight) => ctx.drawImage(image, 0, 0, targetWidth, targetHeight),
        cleanup: () => {},
      });
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject((event && event.error) || new Error('No se pudo cargar la imagen'));
    };
    image.src = url;
  });
};

const compressImageIfNeeded = async (file) => {
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return readFileAsDataUrl(file);
  }

  if (file.size <= MAX_IMAGE_BYTES) {
    return readFileAsDataUrl(file);
  }

  try {
    const source = await loadImageSource(file);
    try {
      const longestSide = Math.max(source.width, source.height);
      const scale =
        longestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / longestSide : 1;
      const targetWidth = Math.max(1, Math.round(source.width * scale));
      const targetHeight = Math.max(1, Math.round(source.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo preparar el lienzo para comprimir la imagen.');
      }
      ctx.imageSmoothingQuality = 'high';
      source.draw(ctx, targetWidth, targetHeight);

      let outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      let blob = await canvasToBlob(
        canvas,
        outputType,
        outputType === 'image/jpeg' ? JPEG_QUALITY_STEPS[0] : undefined,
      );

      if (blob.size > MAX_IMAGE_BYTES && outputType === 'image/jpeg') {
        for (const quality of JPEG_QUALITY_STEPS.slice(1)) {
          const candidate = await canvasToBlob(canvas, outputType, quality);
          if (candidate && candidate.size <= MAX_IMAGE_BYTES) {
            blob = candidate;
            break;
          }
          if (candidate && candidate.size < blob.size) {
            blob = candidate;
          }
        }
      }

      if (blob.size > MAX_IMAGE_BYTES && outputType === 'image/png') {
        outputType = 'image/jpeg';
        let jpegBlob = await canvasToBlob(canvas, outputType, JPEG_QUALITY_STEPS[0]);
        if (jpegBlob) {
          if (jpegBlob.size > MAX_IMAGE_BYTES) {
            for (const quality of JPEG_QUALITY_STEPS.slice(1)) {
              const candidate = await canvasToBlob(canvas, outputType, quality);
              if (candidate && candidate.size <= MAX_IMAGE_BYTES) {
                jpegBlob = candidate;
                break;
              }
              if (candidate && candidate.size < jpegBlob.size) {
                jpegBlob = candidate;
              }
            }
          }
          blob = jpegBlob;
        }
      }

      const dataUrl = await blobToDataUrl(blob);
      return dataUrl;
    } finally {
      source.cleanup?.();
    }
  } catch (error) {
    console.warn('No se pudo comprimir la imagen antes de subirla', error);
    return readFileAsDataUrl(file);
  }
};

const fileToBase64 = async (file) => {
  const dataUrl = await compressImageIfNeeded(file);
  if (typeof dataUrl !== 'string') {
    throw new Error('No se pudo preparar la imagen para subirla');
  }
  return dataUrl.split(',').pop() || '';
};

function UploadPhotos({ disabled, onFiles }) {
  const inputId = React.useId();
  return (
    <div className="grid gap-1">
      <label
        htmlFor={inputId}
        className={`px-3 py-2 rounded-xl border ${
          disabled
            ? 'border-slate-200 text-slate-400'
            : 'border-slate-300 hover:bg-slate-50 cursor-pointer'
        } flex items-center justify-center gap-2`}
      >
        <span>➕ Agregar fotos</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(event) => onFiles && onFiles(event.target.files)}
      />
      <div className="text-[11px] text-slate-500">
        Las imágenes se adjuntan al miembro activo y quedan disponibles para todo el equipo.
      </div>
    </div>
  );
}

function UploadTicketMode({ ticketContext }) {
  const [status, setStatus] = useState({ uploading: false, error: null, success: null });
  const [recentUploads, setRecentUploads] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(() => ticketContext?.memberId || '');

  const ticketMembers = useMemo(() => {
    if (!Array.isArray(ticketContext?.members)) {
      return null;
    }
    const normalized = ticketContext.members
      .map((member) => {
        if (!member || typeof member !== 'object') return null;
        const id = typeof member.id === 'string' ? member.id : null;
        if (!id) return null;
        const initials =
          typeof member.initials === 'string' && member.initials.trim()
            ? member.initials.trim()
            : '';
        const metadataName =
          typeof member.metadata?.nombreCompleto === 'string' &&
          member.metadata.nombreCompleto.trim()
            ? member.metadata.nombreCompleto.trim()
            : '';
        const labelCandidates = [
          typeof member.label === 'string' ? member.label.trim() : '',
          typeof member.displayName === 'string' ? member.displayName.trim() : '',
          metadataName,
          typeof member.nombreCompleto === 'string' ? member.nombreCompleto.trim() : '',
          typeof member.fullName === 'string' ? member.fullName.trim() : '',
          initials,
          typeof member.role === 'string' ? member.role.trim() : '',
        ].filter(Boolean);
        const label = labelCandidates[0] || id;
        return { id, label };
      })
      .filter(Boolean);
    return normalized;
  }, [ticketContext?.members]);

  const expiresAt = useMemo(() => {
    if (!ticketContext?.expiresAt) return null;
    return new Date(ticketContext.expiresAt);
  }, [ticketContext?.expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      setCountdown('');
      return undefined;
    }
    const update = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Expiró');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}m ${String(seconds).padStart(2, '0')}s`);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (ticketMembers !== null) {
      setMembers(ticketMembers.slice());
      setMembersError(null);
      setMembersLoading(false);
      setSelectedMemberId((prev) => {
        if (prev && ticketMembers.some((member) => member.id === prev)) {
          return prev;
        }
        return ticketContext?.memberId || ticketMembers[0]?.id || '';
      });
      return;
    }

    if (!ticketContext?.familyId) {
      setMembers([]);
      setMembersError(null);
      setMembersLoading(false);
      setSelectedMemberId(ticketContext?.memberId || '');
      return;
    }
    let cancelled = false;
    setMembersLoading(true);
    setMembersError(null);
    (async () => {
      try {
        const response = await cenagemApi.listFamilyMembers(ticketContext.familyId);
        if (cancelled) return;
        const collection = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response)
              ? response
              : [];
        const normalized = collection
          .map((member) => (member && member.id ? member : null))
          .filter(Boolean)
          .map((member) => {
            const fullName = [member.givenName, member.middleName, member.lastName]
              .filter(Boolean)
              .join(' ')
              .trim();
            const label =
              member.displayName ||
              member.metadata?.nombreCompleto ||
              fullName ||
              member.initials ||
              member.id;
            return { id: member.id, label };
          });
        setMembers(normalized);
        const fallbackId = ticketContext?.memberId || normalized[0]?.id || '';
        setSelectedMemberId((prev) => {
          if (prev && normalized.some((member) => member.id === prev)) {
            return prev;
          }
          return fallbackId;
        });
      } catch (error) {
        if (cancelled) return;
        console.error('No se pudieron cargar los integrantes para el ticket de fotos', error);
        setMembers([]);
        setMembersError('No se pudieron cargar los integrantes de la familia.');
      } finally {
        if (!cancelled) {
          setMembersLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketMembers, ticketContext?.familyId, ticketContext?.memberId]);

  const handleUploadFiles = useCallback(
    async (files) => {
      if (!ticketContext?.familyId) return;
      const targetMemberId = selectedMemberId || ticketContext?.memberId || '';
      if (!targetMemberId) {
        setStatus({
          uploading: false,
          error: 'Seleccioná un integrante antes de subir fotos.',
          success: null,
        });
        return;
      }
      const fileList = Array.from(files || []);
      if (!fileList.length) return;
      setStatus({ uploading: true, error: null, success: null });

      for (const file of fileList) {
        try {
          const base64Data = await fileToBase64(file);
          await cenagemApi.createFamilyAttachment(ticketContext.familyId, {
            memberId: targetMemberId,
            category: PHOTO_CATEGORY,
            fileName: file.name,
            contentType: file.type || 'image/jpeg',
            base64Data,
            description: file.name,
          });
          setRecentUploads((prev) => [
            { name: file.name, at: new Date().toISOString() },
            ...prev,
          ].slice(0, 5));
          setStatus({
            uploading: true,
            error: null,
            success: `Foto "${file.name}" subida correctamente.`,
          });
        } catch (error) {
          console.error('No se pudo subir la foto con ticket', error);
          setStatus({
            uploading: false,
            error: `No se pudo subir "${file.name}". Intentá nuevamente.`,
            success: null,
          });
          return;
        }
      }

      setStatus((prev) => ({ ...prev, uploading: false }));
    },
    [ticketContext, selectedMemberId],
  );

  const familyCode = ticketContext.familyCode ?? '—';
  const selectedMemberLabel = useMemo(() => {
    if (members.length > 0) {
      const found = members.find((member) => member.id === selectedMemberId);
      if (found) return found.label;
    }
    return ticketContext.memberLabel ?? '—';
  }, [members, selectedMemberId, ticketContext.memberLabel]);

  if (!ticketContext?.familyId) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="text-base font-semibold text-red-600">
            Ticket inválido o vencido
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Volvé a la HC y generá un nuevo código QR para continuar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">HC {familyCode} · Fotos</h1>
          <div className="text-sm text-slate-600">
            Integrante: {selectedMemberLabel || 'Seleccioná un integrante'}
          </div>
          {countdown && (
            <div className="text-xs text-slate-500">
              {countdown === 'Expiró'
                ? 'El acceso venció. Si necesitás seguir cargando fotos, pedí un nuevo código.'
                : `El acceso vence en ${countdown}.`}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Cargá fotos desde tu galería o cámara. El equipo de CENAGEM podrá verlas inmediatamente dentro de la historia clínica.
        </div>

        <div className="grid gap-2">
          <label className="grid gap-1 text-xs text-slate-600">
            <span className="uppercase tracking-wide text-[11px] text-slate-500">Integrante</span>
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              disabled={membersLoading || members.length === 0 || status.uploading}
            >
              {members.length ? (
                members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.label}
                  </option>
                ))
              ) : (
                <option value="">
                  {membersLoading ? 'Cargando integrantes…' : 'Sin integrantes disponibles'}
                </option>
              )}
            </select>
          </label>
          {membersError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {membersError}
            </div>
          )}
        </div>

        <UploadPhotos disabled={status.uploading} onFiles={handleUploadFiles} />

        {status.uploading && (
          <div className="text-xs text-slate-500 text-center">Subiendo fotos…</div>
        )}

        {status.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {status.error}
          </div>
        )}

        {status.success && !status.error && !status.uploading && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {status.success}
          </div>
        )}

        {recentUploads.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">Últimas fotos cargadas</div>
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              {recentUploads.map((item) => (
                <li key={`${item.name}-${item.at}`}>{item.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhotosPage(props) {
  const sessionUser = useMemo(() => getUser(), []);
  if (sessionUser?.scope === 'upload-ticket') {
    return (
      <UploadTicketMode
        ticketContext={sessionUser?.uploadTicket ?? null}
      />
    );
  }
  return <StandardPhotosPage {...props} />;
}

function StandardPhotosPage({ familyId, inline = false, initialMemberId = '' }) {
  const [previews, setPreviews] = useState({});
  const [ticketInfo, setTicketInfo] = useState(null);
  const [ticketError, setTicketError] = useState(null);
  const [ticketRefreshKey, setTicketRefreshKey] = useState(0);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketCountdown, setTicketCountdown] = useState('');
  const qrCanvasRef = useRef(null);

  const {
    state,
    ensureFamilyDetail,
    createAttachment,
    deleteAttachment,
    downloadAttachment,
    listAttachmentsByFamily,
  } = useCenagemStore();

  useEffect(() => {
    if (familyId) {
      void ensureFamilyDetail(familyId, true);
    }
  }, [familyId, ensureFamilyDetail]);

  useEffect(() => {
    if (!familyId) return undefined;
    if (typeof window === 'undefined') return undefined;

    let cancelled = false;
    const shouldRefresh = () =>
      typeof document === 'undefined' || document.visibilityState === 'visible';

    const refreshAttachments = async () => {
      if (!familyId || cancelled || !shouldRefresh()) {
        return;
      }
      try {
        await listAttachmentsByFamily(familyId);
      } catch (error) {
        if (!cancelled) {
          console.warn('No se pudo actualizar la galería de fotos automáticamente', error);
        }
      }
    };

    const handleVisibility = () => {
      if (shouldRefresh()) {
        void refreshAttachments();
      }
    };

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    const intervalId = window.setInterval(() => {
      void refreshAttachments();
    }, AUTO_REFRESH_INTERVAL_MS);

    void refreshAttachments();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [familyId, listAttachmentsByFamily]);

  const family = useMemo(
    () => state.families.find((item) => item.id === familyId) || null,
    [state.families, familyId],
  );

  const members = useMemo(
    () => state.members.filter((member) => member.familyId === familyId),
    [state.members, familyId],
  );

  const photos = useMemo(
    () =>
      state.attachments.filter(
        (attachment) =>
          attachment.familyId === familyId && attachment.category === PHOTO_CATEGORY,
      ),
    [state.attachments, familyId],
  );

  const [selectedMemberId, setSelectedMemberId] = useState(() => initialMemberId || '');

  useEffect(() => {
    if (
      initialMemberId &&
      initialMemberId !== selectedMemberId &&
      members.some((member) => member.id === initialMemberId)
    ) {
      setSelectedMemberId(initialMemberId);
      return;
    }
    if (selectedMemberId && members.some((member) => member.id === selectedMemberId)) {
      return;
    }
    const fallbackId = members[0]?.id || '';
    if (fallbackId !== selectedMemberId) {
      setSelectedMemberId(fallbackId);
    }
  }, [members, selectedMemberId, initialMemberId]);

  useEffect(() => {
    if (inline || !family || typeof window === 'undefined') return;
    const baseHash = `#/family/${family.id}/photos`;
    const query = selectedMemberId ? `?member=${encodeURIComponent(selectedMemberId)}` : '';
    const targetHash = `${baseHash}${query}`;
    const currentHash = window.location.hash || '';
    if (currentHash !== targetHash) {
      const { pathname, search } = window.location;
      window.history.replaceState({}, '', `${pathname}${search}${targetHash}`);
    }
  }, [inline, family, selectedMemberId]);

  const fetchUploadTicket = useCallback(async () => {
    if (!familyId || !selectedMemberId) {
      setTicketInfo(null);
      setTicketError(null);
      setTicketLoading(false);
      return;
    }

    setTicketLoading(true);
    setTicketError(null);

    try {
      const response = await cenagemApi.createUploadTicket(familyId, {
        memberId: selectedMemberId,
      });
      setTicketInfo(response);
    } catch (error) {
      console.error('No se pudo generar el ticket de fotos', error);
      setTicketError('No se pudo generar el código QR. Intentá nuevamente.');
      setTicketInfo(null);
    } finally {
      setTicketLoading(false);
    }
  }, [familyId, selectedMemberId]);

  useEffect(() => {
    void fetchUploadTicket();
  }, [fetchUploadTicket, ticketRefreshKey]);

  useEffect(() => {
    if (!ticketInfo?.expiresAt) {
      setTicketCountdown('');
      return undefined;
    }

    const target = new Date(ticketInfo.expiresAt).getTime();
    const updateCountdown = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTicketCountdown('Expiró');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTicketCountdown(`${minutes}m ${String(seconds).padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [ticketInfo?.expiresAt]);

  useEffect(() => {
    if (!ticketInfo?.expiresAt) {
      return undefined;
    }

    const targetTime = new Date(ticketInfo.expiresAt).getTime();
    const timeUntilRefresh = targetTime - Date.now() - 60_000; // Refresh 1 minute before expiry

    let timeoutId;
    if (timeUntilRefresh > 0) {
      timeoutId = window.setTimeout(() => {
        setTicketRefreshKey((value) => value + 1);
      }, timeUntilRefresh);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [ticketInfo?.expiresAt]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) || null,
    [members, selectedMemberId],
  );

  const filteredPhotos = useMemo(() => {
    if (!selectedMemberId) return [];
    return photos.filter((photo) => photo.memberId === selectedMemberId);
  }, [photos, selectedMemberId]);

  const sortedPhotos = useMemo(
    () =>
      [...filteredPhotos].sort((a, b) => {
        const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }),
    [filteredPhotos],
  );

  const uploadUrl = useMemo(() => {
    if (typeof window === 'undefined' || !family || !ticketInfo?.ticket) return '';
    const { origin, pathname, search } = window.location;
    const base = `${origin}${pathname}${search}`;
    const params = new URLSearchParams();
    if (selectedMemberId) {
      params.set('member', selectedMemberId);
    }
    params.set('ticket', ticketInfo.ticket);
    return `${base}#/family/${family.id}/photos?${params.toString()}`;
  }, [family, selectedMemberId, ticketInfo]);

  const handleRefreshTicket = useCallback(() => {
    setTicketRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!qrCanvasRef.current || !uploadUrl) return;
    QRCode.toCanvas(qrCanvasRef.current, uploadUrl, {
      width: 192,
      margin: 1,
      errorCorrectionLevel: 'quartile',
    }).catch((error) => {
      console.error('No se pudo generar el QR para fotos', error);
    });
  }, [uploadUrl]);

  useEffect(() => {
    const validIds = new Set(photos.map((photo) => photo.id));
    setPreviews((prev) => {
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([id, entry]) => {
        if (validIds.has(id)) {
          next[id] = entry;
        } else {
          if (entry.generated) URL.revokeObjectURL(entry.url);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [photos]);

  useEffect(() => () => {
    Object.values(previews).forEach((entry) => {
      if (entry.generated) {
        URL.revokeObjectURL(entry.url);
      }
    });
  }, [previews]);

  useEffect(() => {
    const missing = filteredPhotos.filter((photo) => !previews[photo.id]);
    if (!missing.length) return undefined;
    let cancelled = false;

    (async () => {
      for (const photo of missing) {
        try {
          let url;
          let generated = false;
          if (photo.base64Data) {
            url = `data:${photo.contentType || 'image/*'};base64,${photo.base64Data}`;
          } else {
            const blob = await downloadAttachment(photo.id);
            if (cancelled) return;
            url = URL.createObjectURL(blob);
            generated = true;
          }
          setPreviews((prev) => {
            if (cancelled || prev[photo.id]) {
              if (generated) URL.revokeObjectURL(url);
              return prev;
            }
            return {
              ...prev,
              [photo.id]: { url, generated },
            };
          });
        } catch (error) {
          console.error('No se pudo obtener la imagen', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filteredPhotos, previews, downloadAttachment]);

  const handleUploadFiles = async (files) => {
    if (!familyId || !selectedMemberId) return;
    const fileList = Array.from(files || []);
    for (const file of fileList) {
      try {
        const attachment = await createAttachment(familyId, {
          memberId: selectedMemberId,
          category: PHOTO_CATEGORY,
          description: file.name,
          file,
        });
        if (attachment?.id) {
          const url = URL.createObjectURL(file);
          setPreviews((prev) => ({
            ...prev,
            [attachment.id]: { url, generated: true },
          }));
        }
      } catch (error) {
        console.error('No se pudo subir la foto', error);
      }
    }
  };

  const handleDeletePhoto = async (attachmentId) => {
    if (!familyId) return;
    try {
      await deleteAttachment(familyId, attachmentId);
    } catch (error) {
      console.error('No se pudo eliminar la foto', error);
    } finally {
      setPreviews((prev) => {
        const next = { ...prev };
        const entry = next[attachmentId];
        if (entry?.generated) {
          URL.revokeObjectURL(entry.url);
        }
        delete next[attachmentId];
        return next;
      });
    }
  };

  if (!familyId) {
    return (
      <div className={inline ? 'space-y-4' : 'p-6'}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          Seleccioná una familia para ver la galería de fotos.
        </div>
      </div>
    );
  }

  if (state.loading && !family) {
    return (
      <div className={inline ? 'space-y-4' : 'p-6'}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">Cargando fotos…</div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className={inline ? 'space-y-4' : 'p-6'}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          No se encontró la familia solicitada.
        </div>
      </div>
    );
  }

  const canUpload = Boolean(selectedMemberId && selectedMember);
  const memberName =
    selectedMember?.filiatorios?.nombreCompleto ||
    [selectedMember?.nombre, selectedMember?.apellido].filter(Boolean).join(' ') ||
    'Integrante';
  const memberRole = selectedMember?.rol || selectedMember?.role || '';
  const totalPhotos = sortedPhotos.length;
  const photosLabel = totalPhotos === 1 ? 'foto' : 'fotos';
  const autoRefreshLabel = `Actualización automática cada ${Math.round(
    AUTO_REFRESH_INTERVAL_MS / 1000,
  )} s`;

  return (
    <div className={inline ? 'space-y-6' : 'p-6 space-y-6'}>
      {!inline && (
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white shadow-lg">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" />
          <div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-300">
                Galería familiar
              </span>
              <h1 className="text-2xl font-semibold sm:text-3xl">
                HC {family.code || '—'} · Fotos
              </h1>
              <p className="text-sm text-slate-300">
                {selectedMember
                  ? `Integrante seleccionado: ${memberName}${memberRole ? ` · ${memberRole}` : ''}.`
                  : 'Seleccioná un integrante para navegar sus adjuntos fotográficos.'}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 text-left sm:text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                {autoRefreshLabel}
              </span>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100 shadow-inner backdrop-blur">
                <div className="text-2xl font-semibold leading-tight sm:text-3xl">{totalPhotos}</div>
                <div className="text-xs uppercase tracking-wide text-slate-300">
                  {selectedMember ? `${photosLabel} del integrante` : 'Fotos asignadas'}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div
        className={`grid gap-6 ${inline ? '' : 'lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,360px]'}`}
      >
        <main className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-800">
                {selectedMember ? `Galería de ${memberName}` : 'Seleccioná un integrante'}
              </h2>
              <p className="text-sm text-slate-500">
                {canUpload
                  ? `Podés adjuntar nuevas imágenes o administrar las ${totalPhotos} ${photosLabel} existentes.`
                  : 'Elegí un integrante para visualizar y cargar su galería de fotos.'}
              </p>
            </div>
            <UploadPhotos disabled={!canUpload} onFiles={handleUploadFiles} />
          </div>

          {!canUpload && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Elegí un integrante para visualizar y cargar su galería de fotos.
            </div>
          )}

          {canUpload && !sortedPhotos.length && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Aún no se cargaron fotos para este integrante.
            </div>
          )}

          {canUpload && sortedPhotos.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sortedPhotos.map((photo) => {
                const preview = previews[photo.id]?.url;
                const description = photo.description || photo.fileName || 'Foto';
                return (
                  <article
                    key={photo.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/5] bg-slate-200">
                      {preview ? (
                        <a
                          href={preview}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0"
                        >
                          <img
                            src={preview}
                            alt={description}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </a>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          Cargando vista previa…
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <div className="relative grid gap-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800" title={description}>
                            {description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(photo.createdAt)}
                          </p>
                        </div>
                        {preview && (
                          <a
                            href={preview}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600 transition hover:bg-emerald-100"
                          >
                            Abrir
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Eliminar foto
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Integrantes</h2>
                <p className="text-xs text-slate-500">
                  Las fotos se adjuntan al integrante seleccionado.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                {members.length}
              </span>
            </div>
            <ul className="mt-4 grid gap-2">
              {members.map((member) => {
                const isActive = member.id === selectedMemberId;
                const label =
                  member.filiatorios?.nombreCompleto ||
                  [member.nombre, member.apellido].filter(Boolean).join(' ') ||
                  member.rol ||
                  'Integrante';
                const badge = member.rol || member.role || null;
                const ageLabel = member.nacimiento ? yearsSince(member.nacimiento) : null;
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`group flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{label}</span>
                          {badge && (
                            <span className={`text-[10px] uppercase tracking-wide ${
                              isActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {badge}
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${
                          isActive ? 'text-emerald-600/80' : 'text-slate-500'
                        }`}>
                          {ageLabel && <span>{ageLabel}</span>}
                          {member.sexo && <span className="uppercase">{member.sexo}</span>}
                        </div>
                      </div>
                      <span
                        className={`inline-flex h-2.5 w-2.5 flex-none rounded-full ${
                          isActive
                            ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]'
                            : 'bg-slate-200 group-hover:bg-emerald-300'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
              {!members.length && (
                <li>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    No hay integrantes registrados en esta familia.
                  </div>
                </li>
              )}
            </ul>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Carga remota</h2>
                <p className="text-xs text-slate-500">
                  Compartí el QR para que familiares suban fotos sin ingresar al sistema.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshTicket}
                disabled={ticketLoading}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ticketLoading ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>

            {ticketError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {ticketError}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <canvas
                  ref={qrCanvasRef}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                />
                {ticketCountdown && (
                  <span className="text-xs text-slate-500">
                    {ticketCountdown === 'Expiró'
                      ? 'El enlace venció. Generá uno nuevo para continuar.'
                      : `Vence en ${ticketCountdown}.`}
                  </span>
                )}
              </div>
            )}

            {uploadUrl && (
              <div className="grid gap-2">
                <label className="text-xs font-medium text-slate-500" htmlFor="upload-ticket-url">
                  Enlace directo
                </label>
                <textarea
                  id="upload-ticket-url"
                  readOnly
                  value={uploadUrl}
                  onFocus={(event) => event.target.select()}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 focus:border-emerald-400 focus:outline-none"
                  rows={3}
                />
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-800">Resumen rápido</h2>
            <div className="mt-3 grid gap-3 text-xs text-slate-500">
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span>Archivos del integrante</span>
                <span className="font-medium text-slate-700">{totalPhotos}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span>Estado de ticket</span>
                <span className="font-medium text-emerald-600">
                  {ticketCountdown === 'Expiró' ? 'Vencido' : 'Activo'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span>Actualización</span>
                <span className="font-medium text-slate-700">Automática</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
