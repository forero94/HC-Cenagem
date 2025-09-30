import React, { useEffect, useMemo, useState } from 'react';

/**
 * Panel lateral para editar miembros del pedigrí en el sandbox local.
 */
const EMPTY_FORM = { nombre: '', edad: '', simbolo: 'auto', estado: 'vivo' };

export default function MemberSidebar({ activeId, mergedMembers, draftReady, actions }) {
  const active = useMemo(
    () => mergedMembers.find((member) => member.id === activeId) || null,
    [mergedMembers, activeId]
  );

  const yearsSince = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const n = new Date();
    let y = n.getFullYear() - d.getFullYear();
    const m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) y--;
    return `${y}`;
  };

  const ageFromMember = (member) => {
    if (!member) return '';
    if (member.edadTexto != null && `${member.edadTexto}`.trim() !== '') return `${member.edadTexto}`;
    if (typeof member.edadCalculada === 'number') return `${member.edadCalculada}`;
    return yearsSince(member.nacimiento) || '';
  };

  const symbolForMember = (member) => {
    if (!member) return 'auto';
    if (member.simbolo && member.simbolo !== '') return member.simbolo;
    if (member.sexo === 'M') return 'square';
    if (member.sexo === 'F') return 'circle';
    return 'auto';
  };

  const [form, setForm] = useState(EMPTY_FORM);

  const partner = useMemo(() => {
    if (!active) return null;
    if (active.parejaDe) {
      return mergedMembers.find((member) => member.id === active.parejaDe) || null;
    }
    return mergedMembers.find((member) => member.parejaDe === active.id) || null;
  }, [active, mergedMembers]);

  const currentBroken = !!(active?.vinculoRoto || partner?.vinculoRoto);

  useEffect(() => {
    if (!active) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      nombre: active.nombre || '',
      edad: ageFromMember(active),
      simbolo: symbolForMember(active),
      estado: active.estado || 'vivo',
    });
  }, [active]);

  const isDisabled = !draftReady;

  const updateMember = (patch) => {
    if (!active?.id || isDisabled) return;
    actions?.updateMember?.(active.id, patch);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (isDisabled) return;
    if (field === 'nombre') updateMember({ nombre: value });
    if (field === 'edad') updateMember({ edadTexto: value });
    if (field === 'estado') updateMember({ estado: value });
    if (field === 'simbolo') {
      const patch = { simbolo: value };
      if (value === 'square') patch.sexo = 'M';
      else if (value === 'circle') patch.sexo = 'F';
      else if (value === 'diamond') patch.sexo = '';
      updateMember(patch);
    }
  };


  const handleToggleBroken = (value) => {
    if (!active?.id || isDisabled) return;
    updateMember({ vinculoRoto: value });
    if (partner?.id) {
      actions?.updateMember?.(partner.id, { vinculoRoto: value });
    }
  };

  const handleDelete = () => {
    if (!active?.id || isDisabled) return;
    let proceed = true;
    if (typeof window !== 'undefined' && window.confirm) {
      proceed = window.confirm('¿Eliminar este miembro del árbol?');
    }
    if (!proceed) return;
    actions?.removeMember?.(active.id);
    actions?.setSelectedId?.('');
  };

  if (!activeId || !active) {
    return (
      <aside className="w-full md:w-80 md:justify-self-end">
        <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-auto border-l border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Seleccioná un miembro para ver detalle.</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-80 md:justify-self-end">
      <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-auto border-l border-slate-200 bg-white p-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Análisis de miembro</div>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
              sandbox · no persiste
            </span>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Nombre</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
              value={form.nombre}
              onChange={(event) => handleFormChange('nombre', event.target.value)}
              placeholder="Nombre del miembro"
              disabled={isDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Edad (años)</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                value={form.edad}
                onChange={(event) => handleFormChange('edad', event.target.value)}
                placeholder="ej: 32"
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Estado</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                value={form.estado}
                onChange={(event) => handleFormChange('estado', event.target.value)}
                disabled={isDisabled}
              >
                <option value="vivo">vivo</option>
                <option value="fallecido">fallecido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Símbolo</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
              value={form.simbolo}
              onChange={(event) => handleFormChange('simbolo', event.target.value)}
              disabled={isDisabled}
            >
              <option value="auto">Auto</option>
              <option value="square">Masculino (□)</option>
              <option value="circle">Femenino (○)</option>
              <option value="diamond">Sin dato (◇)</option>
            </select>
          </div>

          {partner && (
            <label className="flex items-center justify-between text-xs text-slate-600 mt-1">
              <span>Vínculo roto</span>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={currentBroken}
                onChange={(event) => handleToggleBroken(event.target.checked)}
                disabled={isDisabled}
              />
            </label>
          )}

          <div className="h-px bg-slate-200 my-1" />

          <div className="text-xs text-slate-600">Acciones rápidas</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 col-span-2"
              onClick={() => actions?.addParentsBoth?.(active.id)}
            >
              + Padres (ambos)
            </button>

            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900"
              onClick={() => {
                const id = actions?.addSibling?.(active.id);
                if (id) actions?.setSelectedId?.(id);
              }}
            >
              + Hermano/a
            </button>

            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900"
              onClick={() => {
                const id = actions?.addPartner?.(active.id);
                if (id) actions?.setSelectedId?.(id);
              }}
            >
              + Pareja
            </button>

            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 col-span-2"
              onClick={() => actions?.addChild?.(active.id, active.sexo)}
            >
              Hijo/a
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900"
              onClick={handleDelete}
              disabled={isDisabled}
            >
              Eliminar miembro
            </button>
            <button
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
              onClick={() => actions?.resetDraft?.()}
            >
              Resetear sandbox
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Este panel modifica solo el pedigrí del Árbol (local por familia). La HC real no se toca.
          </div>
        </div>
      </div>
    </aside>
  );
}
