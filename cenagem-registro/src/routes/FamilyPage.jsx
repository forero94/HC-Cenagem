import React, { useCallback, useEffect, useMemo } from 'react';
import FamilyDetail from './FamilyDetail.jsx';

import { useCenagemStore } from '@/store/cenagemStore';

export default function FamilyPage({ user = { email: 'genetista@cenagem.gob.ar' }, familyId }) {
  const {
    state,
    loading: familiesLoading,
    ensureFamilyDetail,
    addEvolution,
    createMember,
    updateMember,
    deleteMember,
    updateFamily,
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

  const evolutions = useMemo(
    () => state.evolutions.filter((item) => item.familyId === familyId),
    [state.evolutions, familyId],
  );

  const studies = useMemo(
    () => state.studies.filter((study) => study.familyId === familyId),
    [state.studies, familyId],
  );

  const attachments = useMemo(
    () => state.attachments.filter((attachment) => attachment.familyId === familyId),
    [state.attachments, familyId],
  );

  useEffect(() => {
    if (!familyId) {
      const h = (window.location.hash || '').replace(/^#\/?/, '');
      const [, id] = h.split('/');
      if (id && !family) {
        window.location.hash = `#/family/${id}`;
      }
    }
  }, [familyId, family]);

  const handleAddEvolution = useCallback(
    async (memberId, texto) => {
      try {
        await addEvolution(
          memberId,
          texto,
          (user?.displayName && user.displayName.trim()) ||
            user?.email ||
            'registro',
        );
      } catch (error) {
        console.error('No se pudo registrar la evolución', error);
      }
    },
    [addEvolution, user],
  );

  const handleCreateMember = useCallback(
    (payload) => {
      if (!familyId) {
        return Promise.resolve(null);
      }
      return createMember(familyId, payload);
    },
    [createMember, familyId],
  );

  const handleDeleteMember = useCallback(
    (memberId) => deleteMember(memberId),
    [deleteMember],
  );

  if (familiesLoading && !family) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">Cargando familia...</div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia solicitada.</div>
      </div>
    );
  }

  return (
    <div className="app-shell p-6 grid gap-4">
      <FamilyDetail
        family={family}
        members={members}
        evolutions={evolutions}
        studies={studies}
        attachments={attachments}
        downloadAttachment={downloadAttachment}
        onBack={() => { window.location.hash = ''; }}
        onAddEvolution={handleAddEvolution}
        onCreateMember={handleCreateMember}
        onUpdateMember={updateMember}
        onDeleteMember={handleDeleteMember}
        onUpdateFamily={updateFamily}
        initialTab="resumen"
      />
    </div>
  );
}
