// ===============================
// src/routes/MembersPage.jsx — Administración de miembros (API)
// ===============================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';

const DEFAULT_OS = '—';
const DEFAULT_SEX = 'U';
const INITIAL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const yearsSince = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) years -= 1;
  return `${years}a`;
};

const pickInitials = (members) => {
  const taken = new Set(
    members
      .map((member) => member.filiatorios?.iniciales || member.rol || '')
      .filter(Boolean)
      .map((value) => value.toUpperCase()),
  );
  for (const letter of INITIAL_LETTERS) {
    const candidate = `${letter}1`;
    if (!taken.has(candidate)) return candidate;
  }
  return `N${members.length + 1}`;
};

const buildNewMemberPayload = (family, members) => ({
  familyId: family.id,
  rol: '',
  filiatorios: { iniciales: pickInitials(members) },
  nombre: '',
  sexo: DEFAULT_SEX,
  nacimiento: '',
  estado: 'vivo',
  os: DEFAULT_OS,
  notas: [],
});

function useMembersManager(familyId) {
  const {
    state,
    loading,
    ensureFamilyDetail,
    createMember: createMemberInStore,
    updateMember: updateMemberInStore,
    deleteMember: deleteMemberInStore,
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

  const createMember = useCallback(
    async (input) => {
      if (!familyId) return null;
      return createMemberInStore(familyId, input);
    },
    [createMemberInStore, familyId],
  );

  const deleteMember = useCallback(
    async (memberId) => deleteMemberInStore(memberId),
    [deleteMemberInStore],
  );

  const reload = useCallback(() => {
    if (familyId) {
      void ensureFamilyDetail(familyId, true);
    }
  }, [familyId, ensureFamilyDetail]);

  return {
    family,
    members,
    loading,
    createMember,
    updateMember: updateMemberInStore,
    deleteMember,
    reload,
  };
}

export default function MembersPage({ familyId, inline = false }) {
  const {
    family,
    members,
    loading,
    createMember,
    updateMember,
    deleteMember,
    reload,
  } = useMembersManager(familyId);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!members.length) {
      setSelectedId('');
      return;
    }
    if (!selectedId) {
      setSelectedId(members[0].id);
      return;
    }
    if (!members.some((member) => member.id === selectedId)) {
      setSelectedId(members[0].id);
    }
  }, [members, selectedId]);

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const haystack = [
        member.nombre,
        member.filiatorios?.iniciales,
        member.rol,
        member.sexo,
        member.os,
        member.estado,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [members, search]);

  const activeMember = useMemo(
    () => members.find((member) => member.id === selectedId) || null,
    [members, selectedId],
  );

  const handleCreateMember = useCallback(async () => {
    if (!family) return;
    try {
      const created = await createMember(buildNewMemberPayload(family, members));
      if (created?.id) {
        setSelectedId(created.id);
      }
    } catch (error) {
      console.error('No se pudo crear el miembro', error);
    }
  }, [createMember, family, members]);

  const handleUpdateMember = useCallback(
    async (memberId, patch) => {
      try {
        await updateMember(memberId, patch);
      } catch (error) {
        console.error('No se pudo actualizar el miembro', error);
      }
    },
    [updateMember],
  );

  const handleDeleteMember = useCallback(
    async (memberId) => {
      try {
        await deleteMember(memberId);
        if (selectedId === memberId) {
          setSelectedId('');
        }
      } catch (error) {
        console.error('No se pudo eliminar el miembro', error);
      }
    },
    [deleteMember, selectedId],
  );

  if (!family) {
    if (loading) {
      return inline
        ? null
        : (
          <div className="p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">Cargando familia...</div>
          </div>
        );
    }
    return inline
      ? null
      : (
        <div className="p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia solicitada.</div>
        </div>
      );
  }

  const goBack = () => {
    if (family?.id) {
      window.location.hash = `#/family/${family.id}`;
    } else {
      window.location.hash = '#/family/';
    }
  };

  return (
    <div className={inline ? '' : 'p-6'}>
      {!inline && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold">HC {family.code} · Miembros (administración)</h2>
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
            onClick={reload}
            disabled={loading}
          >
            ↻ Refrescar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[380px_1fr] min-h-[calc(100vh-6rem)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Miembros registrados</div>
              <div className="text-xs text-slate-500">Seleccioná un miembro para editar su información.</div>
            </div>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
              onClick={handleCreateMember}
            >
              ➕ Agregar
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, iniciales, OS..."
            className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="grid gap-2">
            {filteredMembers.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                No hay miembros que coincidan con la búsqueda.
              </div>
            )}
            {filteredMembers.map((member) => {
              const isActive = selectedId === member.id;
              const buttonClass = [
                'text-left px-3 py-2 rounded-xl border transition-colors',
                isActive ? 'border-slate-900 bg-slate-900/10' : 'border-slate-300 hover:bg-slate-50',
              ].join(' ');
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedId(member.id)}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <b>{member.filiatorios?.iniciales || member.rol || '—'}</b> · {member.nombre || '—'}
                    </div>
                    <span className="text-xs opacity-80">{member.estado || '—'}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {yearsSince(member.nacimiento)} · OS: {member.os || DEFAULT_OS}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!activeMember ? (
            <div className="text-sm text-slate-500">Seleccioná un integrante para editar su registro.</div>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{activeMember.nombre || 'Miembro sin nombre'}</div>
                  <div className="text-xs text-slate-500">
                    HC {family.code} · {activeMember.filiatorios?.iniciales || activeMember.rol || 'Rol sin definir'}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteMember(activeMember.id)}
                >
                  🗑 Eliminar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Iniciales</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={activeMember.filiatorios?.iniciales || ''}
                    onChange={(event) =>
                      void handleUpdateMember(activeMember.id, {
                        filiatorios: {
                          ...(activeMember.filiatorios || {}),
                          iniciales: event.target.value,
                        },
                      })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Nombre completo</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={activeMember.nombre || ''}
                    onChange={(event) => void handleUpdateMember(activeMember.id, { nombre: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Sexo</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={activeMember.sexo || DEFAULT_SEX}
                    onChange={(event) => void handleUpdateMember(activeMember.id, { sexo: event.target.value })}
                  >
                    <option value="U">—</option>
                    <option value="F">F</option>
                    <option value="M">M</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Rol</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={activeMember.rol || ''}
                    onChange={(event) => void handleUpdateMember(activeMember.id, { rol: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Estado</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={activeMember.estado || 'vivo'}
                    onChange={(event) => void handleUpdateMember(activeMember.id, { estado: event.target.value })}
                  >
                    <option value="vivo">vivo</option>
                    <option value="fallecido">fallecido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Nacimiento (ISO)</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={activeMember.nacimiento ? activeMember.nacimiento.slice(0, 10) : ''}
                    onChange={(event) =>
                      void handleUpdateMember(activeMember.id, { nacimiento: event.target.value || '' })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-slate-600">Obra social</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={activeMember.os || DEFAULT_OS}
                    onChange={(event) => void handleUpdateMember(activeMember.id, { os: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-600">Notas (JSON simple)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                  rows={4}
                  value={JSON.stringify(activeMember.notas || [], null, 2)}
                  onChange={(event) => {
                    try {
                      const parsed = JSON.parse(event.target.value || '[]');
                      if (Array.isArray(parsed)) {
                        void handleUpdateMember(activeMember.id, { notas: parsed });
                      }
                    } catch {
                      // Ignorar errores de parseo
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <button
                  type="button"
                  className="rounded-xl border border-amber-400 bg-amber-50 px-3 py-2 text-amber-900 hover:bg-amber-100"
                  onClick={() => void handleUpdateMember(activeMember.id, { rol: 'Proband' })}
                >
                  Marcar Proband
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-amber-400 bg-amber-50 px-3 py-2 text-amber-900 hover:bg-amber-100"
                  onClick={() => void handleUpdateMember(activeMember.id, { rol: 'M1' })}
                >
                  Marcar Madre (M1)
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-amber-400 bg-amber-50 px-3 py-2 text-amber-900 hover:bg-amber-100"
                  onClick={() => void handleUpdateMember(activeMember.id, { rol: 'P1' })}
                >
                  Marcar Padre (P1)
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-3 py-2 hover:bg-slate-50"
                  onClick={() => setSelectedId('')}
                >
                  Limpiar selección
                </button>
              </div>

              <div className="text-[11px] text-slate-500">
                Esta página administra <b>miembros</b> (identidad, demografía, rol).
              </div>
            </div>
          )}
        </section>
      </div>

      {!inline && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50 shadow-sm"
            >
              ↩ Volver a HC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
