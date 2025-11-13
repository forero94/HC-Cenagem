// ===============================
// src/routes/MembersPage.jsx — Administración de miembros (API)
// ===============================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';
import AddMemberModal from './AddMemberModal.jsx';
import EditMemberForm from './EditMemberForm.jsx';

const DEFAULT_SEX = 'U';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!members.length) {
      setSelectedId('');
      return;
    }
    if (!selectedId) {
      const probando = members.find(m => m.role === 'Probando');
      setSelectedId(probando ? probando.id : members[0].id);
      return;
    }
    if (!members.some((member) => member.id === selectedId)) {
      setSelectedId(members[0].id);
    }
    setIsEditing(null); // Close edit form when changing member
  }, [members, selectedId]);

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const haystack = [
        member.givenName,
        member.lastName,
        member.filiatorios?.iniciales,
        member.role,
        member.sex,
        member.os,
        member.diagnosis,
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

  const handleAddMember = useCallback(async (payload) => {
    if (!family) return;
    try {
      const created = await createMember(payload);
      if (created?.id) {
        setSelectedId(created.id);
      }
    } catch (error) {
      console.error('No se pudo crear el miembro', error);
      // Optionally, show an error to the user
    }
  }, [createMember, family]);


  const handleUpdateMember = useCallback(
    async (memberId, patch) => {
      setIsUpdating(true);
      try {
        await updateMember(memberId, patch);
        setIsEditing(null); // Close form on success
      } catch (error) {
        console.error('No se pudo actualizar el miembro', error);
      } finally {
        setIsUpdating(false);
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
    <div className={inline ? '' : 'app-shell p-6 grid gap-4'}>
      {isModalOpen && (
        <AddMemberModal
          family={family}
          onAdd={handleAddMember}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {!inline && (
        <div className="mb-3 flex items-center justify-between text-white">
          <button
            type="button"
            onClick={goBack}
            className="px-3 py-2 rounded-xl border border-white/40 text-white hover:bg-white/10 transition"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold text-white">HC {family.code} · Miembros (administración)</h2>
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-white/40 text-white hover:bg-white/10 transition"
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
              <div className="text-xs text-slate-500">Pacientes de la familia bajo seguimiento.</div>
            </div>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              ➕ Agregar Paciente
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, rol, DNI..."
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
                    <div className="text-sm font-medium">
                      {member.givenName || 'Miembro'} {member.lastName}
                    </div>
                    <span className="text-xs opacity-80">{member.role || '—'}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {yearsSince(member.birthDate)} · DNI: {member.filiatorios?.dni || 'N/A'}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!activeMember ? (
            <div className="text-sm text-slate-500">Seleccioná un integrante para editar su registro.</div>
          ) : isEditing === activeMember.id ? (
            <EditMemberForm
              member={activeMember}
              onUpdate={handleUpdateMember}
              onCancel={() => setIsEditing(null)}
              isUpdating={isUpdating}
            />
          ) : (
            <div className="grid gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{activeMember.givenName || 'Miembro sin nombre'} {activeMember.lastName}</div>
                  <div className="text-xs text-slate-500">
                    HC {family.code} · {activeMember.role || 'Rol sin definir'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={() => setIsEditing(activeMember.id)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteMember(activeMember.id)}
                  >
                    🗑 Eliminar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Nombre</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{activeMember.givenName || '—'}</div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Apellido</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{activeMember.lastName || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Sexo</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{activeMember.sexo || '—'}</div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Rol</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{activeMember.role || '—'}</div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">DNI</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{activeMember.filiatorios?.dni || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Nacimiento</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{activeMember.birthDate ? activeMember.birthDate.slice(0, 10) : '—'}</div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Diagnóstico principal</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{activeMember.diagnosis || '—'}</div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-600">Resumen / Notas Clínicas</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[96px]">
                  {activeMember.summary || '—'}
                </div>
              </div>
              
              <div className="text-[11px] text-slate-500">
                Esta página administra <b>miembros</b> (identidad, demografía, rol). Las evoluciones y estudios se gestionan en sus respectivas pestañas.
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
