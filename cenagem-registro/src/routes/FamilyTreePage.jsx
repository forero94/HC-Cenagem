import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { cenagemApi } from '@/lib/apiClient';
import { getUser } from '@/modules/auth/useAuth';
import { useCenagemStore } from '@/store/cenagemStore';

const TREE_CATEGORY = 'TREE'; // Conceptual category for tree photos (not yet available in API)
const TREE_ATTACHMENT_CATEGORY = 'PHOTO'; // Backend-allowed category used for uploads
const TREE_ATTACHMENT_TAG = 'TREE_GALLERY';
const TREE_ATTACHMENT_METADATA_KEY = 'treeGallery';
const AUTO_REFRESH_INTERVAL_MS = 15_000;

const ensureTreeAttachmentPayload = (payload = {}) => {
  const normalizedTags = Array.isArray(payload.tags)
    ? payload.tags.filter(Boolean)
    : [];
  const hasTreeTag = normalizedTags.some(
    (tag) => typeof tag === 'string' && tag.toUpperCase() === TREE_ATTACHMENT_TAG,
  );
  const tags = hasTreeTag ? normalizedTags : [...normalizedTags, TREE_ATTACHMENT_TAG];

  return {
    ...payload,
    category: TREE_ATTACHMENT_CATEGORY,
    tags,
    metadata: {
      ...(payload.metadata || {}),
      [TREE_ATTACHMENT_METADATA_KEY]: true,
    },
  };
};

const isTreeAttachment = (attachment) => {
  if (!attachment) return false;
  if (attachment.category === TREE_CATEGORY) {
    return true;
  }
  if (attachment.category !== TREE_ATTACHMENT_CATEGORY) {
    return false;
  }
  if (attachment.metadata?.[TREE_ATTACHMENT_METADATA_KEY]) {
    return true;
  }
  if (!Array.isArray(attachment.tags)) {
    return false;
  }
  return attachment.tags.some(
    (tag) => typeof tag === 'string' && tag.toUpperCase() === TREE_ATTACHMENT_TAG,
  );
};

// --- Image compression utilities (copied from PhotosPage.jsx) ---
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB límite objetivo por imagen
const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52];

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    const value = new Date(iso);
    return value.toLocaleString('es-AR');
  } catch (error) {
    console.warn('No se pudo formatear la fecha de la foto del árbol', error);
    return iso;
  }
};

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

function UploadTreePhotos({ disabled, onFiles }) {
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
        <span>➕ Agregar fotos del árbol</span>
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
        Las imágenes se adjuntan a la familia y quedan disponibles para todo el equipo.
      </div>
    </div>
  );
}

function UploadTicketMode({ ticketContext }) {
  const [status, setStatus] = useState({ uploading: false, error: null, success: null });
  const [recentUploads, setRecentUploads] = useState([]);
  const [countdown, setCountdown] = useState('');

  const expiresAt = useMemo(() => {
    if (!ticketContext?.expiresAt) return null;
    const value = new Date(ticketContext.expiresAt);
    return Number.isNaN(value.getTime()) ? null : value;
  }, [ticketContext?.expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      setCountdown('');
      return undefined;
    }
    const updateCountdown = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Expiró');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}m ${String(seconds).padStart(2, '0')}s`);
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const handleUploadFiles = useCallback(
    async (files) => {
      if (!ticketContext?.familyId) {
        setStatus({
          uploading: false,
          error: 'El ticket no está asociado a una familia. Pedí un nuevo código.',
          success: null,
        });
        return;
      }
      const collection = Array.from(files || []);
      if (!collection.length) return;

      setStatus({ uploading: true, error: null, success: null });
      for (const file of collection) {
        try {
          const base64Data = await fileToBase64(file);
          await cenagemApi.createFamilyAttachment(
            ticketContext.familyId,
            ensureTreeAttachmentPayload({
              fileName: file.name,
              contentType: file.type || 'image/jpeg',
              base64Data,
              description: file.name,
            }),
          );
          setRecentUploads((prev) =>
            [{ name: file.name, at: new Date().toISOString() }, ...prev].slice(0, 5),
          );
          setStatus({
            uploading: true,
            error: null,
            success: `Foto "${file.name}" subida correctamente.`,
          });
        } catch (error) {
          console.error('No se pudo subir la foto del árbol con ticket', error);
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
    [ticketContext?.familyId],
  );

  if (!ticketContext?.familyId) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="text-base font-semibold text-red-600">Ticket inválido o vencido</div>
          <p className="mt-2 text-sm text-slate-600">
            Volvé a la HC y generá un nuevo código QR para continuar.
          </p>
        </div>
      </div>
    );
  }

  const familyCode = ticketContext.familyCode ?? '—';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">HC {familyCode} · Árbol familiar</h1>
          <div className="text-sm text-slate-600">Carga remota de fotos del árbol familiar.</div>
          {countdown && (
            <div className="text-xs text-slate-500">
              {countdown === 'Expiró'
                ? 'El acceso venció. Si necesitás seguir cargando fotos, pedí un nuevo código.'
                : `El acceso vence en ${countdown}.`}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Subí fotos del árbol desde tu galería o cámara. El equipo de CENAGEM podrá verlas
          inmediatamente dentro de la historia clínica.
        </div>

        <UploadTreePhotos disabled={status.uploading} onFiles={handleUploadFiles} />

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

function StandardFamilyTreePage({ familyId, inline = false }) {
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

  const treePhotos = useMemo(
    () =>
      state.attachments.filter(
        (attachment) => attachment.familyId === familyId && isTreeAttachment(attachment),
      ),
    [state.attachments, familyId],
  );

  const sortedTreePhotos = useMemo(
    () =>
      [...treePhotos].sort((a, b) => {
        const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }),
    [treePhotos],
  );

  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (const photo of sortedTreePhotos) {
        if (!photo?.id || previews[photo.id]) continue;
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
          console.error('No se pudo obtener la imagen del árbol familiar', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sortedTreePhotos, previews, downloadAttachment]);

  useEffect(() => {
    const validIds = new Set(sortedTreePhotos.map((photo) => String(photo.id)));
    setPreviews((prev) => {
      let changed = false;
      const next = {};
      for (const [id, value] of Object.entries(prev)) {
        if (validIds.has(id)) {
          next[id] = value;
          continue;
        }
        changed = true;
        if (value?.generated) {
          URL.revokeObjectURL(value.url);
        }
      }
      return changed ? next : prev;
    });
  }, [sortedTreePhotos]);

  useEffect(
    () => () => {
      Object.values(previews).forEach((entry) => {
        if (entry?.generated) {
          URL.revokeObjectURL(entry.url);
        }
      });
    },
    [previews],
  );

  const fetchUploadTicket = useCallback(async () => {
    if (!familyId) {
      setTicketInfo(null);
      setTicketError(null);
      setTicketLoading(false);
      return;
    }

    setTicketLoading(true);
    setTicketError(null);

    try {
      // For tree photos, the upload ticket is associated with the family, not a specific member
      const response = await cenagemApi.createUploadTicket(familyId);
      setTicketInfo(response);
    } catch (error) {
      console.error('No se pudo generar el ticket de carga para el árbol familiar', error);
      setTicketError('No se pudo generar el código QR. Intentá nuevamente.');
      setTicketInfo(null);
    } finally {
      setTicketLoading(false);
    }
  }, [familyId]);

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

  const uploadUrl = useMemo(() => {
    if (typeof window === 'undefined' || !family || !ticketInfo?.ticket) return '';
    const { origin, pathname, search } = window.location;
    const base = `${origin}${pathname}${search}`;
    const params = new URLSearchParams();
    params.set('ticket', ticketInfo.ticket);
    // For tree photos, we might not need a specific memberId in the URL
    return `${base}#/family/${family.id}/tree?${params.toString()}`;
  }, [family, ticketInfo]);

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
      console.error('No se pudo generar el QR para el árbol familiar', error);
    });
  }, [uploadUrl]);

  const handleUploadFiles = async (files) => {
    if (!familyId) return;
    const fileList = Array.from(files || []);
    let hasChanges = false;
    for (const file of fileList) {
      try {
        const attachment = await createAttachment(
          familyId,
          ensureTreeAttachmentPayload({
            description: file.name,
            file,
          }),
        );
        if (attachment?.id) {
          const url = URL.createObjectURL(file);
          setPreviews((prev) => ({
            ...prev,
            [attachment.id]: { url, generated: true },
          }));
        }
        hasChanges = true;
      } catch (error) {
        console.error('No se pudo subir la foto del árbol familiar', error);
      }
    }
    if (hasChanges) {
      try {
        await listAttachmentsByFamily(familyId);
      } catch (error) {
        console.warn('No se pudo refrescar la galería del árbol luego de la carga', error);
      }
    }
  };

  const handleDeletePhoto = useCallback(
    async (attachmentId) => {
      if (!familyId || !attachmentId) return;
      try {
        await deleteAttachment(familyId, attachmentId);
      } catch (error) {
        console.error('No se pudo eliminar la foto del árbol familiar', error);
      } finally {
        setPreviews((prev) => {
          if (!prev[attachmentId]) return prev;
          const next = { ...prev };
          const entry = next[attachmentId];
          if (entry?.generated) {
            URL.revokeObjectURL(entry.url);
          }
          delete next[attachmentId];
          return next;
        });
      }
    },
    [familyId, deleteAttachment],
  );

  if (!familyId) {
    return (
      <div className={inline ? 'space-y-4' : 'p-6'}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          Seleccioná una familia para ver el árbol familiar.
        </div>
      </div>
    );
  }

  if (state.loading && !family) {
    return (
      <div className={inline ? 'space-y-4' : 'p-6'}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">Cargando árbol familiar…</div>
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

  const totalTreePhotos = sortedTreePhotos.length;
  const treePhotosLabel = totalTreePhotos === 1 ? 'foto' : 'fotos';
  const autoRefreshLabel = `Actualización automática cada ${Math.round(
    AUTO_REFRESH_INTERVAL_MS / 1000,
  )} s`;

  return (
    <div className={inline ? 'space-y-6' : 'p-6 space-y-6'}>
      <div
        className={`grid gap-6 ${inline ? '' : 'lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,360px]'}`}
      >
        <main className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-slate-800">
                Galería del árbol familiar
              </h1>
              <p className="text-sm text-slate-500">
                {totalTreePhotos
                  ? `Hay ${totalTreePhotos} ${treePhotosLabel}. ${autoRefreshLabel}.`
                  : 'Aún no se cargaron fotos para el árbol familiar.'}
              </p>
            </div>
            <UploadTreePhotos onFiles={handleUploadFiles} />
          </div>

          {!sortedTreePhotos.length && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Aún no se cargaron fotos para el árbol familiar.
            </div>
          )}

          {sortedTreePhotos.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sortedTreePhotos.map((photo) => {
                const preview = previews[photo.id]?.url || null;
                const description = photo.description || photo.fileName || 'Árbol familiar';
                return (
                  <article
                    key={photo.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-200">
                      {preview ? (
                        <img
                          src={preview}
                          alt={description}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-slate-500">
                          Vista previa no disponible
                        </div>
                      )}
                    </div>
                    <div className="relative grid gap-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800" title={description}>
                            {description}
                          </p>
                          <p className="text-xs text-slate-400">{formatDateTime(photo.createdAt)}</p>
                        </div>
                        <a
                          href={preview || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 ${preview ? '' : 'pointer-events-none opacity-50'}`}
                          onClick={(event) => {
                            if (!preview) {
                              event.preventDefault();
                            }
                          }}
                        >
                          Ver grande
                        </a>
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
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Carga remota del árbol</h2>
                <p className="text-xs text-slate-500">
                  Compartí el QR para que familiares suban fotos del árbol sin ingresar al sistema.
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
                <span>Archivos del árbol</span>
                <span className="font-medium text-slate-700">{totalTreePhotos}</span>
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

export default function FamilyTreePage({ familyId, inline = false }) {
  const sessionUser = useMemo(() => getUser(), []);
  if (sessionUser?.scope === 'upload-ticket') {
    return <UploadTicketMode ticketContext={sessionUser?.uploadTicket ?? null} />;
  }
  return <StandardFamilyTreePage familyId={familyId} inline={inline} />;
}
