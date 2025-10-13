import React, { useEffect, useMemo, useState } from 'react';
import { MOTIVO_CONSULTA_GROUPS as BASE_GROUPS } from '@/lib/motivosConsulta.js';

/**
 * NewCasePage
 * - Pantalla completa (no modal)
 * - "Profesional tratante" = usuario logueado (prop currentUser)
 * - Motivos con subtipos (usa BASE_GROUPS si ya existe, o LOCAL_GROUPS como fallback)
 * - Form se adapta dinámicamente según el tipo de consulta seleccionado
 */

// Fallback de grupos si no vinieran desde MOTIVO_CONSULTA_GROUPS
const LOCAL_GROUPS = [
  {
    id: 'malformaciones',
    label: '1. Malformaciones congénitas / dismorfias',
    options: [
      { id: 'rn_multiples', label: 'RN/niño con malformaciones múltiples' },
      { id: 'dismorfias_sindromicas', label: 'Dismorfias faciales/corporales sugestivas de síndrome' },
      { id: 'sospecha_cromosomopatia', label: 'Sospecha de cromosomopatía (Down/Turner/Edwards, etc.)' },
    ],
  },
  {
    id: 'rgd_di_tea',
    label: '2. Retraso global del desarrollo y discapacidad intelectual',
    options: [
      { id: 'retraso_motores', label: 'Retraso en hitos motores' },
      { id: 'retraso_lenguaje', label: 'Retraso del lenguaje' },
      { id: 'di_no_aclarada', label: 'Discapacidad intelectual de causa no aclarada' },
      { id: 'tea', label: 'Trastorno del espectro autista (TEA)' },
      { id: 'otros_tnd', label: 'Otros trastornos del neurodesarrollo' },
    ],
  },
  {
    id: 'antecedentes_familiares',
    label: '3. Antecedentes familiares sugestivos',
    options: [
      { id: 'agregacion', label: 'Agregación familiar de enfermedad' },
      { id: 'muertes_abortos', label: 'Muertes tempranas / abortos espontáneos múltiples' },
      { id: 'patrones_mendelianos', label: 'Patrones mendelianos (AD/AR/LX) claros' },
    ],
  },
  {
    id: 'monogenicas',
    label: '4. Enfermedades monogénicas sospechadas',
    options: [
      { id: 'fq', label: 'Fibrosis quística' },
      { id: 'distrofias', label: 'Distrofias musculares' },
      { id: 'hemocromatosis', label: 'Hemocromatosis' },
      { id: 'sospecha_bioquimica', label: 'Sospecha por hallazgos bioquímicos' },
      { id: 'fenotipo_especifico', label: 'Fenotipo clínico característico' },
    ],
  },
  {
    id: 'cancer_familiar',
    label: '5. Cáncer familiar y predisposición oncológica',
    options: [
      { id: 'mama_ovario', label: 'Mama/Ovario' },
      { id: 'colon_endometrio', label: 'Colon/Endometrio (Lynch)' },
      { id: 'li_fraumeni', label: 'Li-Fraumeni' },
      { id: 'otros', label: 'Otros tumores de predisposición hereditaria' },
    ],
  },
  {
    id: 'ercm',
    label: '6. Errores congénitos del metabolismo',
    options: [
      { id: 'neonatal_aguda', label: 'Neonatal aguda (hipotonía/convulsiones/vómitos)' },
      { id: 'hipoglucemias', label: 'Hipoglucemias' },
      { id: 'acidosis', label: 'Acidosis metabólica' },
      { id: 'cribado_alterado', label: 'Cribado neonatal alterado' },
    ],
  },
  {
    id: 'reproductivos',
    label: '7. Problemas reproductivos',
    options: [
      { id: 'infertilidad', label: 'Infertilidad/azoospermia/amenorrea' },
      { id: 'abortos_recurrentes', label: 'Abortos recurrentes (≥2)' },
      { id: 'translocaciones_balanceadas', label: 'Alteraciones cromosómicas balanceadas en padres' },
    ],
  },
  {
    id: 'prenatal',
    label: '8. Hallazgos prenatales',
    options: [
      { id: 'eco_malformaciones', label: 'Malformaciones por ecografía' },
      { id: 'marcadores_aneuploidía', label: 'Marcadores de aneuploidía' },
      { id: 'rciu', label: 'RCIU sin causa clara' },
      { id: 'cribado_anormal', label: 'Cribado prenatal anormal (bioquímico/ADN libre)' },
    ],
  },
  {
    id: 'hallazgos_incidentales',
    label: '9. Hallazgos incidentales en estudios',
    options: [
      { id: 'cariotipo_incidental', label: 'Alteración citogenética incidental' },
      { id: 'imagen_incidental', label: 'Hallazgo incidental en imagen' },
      { id: 'laboratorio_incidental', label: 'Hallazgo incidental en laboratorio' },
    ],
  },
  {
    id: 'otros',
    label: '10. Otros motivos frecuentes',
    options: [
      { id: 'talla_extrema', label: 'Tallas extremas/Displasias esqueléticas' },
      { id: 'sensoriales', label: 'Sordera/Ceguera/Retinitis/Epilepsias genéticas' },
      { id: 'dermato_inmuno', label: 'Dermatosis/Immunodeficiencias de sospecha genética' },
    ],
  },
];

const GROUPS = (BASE_GROUPS?.length ? BASE_GROUPS : LOCAL_GROUPS);

const CONSANGUINIDAD_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'posible', label: 'Posible' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'desconocido', label: 'No sabe / No refiere' },
];

const calculateAgeYears = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const md = now.getMonth() - date.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < date.getDate())) years -= 1;
  return years >= 0 ? years : 0;
};

// -------- Motor de visibilidad por tipo de consulta --------
// Secciones posibles: 'id', 'motivo', 'paciente', 'antropometria', 'examenGenetico', 'neurodesarrollo',
// 'obstetricos', 'prenatal', 'oncologia', 'reproductivo', 'metabolismo', 'consanguinidad', 'familia', 'abuelos'
// -------- Config clínico por grupo (secciones y validaciones) --------
// Secciones posibles: 'id','motivo','paciente','antropometria','examenGenetico','perinatal',
// 'neurodesarrollo','obstetricos','prenatal','oncologia','reproductivo','metabolismo',
// 'consanguinidad','familia','abuelos','incidental','monogenicas'

const GROUP_CONFIG = {
  malformaciones: {
    base: ['id','motivo','paciente','perinatal','antropometria','examenGenetico','consanguinidad','familia','abuelos'],
    adultRemove: ['perinatal','antropometria'], // si adulto, evitamos perinatal y percentilar
    required: ['pacienteNombre','pacienteApellido','provincia','pacienteNacimiento','pacienteSexo','agNumber','motivoGroup','motivoDetail'],
  },
  rgd_di_tea: {
    base: ['id','motivo','paciente','neurodesarrollo','antropometria','examenGenetico','consanguinidad','familia','abuelos'],
    required: ['ndHitosMotores','ndLenguaje'], // min info de ND
  },
  antecedentes_familiares: {
    base: ['id','motivo','paciente','consanguinidad','familia','abuelos'],
    required: [],
  },
  monogenicas: {
    base: ['id','motivo','paciente','monogenicas','examenGenetico','consanguinidad','familia','abuelos'],
    required: ['monoFenotipoClave'], // definimos el fenotipo que guía
  },
  cancer_familiar: {
    base: ['id','motivo','paciente','oncologia','familia','abuelos'],
    adultRemove: [], // adulto esperado
    required: ['oncoTiposTumor'],
    extraValid: (f) => Boolean(f.oncoTiposTumor || f.oncoEstudiosPrevios),
  },
  ercm: {
    base: ['id','motivo','paciente','metabolismo','perinatal','antropometria','examenGenetico','consanguinidad','familia','abuelos'],
    adultRemove: ['perinatal'], // si adulto, perinatal pierde peso
    required: ['metaSintomasAgudos'],
  },
  reproductivos: {
    base: ['id','motivo','paciente','reproductivo','obstetricos','consanguinidad','familia','abuelos'],
    required: [],
    extraValid: (f) => Boolean(f.reproTiempoBusqueda || f.reproPerdidasGestacionales || f.reproEstudiosPrevios),
  },
  prenatal: {
    base: ['id','motivo','paciente','prenatal','obstetricos','consanguinidad','familia'],
    adultRemove: ['familia','abuelos'], // suele enfocarse en gestación actual
    required: ['prenatalSemanas'],
    extraValid: (f) => Boolean(f.prenatalEcografia || f.prenatalCribado || f.prenatalGeneticaFetal),
  },
  hallazgos_incidentales: {
    base: ['id','motivo','paciente','incidental','examenGenetico','familia','abuelos'],
    required: ['incTipoEstudio','incHallazgo'],
  },
  otros: {
    base: ['id','motivo','paciente','antropometria','examenGenetico','familia','abuelos'],
    required: [],
  },
};

function getVisibleSections(motivoGroup, pacienteEdad) {
  const cfg = GROUP_CONFIG[motivoGroup];
  if (!cfg) return ['id','motivo','paciente'];

  const isAdult = pacienteEdad != null && pacienteEdad >= 18;
  const sections = new Set(cfg.base);
  (cfg.adultRemove || []).forEach((s) => { if (isAdult) sections.delete(s); });

  // afinaciones suaves:
  if (motivoGroup === 'prenatal') {
    sections.delete('antropometria'); // no percentilar al consultante en prenatal
    sections.delete('examenGenetico');
  }
  return Array.from(sections);
}

function validateByGroup(form, edad) {
  const commonOk = Boolean(
    form.agNumber && form.motivoGroup && form.motivoDetail &&
    form.pacienteNombre && form.pacienteApellido && form.provincia &&
    form.medicoAsignado && form.pacienteNacimiento && form.pacienteSexo
  );
  if (!commonOk) return false;

  const cfg = GROUP_CONFIG[form.motivoGroup];
  if (!cfg) return true;

  const required = cfg.required || [];
  const requiredOk = required.every((k) => !!(form[k] && String(form[k]).trim()));
  if (!requiredOk) return false;

  if (typeof cfg.extraValid === 'function') {
    return !!cfg.extraValid(form, edad);
  }
  return true;
}

const initialFormState = {
  // Identificación
  agNumber: '',
  provincia: '',
  // Motivo
  motivoGroup: '',
  motivoDetail: '',
  motivoPaciente: '',
  motivoDerivacion: '',
  // Profesional tratante => derivado de currentUser
  medicoAsignado: '',
  // Paciente (A1)
  pacienteNombre: '',
  pacienteApellido: '',
  pacienteNacimiento: '',
  pacienteSexo: '',
  pacienteDireccion: '',
  pacienteEmail: '',
  pacienteTelefono: '',
  pacienteProfesion: '',
  pacienteObraSocial: '',
  pacienteAntecedentes: '',
  // Examen / Antropometría
  pacienteExamenPeso: '',
  pacienteExamenTalla: '',
  pacienteExamenPc: '',
  pacienteExamenObservaciones: '',
  pacienteExamenDismorfias: '',
  pacienteExamenOjos: '',
  pacienteExamenNariz: '',
  pacienteExamenFiltrum: '',
  pacienteExamenBoca: '',
  pacienteExamenOrejas: '',
  pacienteExamenCuello: '',
  pacienteExamenTorax: '',
  pacienteExamenColumna: '',
  pacienteExamenAbdomen: '',
  pacienteExamenGenitales: '',
  pacienteExamenOtras: '',
  // Consanguinidad
  consanguinidad: 'no',
  consanguinidadDetalle: '',
  // Obstétricos generales
  obstetricosDescripcion: '',
  // Prenatal específicos
  prenatalEcografia: '',
  prenatalCribado: '',
  prenatalSemanas: '',
  prenatalRciu: '',
  prenatalProcedimientos: '',     // NUEVO: amniocentesis, vellosidades, etc.
  prenatalGeneticaFetal: '',      // NUEVO: CMA/exoma, resultados
  // Perinatal / Neonatal (para pediátricos)
  perinatalPesoNacimiento: '',    // NUEVO
  perinatalEdadGestacional: '',   // NUEVO (semanas)
  perinatalApgar1: '',            // NUEVO
  perinatalApgar5: '',            // NUEVO
  perinatalComplicaciones: '',    // NUEVO
  // Neurodesarrollo
  ndHitosMotores: '',
  ndLenguaje: '',
  ndConducta: '',
  ndRegresion: '',
  ndEEG: '',                      // NUEVO
  ndRMN: '',                      // NUEVO
  ndInterconsultas: '',           // NUEVO (fono, TO, neuro, etc.)
  // Oncología
  oncoTiposTumor: '',
  oncoEdadDiagnostico: '',
  oncoTratamientos: '',
  oncoEstudiosPrevios: '',
  oncoArbolResumen: '',           // NUEVO (resumen de agregación/patrones)
  // Reproductivo
  reproTiempoBusqueda: '',
  reproFemeninoDatos: '',
  reproMasculinoDatos: '',
  reproPerdidasGestacionales: '',
  reproEstudiosPrevios: '',       // NUEVO (cariotipo, FRAXA, Y microdel, etc.)
  // Metabolismo
  metaSintomasAgudos: '',
  metaCribadoNeonatal: '',
  metaBioquimica: '',
  // Hallazgos incidentales
  incTipoEstudio: '',             // NUEVO (RM, eco, cariotipo, etc.)
  incHallazgo: '',                // NUEVO (resumen del hallazgo)
  incMotivoOriginal: '',          // NUEVO (por qué se pidió el estudio)
  incAccionSugerida: '',          // NUEVO (conducta/seguimiento)
  // Familiares (B1/C1) y abuelos
  b1Nombre: '', b1Apellido: '', b1Nacimiento: '', b1Email: '', b1Profesion: '', b1ObraSocial: '', b1Antecedentes: '',
  c1Nombre: '', c1Apellido: '', c1Nacimiento: '', c1Email: '', c1Profesion: '', c1ObraSocial: '', c1Antecedentes: '',
  c1Gestas: '', c1Partos: '', c1Abortos: '', c1Cesareas: '',
  abueloPaternoApellido: '', abueloPaternoProcedencia: '',
  abuelaPaternaApellido: '', abuelaPaternaProcedencia: '',
  abueloMaternoApellido: '', abueloMaternoProcedencia: '',
  abuelaMaternaApellido: '', abuelaMaternaProcedencia: '',
};


export default function NewCasePage({ currentUser, onSubmit, busy = false, onCancel }) {
  const [form, setForm] = useState(initialFormState);

  // Set profesional tratante desde usuario logueado
  useEffect(() => {
    if (currentUser?.name) {
      setForm((p) => ({ ...p, medicoAsignado: currentUser.name }));
    }
  }, [currentUser]);

  const currentGroup = useMemo(
    () => GROUPS.find((g) => g.id === form.motivoGroup) || null,
    [form.motivoGroup]
  );
  const detailOptions = useMemo(() => currentGroup?.options ?? [], [currentGroup]);

  const pacienteEdad = useMemo(() => calculateAgeYears(form.pacienteNacimiento), [form.pacienteNacimiento]);
  const visibleSections = useMemo(
    () => getVisibleSections(form.motivoGroup, pacienteEdad),
    [form.motivoGroup, pacienteEdad]
  );

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const medicoAsignado = form.medicoAsignado; // derivado de currentUser

  const baseValid = Boolean(
    form.agNumber && form.motivoGroup && form.motivoDetail &&
    form.pacienteNombre && form.pacienteApellido && form.provincia &&
    medicoAsignado && form.pacienteNacimiento && form.pacienteSexo
  );

  // Reglas extra de validación por grupo (ejemplos mínimos)
  const extraValid = useMemo(() => {
    switch (form.motivoGroup) {
      case 'cancer_familiar':
        // Al menos un tipo de tumor o estudio previo
        return Boolean(form.oncoTiposTumor || form.oncoEstudiosPrevios);
      case 'prenatal':
        // Semanas y resumen de hallazgo
        return Boolean(form.prenatalSemanas && (form.prenatalEcografia || form.prenatalCribado));
      case 'reproductivos':
        // Tiempo de búsqueda o pérdidas
        return Boolean(form.reproTiempoBusqueda || form.reproPerdidasGestacionales);
      default:
        return true;
    }
  }, [form]);

const valid = validateByGroup({ ...form, medicoAsignado }, pacienteEdad) && !busy;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    const agNumber = form.agNumber.trim().toUpperCase();
    const payload = {
      ...form,
      agNumber,
      medicoAsignado,
      pacienteEdad,
    };
    onSubmit?.(payload);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Nueva HC familiar</h1>
            <span className="text-xs text-slate-500">Profesional: {medicoAsignado || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
            >Cancelar</button>
            <button
              type="submit"
              form="newcase-form"
              disabled={!valid}
              className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:border-slate-300 disabled:bg-slate-200"
            >{busy ? 'Creando…' : 'Crear HC'}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <form id="newcase-form" onSubmit={handleSubmit} className="grid gap-8">
          {/* Identificación */}
          {visibleSections.includes('id') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Identificación</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nº AG</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 uppercase"
                    value={form.agNumber}
                    onChange={(e) => handleChange('agNumber', e.target.value.toUpperCase())}
                    placeholder="AG-0001"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Provincia</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={form.provincia}
                    onChange={(e) => handleChange('provincia', e.target.value)}
                    placeholder="Provincia de residencia"
                    required
                  />
                </div>
              </div>
            </section>
          )}

          {/* Motivo de consulta */}
          {visibleSections.includes('motivo') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Motivo de consulta</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label className="block text-xs text-slate-500 mb-1">Grupo</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={form.motivoGroup}
                    onChange={(e) => {
                      handleChange('motivoGroup', e.target.value);
                      handleChange('motivoDetail', '');
                    }}
                  >
                    <option value="">Seleccionar…</option>
                    {GROUPS.map((group) => (
                      <option key={group.id} value={group.id}>{group.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Detalle específico</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={form.motivoDetail}
                    onChange={(e) => handleChange('motivoDetail', e.target.value)}
                    disabled={!currentGroup}
                  >
                    <option value="">Elegí el motivo puntual</option>
                    {detailOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">Evitá categorías genéricas; elegí el subtipo más aproximado.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Relato del paciente</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2"
                    value={form.motivoPaciente}
                    onChange={(e) => handleChange('motivoPaciente', e.target.value)}
                    placeholder="¿Qué refiere el paciente?"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Motivo de derivación (profesional)</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2"
                    value={form.motivoDerivacion}
                    onChange={(e) => handleChange('motivoDerivacion', e.target.value)}
                    placeholder="Resumen del profesional derivante"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Paciente A1 */}
          {visibleSections.includes('paciente') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Paciente que consulta (A1)</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteNombre} onChange={(e) => handleChange('pacienteNombre', e.target.value)} placeholder="Nombre(s)" required/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Apellido</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteApellido} onChange={(e) => handleChange('pacienteApellido', e.target.value)} placeholder="Apellido(s)" required/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
                  <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteNacimiento} onChange={(e) => handleChange('pacienteNacimiento', e.target.value)} required/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Sexo</label>
                  <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteSexo} onChange={(e) => handleChange('pacienteSexo', e.target.value)} required>
                    <option value="">Seleccionar…</option>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="X">No binario / Intersex / Prefiere no decir</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Provincia</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.provincia} onChange={(e) => handleChange('provincia', e.target.value)} placeholder="Provincia de residencia" required/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Edad actual</label>
                  <input className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2" value={pacienteEdad != null ? `${pacienteEdad}` : ''} placeholder="Calculada automáticamente" readOnly/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Profesión / actividad</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteProfesion} onChange={(e) => handleChange('pacienteProfesion', e.target.value)} placeholder="Profesión u ocupación"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Obra social / cobertura</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteObraSocial} onChange={(e) => handleChange('pacienteObraSocial', e.target.value)} placeholder="Cobertura"/>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Dirección</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteDireccion} onChange={(e) => handleChange('pacienteDireccion', e.target.value)} placeholder="Calle, número, localidad"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Correo electrónico</label>
                  <input type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteEmail} onChange={(e) => handleChange('pacienteEmail', e.target.value)} placeholder="email@ejemplo.com"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Teléfono</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteTelefono} onChange={(e) => handleChange('pacienteTelefono', e.target.value)} placeholder="(+54)"/>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Antecedentes personales relevantes</label>
                  <textarea className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteAntecedentes} onChange={(e) => handleChange('pacienteAntecedentes', e.target.value)} placeholder="Patologías previas, tratamientos, perinatales, etc."/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Observaciones generales / notas clínicas</label>
                  <textarea className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteExamenObservaciones} onChange={(e) => handleChange('pacienteExamenObservaciones', e.target.value)} placeholder="Resumen del examen o hallazgos"/>
                </div>
              </div>
            </section>
          )}
{/* Perinatal / Neonatal */}
{visibleSections.includes('perinatal') && (
  <section className="grid gap-3">
    <h2 className="text-sm font-semibold text-slate-700">Perinatal / Neonatal</h2>
    <div className="grid gap-3 md:grid-cols-5">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Peso al nacer (g)</label>
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2"
          value={form.perinatalPesoNacimiento}
          onChange={(e) => handleChange('perinatalPesoNacimiento', e.target.value)}
          placeholder="Ej. 3200" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">EG (semanas)</label>
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2"
          value={form.perinatalEdadGestacional}
          onChange={(e) => handleChange('perinatalEdadGestacional', e.target.value)}
          placeholder="Ej. 39" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Apgar 1'</label>
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2"
          value={form.perinatalApgar1}
          onChange={(e) => handleChange('perinatalApgar1', e.target.value)}
          placeholder="Ej. 8" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Apgar 5'</label>
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2"
          value={form.perinatalApgar5}
          onChange={(e) => handleChange('perinatalApgar5', e.target.value)}
          placeholder="Ej. 9" />
      </div>
      <div className="md:col-span-1 md:col-start-5"></div>
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Complicaciones / UCI / Intercurrencias neonatales</label>
      <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
        value={form.perinatalComplicaciones}
        onChange={(e) => handleChange('perinatalComplicaciones', e.target.value)}
        placeholder="RN en UCIN, hipoglucemia, hipotonía, ictericia, infecciones…" />
    </div>
  </section>
)}

          {/* Antropometría + Examen físico orientado a genética */}
          {(visibleSections.includes('antropometria') || visibleSections.includes('examenGenetico')) && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Examen físico orientado a genética</h2>
              {visibleSections.includes('antropometria') && (
                <>
                  <p className="text-xs text-slate-500">Registrá medidas (percentiles se calcularán luego).</p>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Peso (kg)</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteExamenPeso} onChange={(e) => handleChange('pacienteExamenPeso', e.target.value)} placeholder="Ej. 12.4"/>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Talla (cm)</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteExamenTalla} onChange={(e) => handleChange('pacienteExamenTalla', e.target.value)} placeholder="Ej. 90"/>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Perímetro cefálico (cm)</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.pacienteExamenPc} onChange={(e) => handleChange('pacienteExamenPc', e.target.value)} placeholder="Ej. 48"/>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Edad (para percentilar)</label>
                      <input className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2" value={pacienteEdad != null ? `${pacienteEdad}` : ''} placeholder="Automática" readOnly/>
                    </div>
                  </div>
                </>
              )}
              {visibleSections.includes('examenGenetico') && (
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ['pacienteExamenDismorfias', 'Dismorfias faciales'],
                    ['pacienteExamenOjos', 'Ojos'],
                    ['pacienteExamenNariz', 'Nariz'],
                    ['pacienteExamenFiltrum', 'Filtrum'],
                    ['pacienteExamenBoca', 'Boca'],
                    ['pacienteExamenOrejas', 'Orejas'],
                    ['pacienteExamenCuello', 'Cuello'],
                    ['pacienteExamenTorax', 'Tórax'],
                    ['pacienteExamenColumna', 'Columna'],
                    ['pacienteExamenAbdomen', 'Abdomen'],
                    ['pacienteExamenGenitales', 'Genitales'],
                    ['pacienteExamenOtras', 'Otros hallazgos'],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label className="block text-xs text-slate-500 mb-1">{label}</label>
                      <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2" value={form[field]} onChange={(e) => handleChange(field, e.target.value)} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Neurodesarrollo */}
          {visibleSections.includes('neurodesarrollo') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Neurodesarrollo</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Hitos motores</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.ndHitosMotores} onChange={(e) => handleChange('ndHitosMotores', e.target.value)} placeholder="Sedestación, bipedestación, marcha…"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Lenguaje</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.ndLenguaje} onChange={(e) => handleChange('ndLenguaje', e.target.value)} placeholder="Balbuceo, palabras, frases…"/>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Conducta (TEA/atención)</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.ndConducta} onChange={(e) => handleChange('ndConducta', e.target.value)} placeholder="Social, estereotipias, intereses restringidos…"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Regresión</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.ndRegresion} onChange={(e) => handleChange('ndRegresion', e.target.value)} placeholder="Pérdida de habilidades previas"/>
                </div>
              </div>
            </section>
          )}
{/* (al final del section de Neurodesarrollo) */}
<div className="grid gap-3 md:grid-cols-3">
  <div>
    <label className="block text-xs text-slate-500 mb-1">EEG</label>
    <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
      value={form.ndEEG}
      onChange={(e) => handleChange('ndEEG', e.target.value)}
      placeholder="Fecha y resultado (si corresponde)" />
  </div>
  <div>
    <label className="block text-xs text-slate-500 mb-1">RMN / Neuroimagen</label>
    <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
      value={form.ndRMN}
      onChange={(e) => handleChange('ndRMN', e.target.value)}
      placeholder="Fecha y hallazgos clave" />
  </div>
  <div>
    <label className="block text-xs text-slate-500 mb-1">Interconsultas</label>
    <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
      value={form.ndInterconsultas}
      onChange={(e) => handleChange('ndInterconsultas', e.target.value)}
      placeholder="Fonoaudiología, TO, psicopedagogía, neuro…" />
  </div>
</div>

          {/* Prenatal */}
          {visibleSections.includes('prenatal') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Hallazgos prenatales</h2>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Semanas gestación</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.prenatalSemanas} onChange={(e) => handleChange('prenatalSemanas', e.target.value)} placeholder="Ej. 22"/>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Hallazgos ecográficos</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.prenatalEcografia} onChange={(e) => handleChange('prenatalEcografia', e.target.value)} placeholder="Malformaciones, marcadores de aneuploidía"/>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cribado (bioquímico/ADN libre)</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.prenatalCribado} onChange={(e) => handleChange('prenatalCribado', e.target.value)} placeholder="Resultados, riesgo"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">RCIU / Doppler</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.prenatalRciu} onChange={(e) => handleChange('prenatalRciu', e.target.value)} placeholder="Si/no y detalles"/>
                </div>
              </div>
              {/* al final del bloque Prenatal */}
<div className="grid gap-3 md:grid-cols-2">
  <div>
    <label className="block text-xs text-slate-500 mb-1">Procedimientos</label>
    <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
      value={form.prenatalProcedimientos}
      onChange={(e) => handleChange('prenatalProcedimientos', e.target.value)}
      placeholder="CVS/Amnio: fecha, indicación, complicaciones" />
  </div>
  <div>
    <label className="block text-xs text-slate-500 mb-1">Genética fetal</label>
    <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
      value={form.prenatalGeneticaFetal}
      onChange={(e) => handleChange('prenatalGeneticaFetal', e.target.value)}
      placeholder="CMA/Exoma fetal/trío: hallazgos, VUS" />
  </div>
</div>

            </section>
            
          )}

          {/* Oncología */}
          {visibleSections.includes('oncologia') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Oncología hereditaria</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tipos de tumor (personal y familiar)</label>
                  <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2" value={form.oncoTiposTumor} onChange={(e) => handleChange('oncoTiposTumor', e.target.value)} placeholder="Mama, ovario, colon, endometrio, sarcomas…"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Edad al diagnóstico / tratamientos</label>
                  <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2" value={form.oncoEdadDiagnostico} onChange={(e) => handleChange('oncoEdadDiagnostico', e.target.value)} placeholder="<50a, quimio, radio, cirugías"/>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Estudios previos relevantes</label>
                <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2" value={form.oncoEstudiosPrevios} onChange={(e) => handleChange('oncoEstudiosPrevios', e.target.value)} placeholder="Paneles, BRCA, MMR, IHQ/PCR MLH1/MSH2/MSH6/PMS2…"/>
              </div>
              {/* al final de Oncología hereditaria */}
<div>
  <label className="block text-xs text-slate-500 mb-1">Resumen familiar (árbol onco)</label>
  <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2"
    value={form.oncoArbolResumen}
    onChange={(e) => handleChange('oncoArbolResumen', e.target.value)}
    placeholder="Patrón compatible con AD/AR/LX, edades de inicio, laterality, bilaterales…" />
</div>

            </section>
          )}

          {/* Reproductivo */}
          {visibleSections.includes('reproductivo') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Problemas reproductivos</h2>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tiempo de búsqueda (meses)</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.reproTiempoBusqueda} onChange={(e) => handleChange('reproTiempoBusqueda', e.target.value)} placeholder="Ej. 12"/>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Datos femeninos</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.reproFemeninoDatos} onChange={(e) => handleChange('reproFemeninoDatos', e.target.value)} placeholder="Amenorrea, reserva ovárica, IOP, histerosalpingografía…"/>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Datos masculinos</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.reproMasculinoDatos} onChange={(e) => handleChange('reproMasculinoDatos', e.target.value)} placeholder="Azoospermia, FSH/LH, eco testicular…"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pérdidas gestacionales</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.reproPerdidasGestacionales} onChange={(e) => handleChange('reproPerdidasGestacionales', e.target.value)} placeholder="Nº, semanas, estudios previos"/>
                </div>
              </div>
              {/* al final de Reproductivos */}
<div>
  <label className="block text-xs text-slate-500 mb-1">Estudios previos</label>
  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
    value={form.reproEstudiosPrevios}
    onChange={(e) => handleChange('reproEstudiosPrevios', e.target.value)}
    placeholder="Cariotipo, FRAXA, microdeleciones Y, TSH/PRL, histero, seminograma…" />
</div>

            </section>
          )}
{/* Monogénicas */}
{visibleSections.includes('monogenicas') && (
  <section className="grid gap-3">
    <h2 className="text-sm font-semibold text-slate-700">Enfermedad monogénica sospechada</h2>
    <div className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-3">
        <label className="block text-xs text-slate-500 mb-1">Fenotipo clave</label>
        <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2"
          value={form.monoFenotipoClave}
          onChange={(e) => handleChange('monoFenotipoClave', e.target.value)}
          placeholder="Triada signos cardinales, distribución, curso…" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Biomarcadores / bioquímica</label>
        <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2"
          value={form.monoBiomarcadores}
          onChange={(e) => handleChange('monoBiomarcadores', e.target.value)}
          placeholder="CK, ferritina, cobre, ceruloplasmina…" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-slate-500 mb-1">Sospecha genética (gen/ruta)</label>
        <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2"
          value={form.monoSospechaGen}
          onChange={(e) => handleChange('monoSospechaGen', e.target.value)}
          placeholder="Ej. CFTR, DMD, HFE, COL1A1…" />
      </div>
    </div>
  </section>
)}

          {/* Metabolismo */}
          {visibleSections.includes('metabolismo') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Errores congénitos del metabolismo</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Síntomas agudos</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.metaSintomasAgudos} onChange={(e) => handleChange('metaSintomasAgudos', e.target.value)} placeholder="Hipotonía, convulsiones, vómitos, hipoglucemias, acidosis…"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cribado neonatal</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.metaCribadoNeonatal} onChange={(e) => handleChange('metaCribadoNeonatal', e.target.value)} placeholder="Resultados y confirmación"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Perfil bioquímico</label>
                  <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.metaBioquimica} onChange={(e) => handleChange('metaBioquimica', e.target.value)} placeholder="Amonio, lactato, aminoácidos, acilcarnitinas…"/>
                </div>
              </div>
            </section>
          )}

          {/* Consanguinidad */}
          {visibleSections.includes('consanguinidad') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Consanguinidad</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Situación</label>
                  <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.consanguinidad} onChange={(e) => handleChange('consanguinidad', e.target.value)}>
                    {CONSANGUINIDAD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {form.consanguinidad !== 'no' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Detalle</label>
                    <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2" value={form.consanguinidadDetalle} onChange={(e) => handleChange('consanguinidadDetalle', e.target.value)} placeholder="Ej. Primos segundos; abuelos paternos consanguíneos"/>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Obstétricos generales */}
          {(visibleSections.includes('obstetricos')) && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Antecedentes obstétricos / familiares</h2>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Detalle libre</label>
                <textarea className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2" value={form.obstetricosDescripcion} onChange={(e) => handleChange('obstetricosDescripcion', e.target.value)} placeholder="Embarazos previos, complicaciones, partos, puerperio, etc."/>
              </div>
            </section>
          )}
{/* Hallazgos incidentales */}
{visibleSections.includes('incidental') && (
  <section className="grid gap-3">
    <h2 className="text-sm font-semibold text-slate-700">Hallazgo incidental</h2>
    <div className="grid gap-3 md:grid-cols-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Tipo de estudio</label>
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2"
          value={form.incTipoEstudio}
          onChange={(e) => handleChange('incTipoEstudio', e.target.value)}
          placeholder="RM, ecografía, cariotipo, laboratorio…" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-slate-500 mb-1">Hallazgo</label>
        <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
          value={form.incHallazgo}
          onChange={(e) => handleChange('incHallazgo', e.target.value)}
          placeholder="Descripción del hallazgo no esperado" />
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Motivo original del estudio</label>
        <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
          value={form.incMotivoOriginal}
          onChange={(e) => handleChange('incMotivoOriginal', e.target.value)}
          placeholder="Por qué se solicitó" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Conducta sugerida</label>
        <textarea className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
          value={form.incAccionSugerida}
          onChange={(e) => handleChange('incAccionSugerida', e.target.value)}
          placeholder="Seguimiento, derivaciones, nuevos estudios…" />
      </div>
    </div>
  </section>
)}

          {/* Familia (B1/C1) */}
          {visibleSections.includes('familia') && (
            <section className="grid gap-4">
              <h2 className="text-sm font-semibold text-slate-700">Vínculos familiares B1 / C1</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {/* B1 */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">B1</h3>
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.b1Nombre} onChange={(e) => handleChange('b1Nombre', e.target.value)} placeholder="Nombre(s)"/>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Apellido</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.b1Apellido} onChange={(e) => handleChange('b1Apellido', e.target.value)} placeholder="Apellido(s)"/>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
                        <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.b1Nacimiento} onChange={(e) => handleChange('b1Nacimiento', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Correo electrónico</label>
                        <input type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.b1Email} onChange={(e) => handleChange('b1Email', e.target.value)} placeholder="email@ejemplo.com"/>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Profesión / actividad</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.b1Profesion} onChange={(e) => handleChange('b1Profesion', e.target.value)} placeholder="Profesión"/>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Obra social / cobertura</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.b1ObraSocial} onChange={(e) => handleChange('b1ObraSocial', e.target.value)} placeholder="Cobertura"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Antecedentes personales relevantes</label>
                      <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2" value={form.b1Antecedentes} onChange={(e) => handleChange('b1Antecedentes', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* C1 */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">C1 (madre)</h3>
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Nombre} onChange={(e) => handleChange('c1Nombre', e.target.value)} placeholder="Nombre(s)"/>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Apellido</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Apellido} onChange={(e) => handleChange('c1Apellido', e.target.value)} placeholder="Apellido(s)"/>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
                        <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Nacimiento} onChange={(e) => handleChange('c1Nacimiento', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Correo electrónico</label>
                        <input type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Email} onChange={(e) => handleChange('c1Email', e.target.value)} placeholder="email@ejemplo.com"/>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Profesión / actividad</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Profesion} onChange={(e) => handleChange('c1Profesion', e.target.value)} placeholder="Profesión"/>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Obra social / cobertura</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1ObraSocial} onChange={(e) => handleChange('c1ObraSocial', e.target.value)} placeholder="Cobertura"/>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Gestas</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Gestas} onChange={(e) => handleChange('c1Gestas', e.target.value)} placeholder="Nº"/>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Partos</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Partos} onChange={(e) => handleChange('c1Partos', e.target.value)} placeholder="Nº"/>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Abortos</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Abortos} onChange={(e) => handleChange('c1Abortos', e.target.value)} placeholder="Nº"/>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Cesáreas</label>
                        <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.c1Cesareas} onChange={(e) => handleChange('c1Cesareas', e.target.value)} placeholder="Nº"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Antecedentes personales relevantes</label>
                      <textarea className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2" value={form.c1Antecedentes} onChange={(e) => handleChange('c1Antecedentes', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Abuelos */}
          {visibleSections.includes('abuelos') && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Abuelos (D, E, F, G)</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Abuelos paternos</h3>
                  <div className="grid gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Apellido D (abuelo paterno)</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abueloPaternoApellido} onChange={(e) => handleChange('abueloPaternoApellido', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Procedencia D</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abueloPaternoProcedencia} onChange={(e) => handleChange('abueloPaternoProcedencia', e.target.value)} placeholder="Ciudad / país"/>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Apellido E (abuela paterna)</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abuelaPaternaApellido} onChange={(e) => handleChange('abuelaPaternaApellido', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Procedencia E</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abuelaPaternaProcedencia} onChange={(e) => handleChange('abuelaPaternaProcedencia', e.target.value)} placeholder="Ciudad / país"/>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Abuelos maternos</h3>
                  <div className="grid gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Apellido F (abuelo materno)</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abueloMaternoApellido} onChange={(e) => handleChange('abueloMaternoApellido', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Procedencia F</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abueloMaternoProcedencia} onChange={(e) => handleChange('abueloMaternoProcedencia', e.target.value)} placeholder="Ciudad / país"/>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Apellido G (abuela materna)</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abuelaMaternaApellido} onChange={(e) => handleChange('abuelaMaternaApellido', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Procedencia G</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.abuelaMaternaProcedencia} onChange={(e) => handleChange('abuelaMaternaProcedencia', e.target.value)} placeholder="Ciudad / país"/>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </form>
      </main>
    </div>
  );
}
