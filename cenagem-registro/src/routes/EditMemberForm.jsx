import React, { useState, useCallback, useEffect } from 'react';

const ROL_OPTIONS = [
  'Probando',
  'Padre',
  'Madre',
  'Hijo/a',
  'Hermano/a',
  'Tío/a',
  'Sobrino/a',
  'Abuelo/a',
  'Primo/a',
  'Otro',
];

const SEX_OPTIONS = [
  { value: 'U', label: 'Sin especificar' },
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
];

export default function EditMemberForm({ member, onUpdate, onCancel, isUpdating }) {
  const [formData, setFormData] = useState(member);

  useEffect(() => {
    setFormData(member);
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dni') {
        setFormData((prev) => ({
        ...prev,
        filiatorios: { ...prev.filiatorios, dni: value },
      }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      await onUpdate(member.id, formData);
    },
    [formData, member, onUpdate],
  );

  return (
    <div className="grid gap-3">
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
                <label className="mb-1 block text-xs text-slate-600">Nombre</label>
                <input
                    name="givenName"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={formData.givenName || ''}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="mb-1 block text-xs text-slate-600">Apellido</label>
                <input
                    name="lastName"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                />
            </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div>
                <label className="mb-1 block text-xs text-slate-600">Sexo</label>
                                  <select
                                    name="sex"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                                    value={formData.sexo || formData.sex || 'U'}
                                    onChange={handleChange}
                                  >                    {SEX_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs text-slate-600">Rol</label>
                <input
                    name="role"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={formData.role || ''}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="mb-1 block text-xs text-slate-600">DNI</label>
                <input
                    name="dni"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={formData.filiatorios?.dni || ''}
                    onChange={handleChange}
                />
            </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
                <label className="mb-1 block text-xs text-slate-600">Nacimiento</label>
                <input
                    name="birthDate"
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={formData.birthDate ? formData.birthDate.slice(0, 10) : ''}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label className="mb-1 block text-xs text-slate-600">Diagnóstico principal</label>
                <input
                    name="diagnosis"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={formData.diagnosis || ''}
                    onChange={handleChange}
                />
            </div>
            </div>

            <div>
            <label className="mb-1 block text-xs text-slate-600">Resumen / Notas Clínicas</label>
            <textarea
                name="summary"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                rows={4}
                value={formData.summary || ''}
                onChange={handleChange}
                placeholder="Resumen del caso, fenotipo principal, o notas relevantes."
            />
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:bg-slate-500"
                >
                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
      </form>
    </div>
  );
}
