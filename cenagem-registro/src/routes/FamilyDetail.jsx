// ===============================
// src/routes/FamilyDetail.jsx — Componentes internos para la vista de familia
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import GeneticsPage from './GeneticsPage.jsx';
import FamilyStudiesPage from './FamilyStudiesPage.jsx';
import PhotosPage from './PhotosPage.jsx';
import FamilyTreePage from './FamilyTreePage.jsx';

import { GROUP_GUIDES } from '@/components/NewCase/groupGuides.js';
import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';
// ---- Utils ----
const toDate = (s) => { try { return new Date(s); } catch { return null; } };
const fmtDateTime = (d) => d ? `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '—';
const yearsSince = (isoDate) => {
  const d = toDate(isoDate); if (!d) return '—';
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  return `${y}a`;
};

const ageLabel = (member) => {
  if (typeof member?.edadCalculada === 'number') return `${member.edadCalculada}a`;
  if (member?.edadTexto) return member.edadTexto;
  return yearsSince(member?.nacimiento);
};
function pickA1(members) { return members.find(m => m.rol === 'Proband'); }
function latestEvolutionForFamily(evolutions, members) {
  const famMemberIds = new Set(members.map(m=>m.id));
  const evs = evolutions.filter(e => famMemberIds.has(e.memberId));
  evs.sort((a,b)=> new Date(b.at).getTime() - new Date(a.at).getTime());
  return evs[0];
}
function inferGeneticStudiesText(evolutions) {
  const txt = evolutions.map(e=>e.texto || '').join(' \n ');
  const keys = ['array-CGH','NGS','panel','BRCA','HRR','exoma','genoma'];
  const found = keys.filter(k => new RegExp(k,'i').test(txt));
  return found.length ? found.join(', ') : '—';
}

const MOTIVO_GROUP_MAP = new Map(
  (Array.isArray(MOTIVO_CONSULTA_GROUPS) ? MOTIVO_CONSULTA_GROUPS : []).map((group) => [group.id, group]),
);

const SEX_LABELS = {
  F: 'Femenino',
  FEMALE: 'Femenino',
  M: 'Masculino',
  MALE: 'Masculino',
  X: 'No binario',
  U: 'No especificado',
  '': 'No especificado',
};

const CONSANGUINIDAD_LABELS = {
  no: 'No',
  si: 'Sí',
  posible: 'Posible',
  confirmada: 'Confirmada',
  desconocido: 'No refiere',
};

const YES_NO_LABELS = {
  si: 'Sí',
  no: 'No',
  parcial: 'Parcial',
  posible: 'Posible',
  confirmado: 'Confirmado',
  desconocido: 'No refiere',
};

const isBlank = (value) => {
  if (value == null) return true;
  if (typeof value === 'number') return Number.isNaN(value);
  if (typeof value === 'boolean') return false;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return Number.isNaN(value.getTime());
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

const formatValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (value instanceof Date) return value.toLocaleDateString('es-AR');
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (item == null) return [];
        const formatted = formatValue(item);
        return formatted ? [formatted] : [];
      })
      .join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const formatDate = (iso) => {
  if (!iso) return '';
  const date = toDate(iso);
  if (!date) return '';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatSex = (code) => {
  if (!code) return '';
  const normalized = String(code).trim().toUpperCase();
  return SEX_LABELS[normalized] || SEX_LABELS[code] || code;
};

const formatConsanguinidad = (value) => {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase();
  return CONSANGUINIDAD_LABELS[normalized] || value;
};

const formatYesNo = (value) => {
  if (value == null) return '';
  const normalized = String(value).trim().toLowerCase();
  return YES_NO_LABELS[normalized] || value;
};

const appendUnit = (value, unit) => {
  if (isBlank(value)) return '';
  const base = formatValue(value);
  if (!base) return '';
  return unit ? `${base} ${unit}`.trim() : base;
};

const addEntry = (entries, label, rawValue, formatter = formatValue) => {
  const formatted = formatter(rawValue);
  if (!isBlank(formatted)) {
    entries.push({ label, value: formatted });
  }
};

const buildSpecificSections = (groupId, intake) => {
  const guide = groupId ? GROUP_GUIDES[groupId] : null;
  if (!guide || !Array.isArray(guide.sections)) return [];
  const sections = [];
  guide.sections.forEach((section, index) => {
    const entries = [];
    const collectFields = (fields) => {
      (fields || []).forEach((field) => {
        const value = intake[field.name];
        if (!isBlank(value)) {
          entries.push({
            label: field.label || field.name,
            value: formatValue(value),
          });
        }
      });
    };
    if (Array.isArray(section.fields)) collectFields(section.fields);
    if (Array.isArray(section.groups)) {
      section.groups.forEach((group) => collectFields(group.fields));
    }
    if (entries.length) {
      sections.push({
        id: `specific-${section.id || index}`,
        title: section.title || 'Preguntas específicas',
        entries,
      });
    }
  });
  return sections;
};

const buildIntakeSections = (intake = {}, family = {}) => {
  if (!intake || typeof intake !== 'object') return [];
  const sections = [];
  const ingreso =
    intake.ingreso && typeof intake.ingreso === 'object' && !Array.isArray(intake.ingreso)
      ? intake.ingreso
      : null;

  const formatIngresoEstado = (value) => {
    if (!value) return '';
    const normalized = String(value).trim();
    if (!normalized) return '';
    return normalized
      .toLowerCase()
.split(/[_\s]+/) // Corrected newline split
      .join(' ');
  };

  const motiveGroupId = intake.motivoGroup || family?.motivo?.groupId || '';
  const motiveGroup = MOTIVO_GROUP_MAP.get(motiveGroupId) || null;
  const motiveDetailId = intake.motivoDetail || family?.motivo?.detailId || '';
  const motiveDetail =
    motiveGroup?.options?.find((option) => option.id === motiveDetailId) || null;
  const motiveGroupLabel = family?.motivo?.groupLabel || motiveGroup?.label || '';
  const motiveDetailLabel = family?.motivo?.detailLabel || motiveDetail?.label || '';

  const consultaEntries = [];
  addEntry(consultaEntries, 'Fecha de consulta', intake.consultaFecha, formatDate);
  addEntry(consultaEntries, 'Profesional tratante', intake.medicoAsignado || family?.medicoAsignado);
  addEntry(consultaEntries, 'Código AG', intake.agNumber || family?.code);
  addEntry(consultaEntries, 'Motivo (grupo)', motiveGroupLabel);
  addEntry(consultaEntries, 'Motivo (detalle)', motiveDetailLabel);
  addEntry(consultaEntries, 'Relato del paciente', intake.motivoPaciente);
  addEntry(consultaEntries, 'Motivo de derivación', intake.motivoDerivacion);
  const consanguinidadEstado = intake.consanguinidad || family?.consanguinidad?.estado;
  addEntry(consultaEntries, 'Consanguinidad', consanguinidadEstado, formatConsanguinidad);
  addEntry(
    consultaEntries,
    'Detalle consanguinidad',
    intake.consanguinidadDetalle || family?.consanguinidad?.detalle,
  );
  if (ingreso) {
    const ingresoLabel =
      ingreso.label
      || (ingreso.tipo === 'primera_consulta' ? 'Ingreso de 1ra consulta' : formatIngresoEstado(ingreso.tipo));
    addEntry(consultaEntries, 'Tipo de ingreso', ingresoLabel);
    addEntry(consultaEntries, 'Estado del ingreso', ingreso.estado, formatIngresoEstado);
    if (ingreso.agendaFecha || ingreso.agendaHora) {
      const turnoPartes = [];
      if (ingreso.agendaFecha) turnoPartes.push(formatDate(ingreso.agendaFecha));
      if (ingreso.agendaHora) turnoPartes.push(`${ingreso.agendaHora} hs`);
      addEntry(consultaEntries, 'Turno asociado', turnoPartes.join(' · '));
    }
    addEntry(consultaEntries, 'Ingreso registrado por', ingreso.registradoPor);
    addEntry(consultaEntries, 'Ingreso registrado el', ingreso.registradoEn, formatDate);
  }
  if (consultaEntries.length) {
    sections.push({
      id: 'consulta',
      title: 'Datos de la consulta inicial',
      entries: consultaEntries,
    });
  }

  const datosEntries = [];
  const nombreCompleto = [intake.pacienteNombre, intake.pacienteApellido]
    .filter(Boolean)
    .join(' ');
  addEntry(datosEntries, 'Paciente', nombreCompleto || family?.displayName);
  addEntry(datosEntries, 'Documento', intake.pacienteDni);
  addEntry(datosEntries, 'Fecha de nacimiento', intake.pacienteNacimiento, formatDate);
  addEntry(
    datosEntries,
    'Edad estimada',
    intake.pacienteEdad,
    (value) => (value ? `${value} años` : ''),
  );
  addEntry(datosEntries, 'Sexo asignado', intake.pacienteSexo, formatSex);
  addEntry(datosEntries, 'Escolaridad', intake.pacienteEscolaridad);
  addEntry(datosEntries, 'Rendimiento escolar', intake.pacienteEscolaridadRendimiento);
  addEntry(datosEntries, 'Profesión / actividad', intake.pacienteProfesion);
  addEntry(datosEntries, 'Obra social', intake.pacienteObraSocial || family?.filiatoriosContacto?.obraSocial);
  addEntry(datosEntries, 'N° de afiliado', intake.pacienteObraSocialNumero);
  addEntry(datosEntries, 'Teléfono', intake.pacienteTelefono || family?.filiatoriosContacto?.telefono);
  addEntry(datosEntries, 'Email', intake.pacienteEmail || family?.filiatoriosContacto?.email);
  addEntry(datosEntries, 'Dirección', intake.pacienteDireccion || family?.filiatoriosContacto?.direccion);
  addEntry(datosEntries, 'Acompañante', intake.pacienteAcompanante);
  addEntry(datosEntries, 'Parentesco del acompañante', intake.pacienteAcompananteParentesco);
  addEntry(datosEntries, 'Contacto telefónico alternativo 1', intake.contactoTelefono1);
  addEntry(datosEntries, 'Contacto telefónico alternativo 2', intake.contactoTelefono2);
  if (datosEntries.length) {
    sections.push({
      id: 'identificacion',
      title: 'Datos identificatorios y de contacto',
      entries: datosEntries,
    });
  }

  const buildTutorSummary = (prefix) => {
    const nombre = intake[`${prefix}Nombre`];
    const apellido = intake[`${prefix}Apellido`];
    const procedencia = intake[`${prefix}Procedencia`];
    const consang = intake[`${prefix}Consanguinidad`];
    const padre = [intake[`${prefix}PadreApellido`], intake[`${prefix}PadreProcedencia`]]
      .filter(Boolean)
      .join(' · ');
    const madre = [intake[`${prefix}MadreApellido`], intake[`${prefix}MadreProcedencia`]]
      .filter(Boolean)
      .join(' · ');
    const lines = [];
    const fullName = [nombre, apellido].filter(Boolean).join(' ');
    if (!isBlank(fullName)) lines.push(fullName);
    if (!isBlank(procedencia)) lines.push(`Procedencia: ${procedencia}`);
    if (!isBlank(consang)) lines.push(`Consanguinidad: ${formatConsanguinidad(consang)}`);
    if (!isBlank(padre)) lines.push(`Abuelo/a paterno: ${padre}`);
    if (!isBlank(madre)) lines.push(`Abuelo/a materno: ${madre}`);
    return lines.join('\n');
  };

  const tutoresEntries = [];
  const tutorPadre = buildTutorSummary('tutorPadre');
  if (!isBlank(tutorPadre)) {
    tutoresEntries.push({ label: 'Tutor padre', value: tutorPadre });
  }
  const tutorMadre = buildTutorSummary('tutorMadre');
  if (!isBlank(tutorMadre)) {
    tutoresEntries.push({ label: 'Tutor madre', value: tutorMadre });
  }
  if (tutoresEntries.length) {
    sections.push({
      id: 'tutores',
      title: 'Referentes parentales',
      entries: tutoresEntries,
    });
  }

  const historiaEntries = [];
  addEntry(historiaEntries, 'Inicio y contexto', intake.enfInicioContexto);
  addEntry(historiaEntries, 'Evolución actual', intake.enfEvolucionActual);
  addEntry(historiaEntries, 'Manifestaciones clave', intake.enfManifestacionesClaves);
  addEntry(historiaEntries, 'Evaluaciones previas', intake.enfEvaluacionesPrevias);
  addEntry(historiaEntries, 'Impacto y plan de abordaje', intake.enfImpactoPlan);
  if (historiaEntries.length) {
    sections.push({
      id: 'historia',
      title: 'Historia clínica y enfermedad actual',
      entries: historiaEntries,
    });
  }

  const antecedentesEntries = [];
  addEntry(antecedentesEntries, 'Antecedentes personales relevantes', intake.pacienteAntecedentes);
  addEntry(antecedentesEntries, 'Neurológicos', intake.antecedentesNeurologicos);
  addEntry(antecedentesEntries, 'Metabólicos', intake.antecedentesMetabolicos);
  addEntry(antecedentesEntries, 'Sensoriales', intake.antecedentesSensoriales);
  addEntry(antecedentesEntries, 'Psicosociales', intake.antecedentesPsicosociales);
  if (antecedentesEntries.length) {
    sections.push({
      id: 'antecedentes',
      title: 'Antecedentes personales y familiares',
      entries: antecedentesEntries,
    });
  }

  const habitosEntries = [];
  addEntry(habitosEntries, 'Hábitos y estilo de vida', intake.pacienteHabitos);
  addEntry(habitosEntries, 'Apoyos psicosociales', intake.pacienteApoyosPsicosociales);
  if (habitosEntries.length) {
    sections.push({
      id: 'habitos',
      title: 'Hábitos y apoyos',
      entries: habitosEntries,
    });
  }

  const gestacionEntries = [];
  addEntry(gestacionEntries, 'Edad materna al concebir', intake.edadMaternaConcepcion, (value) => appendUnit(value, 'años'));
  addEntry(gestacionEntries, 'Edad paterna al concebir', intake.edadPaternaConcepcion, (value) => appendUnit(value, 'años'));
  addEntry(gestacionEntries, 'Control prenatal', intake.controlPrenatal, formatYesNo);
  addEntry(gestacionEntries, 'Detalle del control prenatal', intake.controlPrenatalDetalle);
  addEntry(gestacionEntries, 'Complicaciones durante el embarazo', intake.embarazoComplicaciones);
  addEntry(gestacionEntries, 'Exposiciones durante el embarazo', intake.embarazoExposiciones);
  addEntry(gestacionEntries, 'Alteraciones ecográficas', intake.prenatalEcoAlteraciones);
  addEntry(gestacionEntries, 'Consejería prenatal', intake.prenatalConsejeria);
  addEntry(gestacionEntries, 'Genética fetal', intake.prenatalGeneticaFetal);
  addEntry(gestacionEntries, 'Semana de gestación evaluada', intake.prenatalSemanas, (value) => appendUnit(value, 'semanas'));
  addEntry(gestacionEntries, 'Cribado prenatal', intake.prenatalCribado);
  addEntry(gestacionEntries, 'RCIU', intake.prenatalRciu);
  addEntry(gestacionEntries, 'Procedimientos realizados', intake.prenatalProcedimientos);
  addEntry(gestacionEntries, 'Notas prenatales', intake.prenatalNotas);
  if (gestacionEntries.length) {
    sections.push({
      id: 'prenatal',
      title: 'Gestación y antecedentes prenatales',
      entries: gestacionEntries,
    });
  }

  const perinatalEntries = [];
  addEntry(perinatalEntries, 'Tipo de parto', intake.perinatalTipoParto);
  addEntry(perinatalEntries, 'Edad gestacional al nacer', intake.perinatalEdadGestacional, (value) => appendUnit(value, 'semanas'));
  addEntry(perinatalEntries, 'Peso al nacer', intake.perinatalPesoNacimiento, (value) => appendUnit(value, 'g'));
  addEntry(perinatalEntries, 'Talla al nacer', intake.perinatalTallaNacimiento, (value) => appendUnit(value, 'cm'));
  addEntry(perinatalEntries, 'Apgar 1 minuto', intake.perinatalApgar1);
  addEntry(perinatalEntries, 'Apgar 5 minutos', intake.perinatalApgar5);
  addEntry(perinatalEntries, 'Internación neonatal', intake.perinatalInternacionNeonatal, formatYesNo);
  addEntry(perinatalEntries, 'Complicaciones perinatales', intake.perinatalComplicaciones);
  if (perinatalEntries.length) {
    sections.push({
      id: 'perinatal',
      title: 'Datos perinatales',
      entries: perinatalEntries,
    });
  }

  const neuroEntries = [];
  addEntry(neuroEntries, 'Hitos motores', intake.ndHitosMotores);
  addEntry(neuroEntries, 'Lenguaje', intake.ndLenguaje);
  addEntry(neuroEntries, 'Conducta', intake.ndConducta);
  addEntry(neuroEntries, 'Regresión', intake.ndRegresion);
  addEntry(neuroEntries, 'Área cognitiva', intake.ndAreaCognitiva);
  addEntry(neuroEntries, 'Escolaridad / apoyos', intake.ndEscolaridadDetalle);
  if (neuroEntries.length) {
    sections.push({
      id: 'neurodesarrollo',
      title: 'Desarrollo y neurocognición',
      entries: neuroEntries,
    });
  }

  const reproEntries = [];
  addEntry(reproEntries, 'Tiempo de búsqueda gestacional', intake.reproTiempoBusqueda);
  addEntry(reproEntries, 'Datos reproductivos femeninos', intake.reproFemeninoDatos);
  addEntry(reproEntries, 'Datos reproductivos masculinos', intake.reproMasculinoDatos);
  addEntry(reproEntries, 'Pérdidas gestacionales', intake.reproPerdidasGestacionales);
  addEntry(reproEntries, 'Diagnósticos reproductivos', intake.reproDiagnosticos);
  addEntry(reproEntries, 'Tratamientos previos', intake.reproTratamientos);
  addEntry(reproEntries, 'Estudios previos', intake.reproEstudiosPrevios);
  addEntry(reproEntries, 'Plan o recomendaciones', intake.reproPlan);
  if (reproEntries.length) {
    sections.push({
      id: 'reproductivo',
      title: 'Salud reproductiva',
      entries: reproEntries,
    });
  }

  const examenEntries = [];
  addEntry(examenEntries, 'Peso', intake.pacienteExamenPeso, (value) => appendUnit(value, 'kg'));
  addEntry(examenEntries, 'Peso percentil', intake.pacienteExamenPesoPercentil);
  addEntry(examenEntries, 'Talla', intake.pacienteExamenTalla, (value) => appendUnit(value, 'cm'));
  addEntry(examenEntries, 'Talla percentil', intake.pacienteExamenTallaPercentil);
  addEntry(examenEntries, 'Perímetro cefálico', intake.pacienteExamenPc, (value) => appendUnit(value, 'cm'));
  addEntry(examenEntries, 'PC percentil', intake.pacienteExamenPcPercentil);
  addEntry(examenEntries, 'Proporciones', intake.pacienteExamenProporciones);
  addEntry(examenEntries, 'Observaciones generales', intake.pacienteExamenObservaciones);
  addEntry(examenEntries, 'Dismorfias', intake.pacienteExamenDismorfias);
  addEntry(examenEntries, 'Ojos', intake.pacienteExamenOjos);
  addEntry(examenEntries, 'Nariz', intake.pacienteExamenNariz);
  addEntry(examenEntries, 'Filtrum', intake.pacienteExamenFiltrum);
  addEntry(examenEntries, 'Boca', intake.pacienteExamenBoca);
  addEntry(examenEntries, 'Orejas', intake.pacienteExamenOrejas);
  addEntry(examenEntries, 'Cuello', intake.pacienteExamenCuello);
  addEntry(examenEntries, 'Tórax', intake.pacienteExamenTorax);
  addEntry(examenEntries, 'Columna', intake.pacienteExamenColumna);
  addEntry(examenEntries, 'Abdomen', intake.pacienteExamenAbdomen);
  addEntry(examenEntries, 'Genitales', intake.pacienteExamenGenitales);
  addEntry(examenEntries, 'Malformaciones', intake.pacienteExamenMalformaciones);
  addEntry(examenEntries, 'Piel', intake.pacienteExamenPiel);
  addEntry(examenEntries, 'Neurológico', intake.pacienteExamenNeurologico);
  addEntry(examenEntries, 'Otros hallazgos', intake.pacienteExamenOtras);
  if (examenEntries.length) {
    sections.push({
      id: 'examen',
      title: 'Examen físico',
      entries: examenEntries,
    });
  }

  const estudiosEntries = [];
  addEntry(estudiosEntries, 'Estudios de primer nivel', intake.estudiosPrimerNivel);
  addEntry(estudiosEntries, 'Estudios de segundo nivel', intake.estudiosSegundoNivel);
  addEntry(estudiosEntries, 'Estudios de tercer nivel / dirigidos', intake.estudiosTercerNivel);
  addEntry(estudiosEntries, 'Notas e interpretación', intake.estudiosComplementariosNotas);
  if (estudiosEntries.length) {
    sections.push({
      id: 'estudios',
      title: 'Estudios complementarios',
      entries: estudiosEntries,
    });
  }

  const specificSections = buildSpecificSections(motiveGroupId, intake);
  sections.push(...specificSections);

  const resumenInicial = intake.resumenPrimeraConsulta || intake.primeraEvolucion || '';
  if (!isBlank(resumenInicial)) {
    sections.push({
      id: 'primera-consulta',
      title: 'Síntesis de la primera consulta',
      entries: [{ label: 'Resumen clínico', value: formatValue(resumenInicial) }],
    });
  }

  return sections;
};

function IntakeSection({ section }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
      <div className="text-sm font-semibold">{section.title}</div>
      <dl className="grid gap-3">
        {section.entries.map((entry, index) => (
          <div key={`${section.id}-${index}`} className="grid gap-1">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">{entry.label}</dt>
            <dd className="text-sm text-slate-700 whitespace-pre-wrap">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
// ---- UI locales ----

function AppToolbar({ code, onBack }) {
  return (
    <div className="mb-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-xl border border-white/40 !text-white hover:bg-white/10 transition"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold text-white">HC {code}</h2>
        </div>
      </div>
    </div>
  );
}
function MemberCardLine({ m, onOpen }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200">
      <div className="text-sm">
        <b>{m.filiatorios?.iniciales || m.rol}</b> · {m.nombre || '—'} · {ageLabel(m)} · OS: {m.os || '—'}
      </div>
      {onOpen && (<button onClick={()=>onOpen(m)} className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50">Abrir</button>)}
    </div>
  );
}

const SEX_OPTIONS = [
  { value: '', label: 'Sin dato' },
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'X', label: 'No binario' },
  { value: 'U', label: 'No especificado' },
];

const memberToFormValues = (member) => ({
  iniciales: member.filiatorios?.iniciales || '',
  nombre: member.nombre || '',
  apellido: member.apellido || '',
  sexo: member.sexo || '',
  nacimiento: member.nacimiento || '',
  diagnostico: member.diagnostico || '',
  resumen: member.resumen || '',
  telefono: (member.contacto && typeof member.contacto === 'object' && member.contacto.telefono) || '',
  email: (member.contacto && typeof member.contacto === 'object' && member.contacto.email) || '',
  os: member.os || '',
  estado: member.estado || '',
});

const trimValue = (value) => (typeof value === 'string' ? value.trim() : value ?? '');

const buildMemberPatch = (member, mergedValues, changedFields) => {
  const patch = {};
  const hasChange = (key) => Object.prototype.hasOwnProperty.call(changedFields, key);

  const normalized = {};
  Object.keys(mergedValues).forEach((key) => {
    normalized[key] = trimValue(mergedValues[key]);
  });

  if (hasChange('nombre')) {
    patch.nombre = normalized.nombre;
  }
  if (hasChange('apellido')) {
    patch.apellido = normalized.apellido;
  }
  if (hasChange('sexo')) {
    patch.sexo = normalized.sexo;
  }
  if (hasChange('nacimiento')) {
    patch.nacimiento = normalized.nacimiento;
  }
  if (hasChange('diagnostico')) {
    patch.diagnostico = normalized.diagnostico;
  }
  if (hasChange('resumen')) {
    patch.resumen = normalized.resumen;
  }
  if (hasChange('os')) {
    patch.os = normalized.os;
  }
  if (hasChange('estado')) {
    patch.estado = normalized.estado;
  }

  if (hasChange('telefono') || hasChange('email')) {
    const contactoPrev =
      member.contacto && typeof member.contacto === 'object' && !Array.isArray(member.contacto)
        ? { ...member.contacto }
        : {};
    if (hasChange('telefono')) {
      if (normalized.telefono) {
        contactoPrev.telefono = normalized.telefono;
      } else {
        delete contactoPrev.telefono;
      }
    }
    if (hasChange('email')) {
      if (normalized.email) {
        contactoPrev.email = normalized.email;
      } else {
        delete contactoPrev.email;
      }
    }
    patch.contacto = contactoPrev;
  }

  if (hasChange('iniciales') || hasChange('nombre') || hasChange('apellido')) {
    const filiatoriosPrev =
      member.filiatorios && typeof member.filiatorios === 'object'
        ? { ...member.filiatorios }
        : {};
    if (hasChange('iniciales')) {
      filiatoriosPrev.iniciales = normalized.iniciales.toUpperCase();
    }
    const fullName = [normalized.nombre, normalized.apellido].filter(Boolean).join(' ').trim();
    if (fullName) {
      filiatoriosPrev.nombreCompleto = fullName;
    } else {
      delete filiatoriosPrev.nombreCompleto;
    }
    patch.filiatorios = filiatoriosPrev;
  }

  return patch;
};

function MembersAdminTab({ members, onUpdateMember }) {
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    setDrafts((prev) => {
      const next = {};
      members.forEach((member) => {
        if (prev[member.id]) {
          next[member.id] = prev[member.id];
        }
      });
      return next;
    });
  }, [members]);

  useEffect(() => {
    setFeedback((prev) => {
      const next = {};
      members.forEach((member) => {
        if (prev[member.id]) {
          next[member.id] = prev[member.id];
        }
      });
      return next;
    });
  }, [members]);

  const baseValuesMap = useMemo(() => {
    const map = new Map();
    members.forEach((member) => {
      map.set(member.id, memberToFormValues(member));
    });
    return map;
  }, [members]);

  const getValue = (member, field) => {
    const draft = drafts[member.id];
    if (draft && Object.prototype.hasOwnProperty.call(draft, field)) {
      return draft[field];
    }
    const base = baseValuesMap.get(member.id);
    return base ? base[field] ?? '' : '';
  };

  const updateDraft = (member, field, value) => {
    const base = baseValuesMap.get(member.id) || {};
    const trimmed = typeof value === 'string' ? value : value ?? '';
    setDrafts((prev) => {
      const next = { ...prev };
      const current = { ...(next[member.id] || {}) };
      if ((base[field] ?? '') === trimmed) {
        delete current[field];
      } else {
        current[field] = trimmed;
      }
      if (Object.keys(current).length) {
        next[member.id] = current;
      } else {
        delete next[member.id];
      }
      return next;
    });
  };

  const handleReset = (memberId) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  const handleSave = async (member) => {
    if (!onUpdateMember) return;
    const changes = drafts[member.id];
    if (!changes || !Object.keys(changes).length) return;
    const base = baseValuesMap.get(member.id) || {};
    const merged = { ...base, ...changes };
    const patch = buildMemberPatch(member, merged, changes);
    setSaving((prev) => ({ ...prev, [member.id]: true }));
    try {
      await onUpdateMember(member.id, patch);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
      setFeedback((prev) => ({
        ...prev,
        [member.id]: { type: 'success', message: 'Datos guardados correctamente.' },
      }));
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          setFeedback((prev) => {
            const next = { ...prev };
            if (next[member.id]?.type === 'success') {
              delete next[member.id];
            }
            return next;
          });
        }, 2500);
      }
    } catch (error) {
      console.error('No se pudo actualizar el miembro', error);
      setFeedback((prev) => ({
        ...prev,
        [member.id]: { type: 'error', message: 'No se pudo guardar. Revisá los datos.' },
      }));
    } finally {
      setSaving((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
    }
  };

  if (!members.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        No hay miembros registrados en esta familia.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {members.map((member) => {
        const isSaving = Boolean(saving[member.id]);
        const hasChanges = Boolean(drafts[member.id] && Object.keys(drafts[member.id]).length);
        const status = feedback[member.id];
        const base = baseValuesMap.get(member.id) || memberToFormValues(member);
        return (
          <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {member.filiatorios?.iniciales || '—'} · {base.nombre || 'Sin nombre'} {base.apellido || ''}
                </div>
                <div className="text-xs text-slate-500">
                  {member.rol || 'Sin rol asignado'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReset(member.id)}
                  disabled={!hasChanges}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Deshacer
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(member)}
                  disabled={!hasChanges || isSaving}
                  className="px-3 py-1.5 rounded-xl border border-slate-900 bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  {isSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Iniciales
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2 uppercase"
                  value={getValue(member, 'iniciales')}
                  onChange={(e) => updateDraft(member, 'iniciales', e.target.value.toUpperCase())}
                  placeholder="A1"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Nombre(s)
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'nombre')}
                  onChange={(e) => updateDraft(member, 'nombre', e.target.value)}
                  placeholder="Nombre"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Apellido(s)
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'apellido')}
                  onChange={(e) => updateDraft(member, 'apellido', e.target.value)}
                  placeholder="Apellido"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Sexo
                <select
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  value={getValue(member, 'sexo')}
                  onChange={(e) => updateDraft(member, 'sexo', e.target.value)}
                >
                  {SEX_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Fecha de nacimiento
                <input
                  type="date"
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'nacimiento')}
                  onChange={(e) => updateDraft(member, 'nacimiento', e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Obra social
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'os')}
                  onChange={(e) => updateDraft(member, 'os', e.target.value)}
                  placeholder="OS"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Teléfono
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'telefono')}
                  onChange={(e) => updateDraft(member, 'telefono', e.target.value)}
                  placeholder="+54 9 ..."
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Email
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'email')}
                  onChange={(e) => updateDraft(member, 'email', e.target.value)}
                  placeholder=" correo@dominio.com"
                />
              </label>
            </div>

            <div className="grid gap-3">
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Diagnóstico / Motivo
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'diagnostico')}
                  onChange={(e) => updateDraft(member, 'diagnostico', e.target.value)}
                  placeholder="Motivo de consulta"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Resumen clínico
                <textarea
                  className="mt-1 min-h-[90px] rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'resumen')}
                  onChange={(e) => updateDraft(member, 'resumen', e.target.value)}
                  placeholder="Síntesis clínica del miembro"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Estado
                <input
                  className="mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={getValue(member, 'estado')}
                  onChange={(e) => updateDraft(member, 'estado', e.target.value)}
                  placeholder="Activo / Fallecido / etc."
                />
              </label>
            </div>

            {status && (
              <div
                className={`text-xs ${ 
                  status.type === 'error' ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {status.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Mapeo de tabs (clave interna -> label visible)
const TAB_LABEL = {
  resumen: 'Resumen',
  arbol: 'Árbol familiar',
  miembros: 'Administrar miembros',
  complementarios: 'Estudios complementarios',
  geneticos: 'Estudios genéticos',
  fotos: 'Fotos',
  evoluciones: 'Ver todas las evoluciones',
};
const TABS_ORDER = ['resumen', 'arbol', 'miembros', 'complementarios', 'geneticos', 'fotos', 'evoluciones'];
function FamilyDetail({
  family,
  members,
  evolutions,
  studies = [],
  onBack,
  onAddEvolution,
  onUpdateMember,
  initialTab = 'resumen',
}) {
  const [tab, setTab] = useState(initialTab);
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(() => members[0]?.id || '');
  const [evolutionText, setEvolutionText] = useState('');
  const [evolutionFilterMemberId, setEvolutionFilterMemberId] = useState('all');
  const canAddEvolution = Boolean(onAddEvolution && members.length);

  useEffect(() => {
    if (!members.length) {
      setSelectedMemberId('');
      return;
    }
    if (!members.some(m => m.id === selectedMemberId)) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (evolutionFilterMemberId === 'all') return;
    if (!members.some(m => m.id === evolutionFilterMemberId)) {
      setEvolutionFilterMemberId('all');
    }
  }, [members, evolutionFilterMemberId]);

  useEffect(() => {
    if (!showEvolutionForm) {
      setEvolutionText('');
    }
  }, [showEvolutionForm]);

  const handleEvolutionSubmit = () => {
    if (!onAddEvolution || !selectedMemberId) return;
    const texto = evolutionText.trim();
    if (!texto) return;
    onAddEvolution(selectedMemberId, texto);
    setEvolutionFilterMemberId(selectedMemberId);
    setShowEvolutionForm(false);
  };

  const canSubmitEvolution = Boolean(onAddEvolution && selectedMemberId && evolutionText.trim());

  const renderAddEvolutionButton = () => {
    if (!canAddEvolution) return null;
    return (
      <button
        type="button"
        onClick={() => setShowEvolutionForm((prev) => !prev)}
        className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700"
      >
        {showEvolutionForm ? 'Cancelar' : '➕ Agregar evolución'}
      </button>
    );
  };


  const evolutionFormCard = showEvolutionForm ? (
    <div className="grid gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
      <label className="grid gap-1 text-xs text-slate-600">
        <span className="uppercase tracking-wide text-[10px] text-slate-500">Miembro</span>
        <select
          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {`${m.filiatorios?.iniciales || m.rol || '—'} · ${m.nombre || 'Sin nombre'}`}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-slate-600">
        <span className="uppercase tracking-wide text-[10px] text-slate-500">Evolución</span>
        <textarea
          className="min-h-[80px] px-3 py-2 rounded-xl border border-slate-300 bg-white"
          value={evolutionText}
          onChange={(e) => setEvolutionText(e.target.value)}
          placeholder="Detalle de la evolución"
        />
      </label>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm"
          onClick={() => setShowEvolutionForm(false)}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-xl border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-sm"
          onClick={handleEvolutionSubmit}
          disabled={!canSubmitEvolution}
        >
          Guardar
        </button>
      </div>
    </div>
  ) : null;  // Datos para Resumen
  const a1 = useMemo(()=>pickA1(members), [members]);
  const lastEv = useMemo(()=>latestEvolutionForFamily(evolutions, members), [evolutions, members]);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const geneticsSummary = useMemo(() => {
    if (Array.isArray(studies) && studies.length > 0) {
      const studyLines = studies
        .filter((study) => (!family?.id || study.familyId === family.id) && (!study.memberId || memberById.has(study.memberId)))
        .sort((a, b) => {
          const dateA = toDate(a.resultadoFecha || a.fecha || a.createdAt);
          const dateB = toDate(b.resultadoFecha || b.fecha || b.createdAt);
          return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        })
        .map((study) => {
          const member = study.memberId ? memberById.get(study.memberId) : null;
          const memberLabel = member
            ? member.filiatorios?.iniciales || member.nombre || member.rol || 'Miembro'
            : 'Familia';
          const dateLabel = formatDate(study.resultadoFecha || study.fecha);
          const parts = [study.tipo || 'Estudio'];
          if (study.nombre) parts.push(study.nombre);
          if (dateLabel) parts.push(dateLabel);
          parts.push(memberLabel);
          const trimmedResult = typeof study.resultado === 'string' ? study.resultado.trim() : '';
          if (trimmedResult) {
            parts.push(`Resultado: ${trimmedResult}`);
          }
          return parts.join(' · ');
        });

      if (studyLines.length > 0) {
        return studyLines.join('\n');
      }
    }

    return inferGeneticStudiesText(
      evolutions.filter((e) => !e.memberId || memberById.has(e.memberId)),
    );
  }, [studies, family?.id, memberById, evolutions]);
  const familyEvolutionsAll = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    return evolutions
      .filter((e) => memberIds.has(e.memberId))
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [evolutions, members]);
  const visibleEvolutions = useMemo(() => (
    evolutionFilterMemberId === 'all'
      ? familyEvolutionsAll
      : familyEvolutionsAll.filter((e) => e.memberId === evolutionFilterMemberId)
  ), [familyEvolutionsAll, evolutionFilterMemberId]);

  const resumenText = useMemo(() => {
    const motivo = a1?.diagnostico || '—';
    const est = geneticsSummary || '—';
    const u = lastEv ? `${fmtDateTime(new Date(lastEv.at))}: ${lastEv.texto}` : '—';
    return `Motivo de consulta: ${motivo}\nEstudios genéticos: ${est}\nÚltima evolución: ${u}`;
  }, [a1, geneticsSummary, lastEv]);

  const intakeData = family.intake?.administrativo || {};
  const intakeSections = useMemo(
    () => buildIntakeSections(intakeData, family),
    [intakeData, family],
  );

  return (
    <div className="grid gap-4">
      <AppToolbar code={family.code} onBack={onBack} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mt-0 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {TABS_ORDER.map(key => {
              const label = TAB_LABEL[key];
              const isActive = tab === key;
              const common = `px-3 py-1.5 rounded-xl border ${isActive? 'bg-slate-900 text-white border-slate-900':'border-slate-300 hover:bg-slate-50'}`;

              if (key === 'fotos') {
                return (
                  <button
                    key={key}
                    onClick={()=> setTab('fotos')}
                    className={common}
                    title="Fotos"
                  >
                    {label}
                  </button>
                );
              }

              

              return (
                <button key={key} onClick={()=>setTab(key)} className={common}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab === 'resumen' && (
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">Resumen</div>
              </div>
              {evolutionFormCard}
              <textarea
                value={resumenText}
                readOnly
                className="min-h-[140px] px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-700"
              />
            </article>
            {intakeSections.map((section) => (
              <IntakeSection key={section.id} section={section} />
            ))}
          </div>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
            <div className="text-sm font-semibold">Miembros</div>
            <div className="grid gap-2">
              {members.map((m) => (
                <MemberCardLine
                  key={m.id}
                  m={m}
                  onOpen={(mm) => {
                    setSelectedMemberId(mm.id);
                    setEvolutionFilterMemberId(mm.id);
                    setShowEvolutionForm(false);
                    setTab('evoluciones');
                  }}
                />
              ))}
            </div>
          </article>
        </div>
      )}
      {tab === 'miembros' && (
        <MembersAdminTab
          members={members}
          onUpdateMember={onUpdateMember}
        />
      )}

      {tab === 'arbol' && (
        <FamilyTreePage familyId={family.id} />
      )}

      {tab === 'complementarios' && (
        <FamilyStudiesPage familyId={family.id} inline />
      )}

      {tab === 'geneticos' && (
        <GeneticsPage familyId={family.id} inline />
      )}

      {tab === 'fotos' && (
        <PhotosPage familyId={family.id} inline />
      )}

      {tab === 'evoluciones' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Evoluciones de la familia</div>
            <div className="flex items-center gap-2">
              {members.length > 0 && (
                <select
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                  value={evolutionFilterMemberId}
                  onChange={(e) => setEvolutionFilterMemberId(e.target.value)}
                >
                  <option value="all">Todos los miembros</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {`${m.filiatorios?.iniciales || m.rol || '—'} · ${m.nombre || 'Sin nombre'}`}
                    </option>
                  ))}
                </select>
              )}
              {renderAddEvolutionButton()}
            </div>
          </div>
          {evolutionFormCard}
          <div className="grid gap-3">
            {visibleEvolutions.length ? (
              visibleEvolutions.map((evol) => {
                const relatedMember = memberById.get(evol.memberId);
                return (
                  <div key={evol.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div>
                        <b>{relatedMember?.filiatorios?.iniciales || relatedMember?.rol || '—'}</b>
                        {relatedMember?.nombre ? ` · ${relatedMember.nombre}` : ''}
                      </div>
                      <div className="text-xs text-slate-500 text-right leading-tight">
                        <div>Fecha evolución: {fmtDateTime(new Date(evol.at))}</div>
                        {evol.createdAt ? (
                          <div className="text-[11px] text-slate-400">
                            Registrado: {fmtDateTime(new Date(evol.createdAt))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{evol.texto}</div>
                    <div className="text-[11px] text-slate-500">{evol.author || 'Sin autor'}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-500">No hay evoluciones registradas para esta familia.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyDetail;
