import React, { useState, useCallback } from 'react';

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

export default function AddMemberModal({ family, onAdd, onClose }) {
  const [memberData, setMemberData] = useState({
    givenName: '',
    lastName: family.displayName || '',
    role: '',
    birthDate: '',
    sex: 'U',
    // We can add more fields here if needed, like DNI
    filiatorios: {
      dni: '',
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dni') {
      setMemberData((prev) => ({
        ...prev,
        filiatorios: { ...prev.filiatorios, dni: value },
      }));
    } else {
      setMemberData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        // The payload needs to match what the backend/store expects.
        // Based on `FamilyMember` schema and `useCenagemStore`.
        const payload = {
          familyId: family.id,
          givenName: memberData.givenName,
          lastName: memberData.lastName,
          role: memberData.role,
          birthDate: memberData.birthDate ? new Date(memberData.birthDate).toISOString() : null,
          sex: memberData.sex,
          filiatorios: {
            dni: memberData.filiatorios.dni,
          },
          // Add any other default fields required by the backend
        };
        await onAdd(payload);
        onClose();
      } catch (error) {
        console.error('Failed to add member', error);
        // Here you could set an error message to display in the modal
      } finally {
        setIsSaving(false);
      }
    },
    [memberData, family.id, onAdd, onClose],
  );

  return (
    <div
      className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Agregar Nuevo Paciente a la Familia</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Given Name */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Nombre</span>
              <input
                type="text"
                name="givenName"
                value={memberData.givenName}
                onChange={handleChange}
                className="rounded-xl border-slate-300"
                placeholder="Nombre del paciente"
                required
              />
            </label>

            {/* Last Name */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Apellido</span>
              <input
                type="text"
                name="lastName"
                value={memberData.lastName}
                onChange={handleChange}
                className="rounded-xl border-slate-300"
                placeholder="Apellido familiar"
                required
              />
            </label>

            {/* Role */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Rol en la familia</span>
              <select
                name="role"
                value={memberData.role}
                onChange={handleChange}
                className="rounded-xl border-slate-300"
                required
              >
                <option value="" disabled>Seleccionar rol...</option>
                {ROL_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>

            {/* DNI */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">DNI</span>
              <input
                type="text"
                name="dni"
                value={memberData.filiatorios.dni}
                onChange={handleChange}
                className="rounded-xl border-slate-300"
                placeholder="Documento Nacional de Identidad"
              />
            </label>

            {/* Birth Date */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Fecha de Nacimiento</span>
              <input
                type="date"
                name="birthDate"
                value={memberData.birthDate}
                onChange={handleChange}
                className="rounded-xl border-slate-300"
              />
            </label>

            {/* Sex */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Sexo</span>
              <select
                name="sex"
                value={memberData.sex}
                onChange={handleChange}
                className="rounded-xl border-slate-300"
              >
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:bg-slate-500"
            >
              {isSaving ? 'Guardando...' : 'Agregar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
