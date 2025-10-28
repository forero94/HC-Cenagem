// ===============================
// src/routes/PhotosPage.jsx — Galería de fotos (adjuntos categoría PHOTO)
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';

const PHOTO_CATEGORY = 'PHOTO';

const yearsSince = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) years -= 1;
  return `${years}a`;
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

export default function PhotosPage({ familyId, inline = false }) {
  const {
    state,
    ensureFamilyDetail,
    createAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useCenagemStore();

  useEffect(() => {
    if (familyId) {
      void ensureFamilyDetail(familyId, true);
    }
  }, [familyId, ensureFamilyDetail]);

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

  const [selectedMemberId, setSelectedMemberId] = useState(() => members[0]?.id || '');
  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
      return;
    }
    if (selectedMemberId && !members.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(members[0]?.id || '');
    }
  }, [members, selectedMemberId]);

  const filteredPhotos = useMemo(() => {
    if (!selectedMemberId) return [];
    return photos.filter((photo) => photo.memberId === selectedMemberId);
  }, [photos, selectedMemberId]);

  const [previews, setPreviews] = useState({});

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
    if (!selectedMemberId) return;
    const fileList = Array.from(files || []);
    for (const file of fileList) {
      try {
        const attachment = await createAttachment({
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
    try {
      await deleteAttachment(attachmentId);
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

  if (!family) {
    return inline ? null : (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia.</div>
      </div>
    );
  }

  return (
    <div className={inline ? '' : 'p-6 grid gap-4'}>
      {!inline && (
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => { window.location.hash = `#/family/${family.id}`; }}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold">HC {family.code} · Fotos</h2>
          <div />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <div className="text-sm font-semibold">Galería</div>

            {filteredPhotos.length === 0 && (
              <div className="text-sm text-slate-500">No hay fotos registradas para este miembro.</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredPhotos.map((photo) => {
                const member = members.find((item) => item.id === photo.memberId);
                const preview = previews[photo.id]?.url;
                return (
                  <div key={photo.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="aspect-square bg-slate-100 flex items-center justify-center">
                      {preview ? (
                        <img src={preview} alt={photo.description || 'Foto'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-500">Cargando vista previa…</span>
                      )}
                    </div>
                    <div className="p-2 text-xs text-slate-600 flex items-center justify-between">
                      <div className="truncate">
                        {(member?.filiatorios?.iniciales || member?.rol || '—')}
                        {photo.description ? ` · ${photo.description}` : ''}
                      </div>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-red-50"
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3 h-fit">
          <div className="text-sm font-semibold">Miembros</div>
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`text-left px-3 py-2 rounded-xl border ${
                selectedMemberId === member.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm">
                <b>{member.filiatorios?.iniciales || member.rol}</b> · {member.nombre || '—'}
              </div>
              <div className="text-xs text-slate-600">
                {yearsSince(member.nacimiento)} · OS: {member.os || '—'}
              </div>
            </button>
          ))}

          <UploadPhotos disabled={!selectedMemberId} onFiles={handleUploadFiles} />
        </aside>
      </div>

      {!inline && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center gap-2">
            <button
              onClick={() => { window.location.hash = `#/family/${family.id}`; }}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm"
            >
              ↩ Volver a HC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
