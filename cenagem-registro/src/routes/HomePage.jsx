// ===============================
// src/routes/HomePage.jsx — Pantalla de inicio
// ===============================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';
import { cenagemApi } from '@/lib/apiClient';
import NewCaseCreate from '@/components/NewCaseCreate.jsx';
import NewCaseWizard from '@/components/NewCase/NewCaseWizard.jsx';
import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';
import CaseAccessPanel from '@/modules/home/components/CaseAccessPanel.jsx';
import FooterBar from '@/modules/home/components/FooterBar.jsx';
import HomeHeader from '@/modules/home/components/HomeHeader.jsx';
import MetricsBoard from '@/modules/home/components/MetricsBoard.jsx';
import TodayAgenda from '@/modules/home/components/TodayAgenda.jsx';
import WeeklyAgendaBoard from '@/modules/home/components/WeeklyAgendaBoard.jsx';
import { normalizeFamilyCodeInput, formatFriendlyDate, formatISODateLocal } from '@/modules/home/agenda';
import { useAgenda } from '@/modules/home/useAgenda';

const uidLocal = () => Math.random().toString(36).slice(2, 10);

function normalizeAgCode(value) {
  if (!value) return '';
  let cleaned = value.trim().toUpperCase();
  if (!cleaned) return '';
  if (cleaned.startsWith('AG-')) {
    const digits = cleaned.slice(3).replace(/\D/g, '');
    return digits ? `AG-${digits.padStart(4, '0')}` : '';
  }
  cleaned = cleaned.replace(/^AG\s*/i, '');
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';
  return `AG-${digits.padStart(4, '0')}`;
}

function generateNextCode(families = []) {
  const patternAg = /^AG-(\d{4})$/;
  let maxAg = 0;
  families.forEach((fam) => {
    const matchAg = patternAg.exec(fam.code || '');
    if (matchAg) {
      const num = parseInt(matchAg[1], 10);
      if (Number.isFinite(num)) maxAg = Math.max(maxAg, num);
    }
  });
  const next = String((maxAg || 0) + 1).padStart(4, '0');
  return `AG-${next}`;
}

function buildMotivoMetadata(groupId, detailId) {
  const group = MOTIVO_CONSULTA_GROUPS.find((item) => item.id === groupId) || null;
  const detail = group?.options.find((opt) => opt.id === detailId) || null;
  return {
    groupId,
    groupLabel: group?.label || '',
    detailId,
    detailLabel: detail?.label || ''
  };
}

function buildExamenFisicoFromPayload(payload = {}) {
  const examen = {
    peso: payload.pacienteExamenPeso,
    talla: payload.pacienteExamenTalla,
    perimetroCefalico: payload.pacienteExamenPc,
    edadReferencia: payload.pacienteEdad,
    observaciones: payload.pacienteExamenObservaciones,
    dismorfias: payload.pacienteExamenDismorfias,
    ojos: payload.pacienteExamenOjos,
    nariz: payload.pacienteExamenNariz,
    filtrum: payload.pacienteExamenFiltrum,
    boca: payload.pacienteExamenBoca,
    orejas: payload.pacienteExamenOrejas,
    cuello: payload.pacienteExamenCuello,
    torax: payload.pacienteExamenTorax,
    columna: payload.pacienteExamenColumna,
    abdomen: payload.pacienteExamenAbdomen,
    genitales: payload.pacienteExamenGenitales,
    otras: payload.pacienteExamenOtras,
  };
  Object.keys(examen).forEach((key) => {
    const value = examen[key];
    if (value == null || value === '') {
      delete examen[key];
    }
  });
  return examen;
}

function mapIntakeToFamily({ family, members = [], payload }) {
  const hasContent = (value) => {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };

  const motivo = buildMotivoMetadata(payload.motivoGroup, payload.motivoDetail);
  const existingTags = Array.isArray(family.tags) ? family.tags : [];
  const tags = Array.from(
    new Set(
      [
        ...existingTags,
        motivo.groupId,
        motivo.detailId,
        motivo.groupLabel?.toLowerCase?.(),
        motivo.detailLabel?.toLowerCase?.(),
      ].filter(Boolean),
    ),
  );
  const medicoAsignado = (payload.medicoAsignado || family.medicoAsignado || '').trim();
  const examenFisico = buildExamenFisicoFromPayload(payload);
  const contactos = {
    direccion: payload.pacienteDireccion || family.filiatoriosContacto?.direccion || '',
    email: payload.pacienteEmail || family.filiatoriosContacto?.email || '',
    telefono: payload.pacienteTelefono || family.filiatoriosContacto?.telefono || '',
  };
  const nowIso = new Date().toISOString();
  const intakePrev = family.intake || {};
  const intake = {
    ...intakePrev,
    administrativo: { ...(intakePrev.administrativo || {}), ...payload },
    wizardPending: false,
    wizardCompletedAt: nowIso,
    wizardPayload: payload,
    examen: Object.keys(examenFisico).length
      ? { ...examenFisico, edadReferencia: payload.pacienteEdad }
      : intakePrev.examen,
  };

  const previousAbuelos = family.abuelos || {};
  const familyPatch = {
    code: normalizeAgCode(payload.agNumber) || family.code,
    provincia: payload.provincia || family.provincia || '',
    tags,
    motivo,
    motivoNotes: payload.motivoDerivacion || family.motivoNotes,
    motivoPaciente: payload.motivoPaciente || family.motivoPaciente,
    motivoDerivacion: payload.motivoDerivacion || family.motivoDerivacion,
    medicoAsignado,
    filiatoriosContacto: contactos,
    consanguinidad: {
      estado: payload.consanguinidad || family.consanguinidad?.estado || 'no',
      detalle: payload.consanguinidadDetalle || family.consanguinidad?.detalle || '',
    },
    antecedentesObstetricos: payload.obstetricosDescripcion || family.antecedentesObstetricos,
    abuelos: {
      paternos: {
        abuelo: {
          apellido:
            payload.abueloPaternoApellido ||
            previousAbuelos?.paternos?.abuelo?.apellido ||
            '',
          procedencia:
            payload.abueloPaternoProcedencia ||
            previousAbuelos?.paternos?.abuelo?.procedencia ||
            '',
        },
        abuela: {
          apellido:
            payload.abuelaPaternaApellido ||
            previousAbuelos?.paternos?.abuela?.apellido ||
            '',
          procedencia:
            payload.abuelaPaternaProcedencia ||
            previousAbuelos?.paternos?.abuela?.procedencia ||
            '',
        },
      },
      maternos: {
        abuelo: {
          apellido:
            payload.abueloMaternoApellido ||
            previousAbuelos?.maternos?.abuelo?.apellido ||
            '',
          procedencia:
            payload.abueloMaternoProcedencia ||
            previousAbuelos?.maternos?.abuelo?.procedencia ||
            '',
        },
        abuela: {
          apellido:
            payload.abuelaMaternaApellido ||
            previousAbuelos?.maternos?.abuela?.apellido ||
            '',
          procedencia:
            payload.abuelaMaternaProcedencia ||
            previousAbuelos?.maternos?.abuela?.procedencia ||
            '',
        },
      },
    },
    intake,
  };

  const familyMembers = Array.isArray(members) ? members : [];
  const proband =
    familyMembers.find(
      (member) => member.rol === 'Proband' || member.filiatorios?.iniciales === 'A1',
    ) || null;
  const probandId = proband?.id || null;
  const pacienteNombre = (payload.pacienteNombre || '').trim();
  const pacienteApellido = (payload.pacienteApellido || '').trim();
  const pacienteNombreCompleto =
    [pacienteNombre, pacienteApellido].filter(Boolean).join(' ') ||
    proband?.nombre ||
    'Paciente sin nombre';

  let probandPatch = null;
  if (proband) {
    const contacto = { ...(proband.contacto || {}) };
    if (hasContent(payload.pacienteEmail)) contacto.email = payload.pacienteEmail;
    if (hasContent(payload.pacienteTelefono)) contacto.telefono = payload.pacienteTelefono;
    const contactoValue =
      Object.keys(contacto).length > 0 ? contacto : proband.contacto;

    probandPatch = {
      filiatorios: { ...(proband.filiatorios || {}), nombreCompleto: pacienteNombreCompleto },
      nombre: pacienteNombreCompleto,
      contacto: contactoValue,
      direccion: contactos.direccion || proband.direccion,
      diagnostico: motivo.detailLabel || motivo.groupLabel || proband.diagnostico,
      sexo: payload.pacienteSexo || proband.sexo || undefined,
      nacimiento: payload.pacienteNacimiento || proband.nacimiento || undefined,
      profesion: payload.pacienteProfesion || proband.profesion || undefined,
      obraSocial: payload.pacienteObraSocial || proband.obraSocial || undefined,
      antecedentesPersonales:
        payload.pacienteAntecedentes || proband.antecedentesPersonales || undefined,
      examenFisico: Object.keys(examenFisico).length ? examenFisico : proband.examenFisico,
    };
  }

  const relatives = [];
  const motherData = {
    nombre: payload.b1Nombre,
    apellido: payload.b1Apellido,
    nacimiento: payload.b1Nacimiento,
    email: payload.b1Email,
    profesion: payload.b1Profesion,
    obraSocial: payload.b1ObraSocial,
    antecedentes: payload.b1Antecedentes,
  };
  if (Object.values(motherData).some(hasContent)) {
    relatives.push({
      role: 'B1',
      initials: 'B1',
      data: motherData,
    });
  }

  const fatherData = {
    nombre: payload.c1Nombre,
    apellido: payload.c1Apellido,
    nacimiento: payload.c1Nacimiento,
    email: payload.c1Email,
    profesion: payload.c1Profesion,
    obraSocial: payload.c1ObraSocial,
    antecedentes: payload.c1Antecedentes,
  };
  const obstetricos = {
    gestas: payload.c1Gestas,
    partos: payload.c1Partos,
    abortos: payload.c1Abortos,
    cesareas: payload.c1Cesareas,
  };
  const hasFatherData = Object.values(fatherData).some(hasContent);
  const hasObstetricos = Object.values(obstetricos).some(hasContent);
  if (hasFatherData || hasObstetricos) {
    relatives.push({
      role: 'C1',
      initials: 'C1',
      data: fatherData,
      obstetricos: hasObstetricos ? obstetricos : undefined,
    });
  }

  const resumenPrimera = (payload.resumenPrimeraConsulta || payload.primeraEvolucion || '').trim();
  const evolutionText =
    resumenPrimera ||
    [
      `Motivo: ${motivo.detailLabel || motivo.groupLabel || 'Motivo de consulta'}`,
      payload.motivoPaciente ? `Paciente: ${payload.motivoPaciente}` : '',
      payload.motivoDerivacion ? `Derivación: ${payload.motivoDerivacion}` : '',
      medicoAsignado ? `Profesional: ${medicoAsignado}` : '',
      payload.pacienteExamenPeso ? `Peso: ${payload.pacienteExamenPeso} kg` : '',
      payload.pacienteExamenTalla ? `Talla: ${payload.pacienteExamenTalla} cm` : '',
      payload.pacienteExamenPc ? `PC: ${payload.pacienteExamenPc} cm` : '',
    ]
      .filter(Boolean)
      .join(' | ');

  return {
    familyPatch,
    probandPatch,
    probandId,
    relatives,
    evolutionText,
  };
}

function buildWizardInitialData(family, members = []) {
  if (!family) return null;
  const admin = { ...(family.intake?.administrativo || {}) };
  const base = { ...admin };
  const findMember = (predicate) => members.find(predicate) || null;
  const proband = findMember((member) => member.rol === 'Proband' || member.filiatorios?.iniciales === 'A1');

  const ensure = (field, value) => {
    if (base[field] == null || base[field] === '') {
      if (value != null && value !== '') {
        base[field] = value;
      }
    }
  };

  ensure('agNumber', family.code);
  ensure('motivoGroup', family.motivo?.groupId);
  ensure('motivoDetail', family.motivo?.detailId);
  ensure('motivoPaciente', family.motivoPaciente);
  ensure('motivoDerivacion', family.motivoDerivacion);
  ensure('provincia', family.provincia);
  ensure('medicoAsignado', family.medicoAsignado);
  ensure('pacienteDireccion', family.filiatoriosContacto?.direccion);
  ensure('pacienteEmail', family.filiatoriosContacto?.email || proband?.contacto?.email);
  ensure('pacienteTelefono', family.filiatoriosContacto?.telefono || proband?.contacto?.telefono);
  ensure('pacienteNacimiento', proband?.nacimiento);
  ensure('pacienteSexo', proband?.sexo);
  ensure('pacienteProfesion', proband?.profesion);
  ensure('pacienteAntecedentes', proband?.antecedentesPersonales);
  ensure('pacienteObraSocial', proband?.obraSocial);

  base.consanguinidad = base.consanguinidad || family.consanguinidad?.estado || 'no';
  base.consanguinidadDetalle = base.consanguinidadDetalle || family.consanguinidad?.detalle || '';
  base.obstetricosDescripcion = base.obstetricosDescripcion || family.antecedentesObstetricos || '';

  const abuelos = family.abuelos || {};
  ensure('abueloPaternoApellido', abuelos.paternos?.abuelo?.apellido);
  ensure('abueloPaternoProcedencia', abuelos.paternos?.abuelo?.procedencia);
  ensure('abuelaPaternaApellido', abuelos.paternos?.abuela?.apellido);
  ensure('abuelaPaternaProcedencia', abuelos.paternos?.abuela?.procedencia);
  ensure('abueloMaternoApellido', abuelos.maternos?.abuelo?.apellido);
  ensure('abueloMaternoProcedencia', abuelos.maternos?.abuelo?.procedencia);
  ensure('abuelaMaternaApellido', abuelos.maternos?.abuela?.apellido);
  ensure('abuelaMaternaProcedencia', abuelos.maternos?.abuela?.procedencia);

  return base;
}

export default function HomePage({ user, onLogout }) {
  const {
    state,
    STORAGE_KEY,
    createFamily,
    createMember,
    addEvolution,
    updateFamily,
    updateMember,
    ensureFamilyDetail,
  } = useCenagemStore();
  const { families = [], members = [], evolutions = [] } = state;

  const [showNewCase, setShowNewCase] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);
  const [createCaseError, setCreateCaseError] = useState(null);
  const [pendingAppointmentForNewCase, setPendingAppointmentForNewCase] = useState(null);
  const {
    agenda,
    selectedDate,
    agendaForSelectedDate,
    nextAvailableSlots,
    service,
    setSelectedDate,
    addAppointment,
    updateAppointmentStatus,
    removeAppointment,
    markFamilyAppointmentsAsAttended,
    syncAgenda,
    setAgenda,
    setService,
  } = useAgenda();
  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [familyCodeFeedback, setFamilyCodeFeedback] = useState(null);
  const [familySearchResults, setFamilySearchResults] = useState([]);
  const [familySearchBusy, setFamilySearchBusy] = useState(false);
  const familySearchRequestIdRef = useRef(0);
  const [wizardFamilyId, setWizardFamilyId] = useState(null);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [wizardActive, setWizardActive] = useState(false);
  const [showAnalyticsButton, setShowAnalyticsButton] = useState(true);
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canViewUsers = userPermissions.includes('USERS_VIEW');
  const canManageUsers = userPermissions.includes('USERS_MANAGE');
  const userAdminDescription = canManageUsers
    ? 'Gestioná cuentas y roles del equipo.'
    : 'Consultá el listado de usuarios habilitados.';

  useEffect(() => {
    setWizardBusy(false);
    setWizardActive(false);
  }, [wizardFamilyId]);

  const membersById = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      map[member.id] = member;
    });
    return map;
  }, [members]);

  const membersByFamilyId = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      if (!member.familyId) return;
      if (!map[member.familyId]) map[member.familyId] = [];
      map[member.familyId].push(member);
    });
    return map;
  }, [members]);

  const familiesById = useMemo(() => {
    const map = {};
    families.forEach((family) => {
      map[family.id] = family;
    });
    return map;
  }, [families]);

  const familyByCode = useMemo(() => {
    const map = {};
    families.forEach((family) => {
      if (family.code) {
        map[family.code.toLowerCase()] = family;
      }
    });
    return map;
  }, [families]);

  useEffect(() => {
    const term = familyCodeInput.trim();
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (term.length < 2) {
      familySearchRequestIdRef.current += 1;
      setFamilySearchResults([]);
      setFamilySearchBusy(false);
      return undefined;
    }

    const requestId = familySearchRequestIdRef.current + 1;
    familySearchRequestIdRef.current = requestId;
    setFamilySearchBusy(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await cenagemApi.listFamilies({
          search: term,
          limit: 8,
          withMembers: true,
        });
        if (familySearchRequestIdRef.current !== requestId) {
          return;
        }
        const collection = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        const formattedResults = collection.map((item) => {
          const membersPreview = Array.isArray(item.membersPreview)
            ? item.membersPreview.map((member) => ({
                id: member.id,
                name:
                  (typeof member.displayName === 'string' && member.displayName.trim()) ||
                  (typeof member.initials === 'string' && member.initials.trim()) ||
                  '',
                dni: typeof member.documentNumber === 'string' ? member.documentNumber.trim() : '',
                role: member.role || '',
              }))
            : [];

          const intake =
            item.intake && typeof item.intake === 'object' && !Array.isArray(item.intake)
              ? item.intake
              : null;
          const administrativo =
            intake && typeof intake.administrativo === 'object' && !Array.isArray(intake.administrativo)
              ? intake.administrativo
              : null;

          if (
            administrativo &&
            (!membersPreview.length || membersPreview.every((member) => !member.dni))
          ) {
            const adminNombre = [
              typeof administrativo.pacienteNombre === 'string' ? administrativo.pacienteNombre.trim() : '',
              typeof administrativo.pacienteApellido === 'string' ? administrativo.pacienteApellido.trim() : '',
            ]
              .filter(Boolean)
              .join(' ');
            const adminDni =
              typeof administrativo.pacienteDni === 'string'
                ? administrativo.pacienteDni.trim()
                : '';
            if (adminNombre || adminDni) {
              membersPreview.push({
                id: `${item.id}-administrativo`,
                name: adminNombre || 'Paciente principal',
                dni: adminDni,
                role: 'Paciente',
              });
            }
          }

          return {
            id: item.id,
            code: item.code,
            displayName: item.displayName,
            members: membersPreview,
          };
        });

        setFamilySearchResults(formattedResults);
      } catch (error) {
        if (familySearchRequestIdRef.current === requestId) {
          console.error('Error al buscar historias clínicas', error);
          setFamilySearchResults([]);
        }
      } finally {
        if (familySearchRequestIdRef.current === requestId) {
          setFamilySearchBusy(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [familyCodeInput]);

  const wizardFamily = wizardFamilyId ? familiesById[wizardFamilyId] : null;

  const wizardFamilyMembers = useMemo(() => {
    if (!wizardFamilyId) return [];
    return membersByFamilyId[wizardFamilyId] || [];
  }, [wizardFamilyId, membersByFamilyId]);

  const wizardInitialData = useMemo(() => {
    if (!wizardFamily) return null;
    return buildWizardInitialData(wizardFamily, wizardFamilyMembers);
  }, [wizardFamily, wizardFamilyMembers]);

  const wizardReady = Boolean(wizardInitialData && wizardFamilyId);
  const wizardPatientName = useMemo(() => {
    if (!wizardInitialData) return '';
    const name = [wizardInitialData.pacienteNombre, wizardInitialData.pacienteApellido]
      .filter(Boolean)
      .join(' ')
      .trim();
    return name;
  }, [wizardInitialData]);
  const probands = useMemo(() => members.filter((member) => member.rol === 'Proband'), [members]);
  const consultasHoy = agendaForSelectedDate.length;
  const pendientesHoy = agendaForSelectedDate.filter((item) => item.estado !== 'Atendido').length;

  const followUps = useMemo(() => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const thresholdDays = 60;
    const byMember = {};
    evolutions.forEach((evo) => {
      if (!byMember[evo.memberId]) byMember[evo.memberId] = [];
      byMember[evo.memberId].push(evo);
    });

    return members
      .filter((member) => member.rol === 'Proband')
      .map((member) => {
        const memberEvolutions = byMember[member.id] || [];
        const lastTimestamp = memberEvolutions.reduce((latest, evo) => {
          const time = new Date(evo.at).getTime();
          return time > latest ? time : latest;
        }, 0);
        const daysSince = lastTimestamp ? Math.floor((now - lastTimestamp) / msPerDay) : Number.POSITIVE_INFINITY;
        return {
          memberId: member.id,
          familyId: member.familyId,
          daysSince,
          lastEvolution: lastTimestamp ? new Date(lastTimestamp).toISOString() : null
        };
      })
      .filter((item) => !Number.isFinite(item.daysSince) || item.daysSince >= thresholdDays)
      .sort((a, b) => {
        const normalize = (value) => (Number.isFinite(value) ? value : 9999);
        return normalize(b.daysSince) - normalize(a.daysSince);
      });
  }, [members, evolutions]);

  const selectedDateLabel = formatFriendlyDate(selectedDate);

  const nextAgNumber = useMemo(() => generateNextCode(families), [families]);

  const metrics = [
    { label: 'Consultas hoy', value: consultasHoy, hint: selectedDateLabel || '' },
    { label: 'Pendientes', value: pendientesHoy, hint: 'Turnos sin marcar como atendidos' },
    { label: 'Familias activas', value: families.length, hint: 'Historias familiares cargadas' },
    { label: 'Seguimiento >60 días', value: followUps.length, hint: 'Probands a revisar' }
  ];

  const agendaMembersOptions = useMemo(() => {
    return probands.length ? probands : members;
  }, [probands, members]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        window.location.hash = 'analytics';
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowNewCase(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCreateAppointment = async ({
    memberId,
    date,
    time,
    motivo,
    notas,
    primeraConsulta,
    sobreturno,
    primeraConsultaInfo,
    service: serviceFromForm,
    serviceDetails,
  }) => {
    const member = memberId ? membersById[memberId] : null;
    if (!member && !primeraConsulta) return;
    const serviceKey = (serviceFromForm || service || 'clinica').toLowerCase();
    const appointment = {
      id: uidLocal(),
      memberId: member?.id || null,
      familyId: member?.familyId || null,
      date: date || selectedDate,
      time: time || '08:00',
      motivo: motivo || member?.diagnostico || 'Consulta genética',
      notas,
      estado: 'Pendiente',
      primeraConsulta: Boolean(primeraConsulta),
      sobreturno: Boolean(sobreturno),
      primeraConsultaInfo: primeraConsulta ? primeraConsultaInfo || null : null,
      service: serviceKey,
      serviceDetails: serviceDetails || null,
    };
    try {
      await addAppointment(appointment);
    } catch (error) {
      console.error('No se pudo crear el turno', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
    } catch (error) {
      console.error('No se pudo actualizar el estado del turno', error);
    }
  };

  const handleRemoveAppointment = async (id) => {
    try {
      await removeAppointment(id);
    } catch (error) {
      console.error('No se pudo eliminar el turno', error);
    }
  };

  const handleCreateFamilyCaseFromAppointment = (appointment) => {
    setCreateCaseError(null);
    setPendingAppointmentForNewCase(appointment || null);
    setShowNewCase(true);
  };

  const handleOpenFamily = async (familyId) => {
    const family = familiesById[familyId];
    if (family?.intake?.wizardPending) {
      setWizardBusy(false);
      setWizardFamilyId(familyId);
      setWizardActive(false);
      return;
    }
    try {
      await markFamilyAppointmentsAsAttended(familyId, selectedDate);
    } catch (error) {
      console.error('No se pudieron actualizar los turnos de la familia', error);
    }
    window.location.hash = '#/family/' + familyId;
  };

  const startWizardForFamily = () => {
    if (!wizardReady) return;
    setWizardActive(true);
  };

  const handleCancelWizard = () => {
    setWizardBusy(false);
    setWizardActive(false);
    setWizardFamilyId(null);
  };

  const handleFamilyCodeInputChange = (value) => {
    setFamilyCodeInput(value);
    if (familyCodeFeedback) setFamilyCodeFeedback(null);
  };

  const handleGoToFamilyByCode = () => {
    const normalized = normalizeFamilyCodeInput(familyCodeInput);
    if (!normalized) {
      setFamilyCodeFeedback('Ingresá un número de HC.');
      return;
    }
    const family = familyByCode[normalized.toLowerCase()];
    if (!family) {
      setFamilyCodeFeedback('No encontramos una HC con ese número.');
      return;
    }
    setFamilyCodeFeedback(null);
    setFamilyCodeInput('');
    familySearchRequestIdRef.current += 1;
    setFamilySearchResults([]);
    setFamilySearchBusy(false);
    handleOpenFamily(family.id);
  };

  const handleSelectFamilyFromSearch = async (familyId) => {
    if (!familyId) return;
    familySearchRequestIdRef.current += 1;
    setFamilySearchResults([]);
    setFamilyCodeInput('');
    setFamilyCodeFeedback(null);
    setFamilySearchBusy(true);
    try {
      await ensureFamilyDetail(familyId, true);
      await handleOpenFamily(familyId);
    } catch (error) {
      console.error('No se pudo abrir la historia clínica seleccionada', error);
    } finally {
      setFamilySearchBusy(false);
    }
  };

  const handleCreateCase = async (formPayload) => {
    setCreatingCase(true);
    setCreateCaseError(null);
    const appointmentContext = pendingAppointmentForNewCase;
    const payload = { ...formPayload };
    if (!payload.consultaFecha) {
      payload.consultaFecha = appointmentContext?.date || formatISODateLocal(new Date());
    }
    let logOpened = false;
    try {
      const normalizedCode = normalizeAgCode(payload.agNumber);
      const code = normalizedCode || generateNextCode(families);
      console.groupCollapsed('[new-case] Creando HC');
      logOpened = true;
      console.log('Formulario normalizado', payload);
      console.log('Código elegido', { ingresa: payload.agNumber, normalizado: normalizedCode, final: code });
      if (appointmentContext) {
        console.log('Contexto de turno asociado', appointmentContext);
      }
      const motivo = buildMotivoMetadata(payload.motivoGroup, payload.motivoDetail);
      const tags = Array.from(new Set([
        motivo.groupId,
        motivo.detailId,
        motivo.groupLabel?.toLowerCase(),
        motivo.detailLabel?.toLowerCase()
      ].filter(Boolean)));
      const medicoAsignado = (payload.medicoAsignado || '').trim();
      const nowIso = new Date().toISOString();

      const ingresoInfo = appointmentContext
        ? {
            tipo: appointmentContext.primeraConsulta ? 'primera_consulta' : 'agenda',
            label: appointmentContext.primeraConsulta ? 'Ingreso de 1ra consulta' : 'Ingreso programado',
            estado: 'en_sala',
            appointmentId: appointmentContext.id || null,
            agendaFecha: appointmentContext.date || null,
            agendaHora: appointmentContext.time || null,
            registradoPor: user?.email || 'registro',
            registradoEn: nowIso,
          }
        : null;

      const metadataExtras = appointmentContext
        ? {
            ingresoTipo: appointmentContext.primeraConsulta ? 'primera_consulta' : 'agenda',
            ingresoLabel: appointmentContext.primeraConsulta ? 'Ingreso de 1ra consulta' : 'Ingreso programado',
            ingresoEstado: 'en_sala',
            agendaAppointmentId: appointmentContext.id || null,
            agendaDate: appointmentContext.date || null,
            agendaTime: appointmentContext.time || null,
          }
        : {};

      const family = await createFamily({
        code,
        provincia: payload.provincia || '',
        tags,
        motivo,
        motivoNotes: payload.motivoDerivacion,
        motivoPaciente: payload.motivoPaciente,
        motivoDerivacion: payload.motivoDerivacion,
        medicoAsignado,
        filiatoriosContacto: {
          direccion: payload.pacienteDireccion,
          email: payload.pacienteEmail,
          telefono: payload.pacienteTelefono
        },
        consanguinidad: {
          estado: payload.consanguinidad || 'no',
          detalle: payload.consanguinidadDetalle || ''
        },
        antecedentesObstetricos: payload.obstetricosDescripcion,
        abuelos: {
          paternos: {
            abuelo: { apellido: payload.abueloPaternoApellido, procedencia: payload.abueloPaternoProcedencia },
            abuela: { apellido: payload.abuelaPaternaApellido, procedencia: payload.abuelaPaternaProcedencia }
          },
          maternos: {
            abuelo: { apellido: payload.abueloMaternoApellido, procedencia: payload.abueloMaternoProcedencia },
            abuela: { apellido: payload.abuelaMaternaApellido, procedencia: payload.abuelaMaternaProcedencia }
          }
        },
        intake: {
          createdAt: nowIso,
          wizardPending: true,
          administrativo: payload,
          ...(ingresoInfo ? { ingreso: ingresoInfo } : {}),
        },
        metadata: metadataExtras,
        createdBy: user?.email || 'sistema'
      });

      const motivoDiagnostico = motivo.detailLabel || motivo.groupLabel || 'Motivo de consulta';
      const notas = [];
      if (payload.motivoPaciente) {
        notas.push({ id: uidLocal(), texto: `Paciente refiere: ${payload.motivoPaciente}`, autor: user?.email || 'registro' });
      }
      if (payload.motivoDerivacion) {
        notas.push({ id: uidLocal(), texto: `Derivación: ${payload.motivoDerivacion}`, autor: user?.email || 'registro' });
      }

      const pacienteNombre = (payload.pacienteNombre || '').trim();
      const pacienteApellido = (payload.pacienteApellido || '').trim();
      const pacienteNombreCompleto = [pacienteNombre, pacienteApellido].filter(Boolean).join(' ');

      const proband = await createMember(family.id, {
        rol: 'Proband',
        filiatorios: { iniciales: 'A1', nombreCompleto: pacienteNombreCompleto || 'Paciente sin nombre' },
        nombre: pacienteNombreCompleto || 'Paciente sin nombre',
        contacto: { email: payload.pacienteEmail, telefono: payload.pacienteTelefono },
        direccion: payload.pacienteDireccion,
        diagnostico: motivoDiagnostico,
        sexo: payload.pacienteSexo || undefined,
        nacimiento: payload.pacienteNacimiento || undefined,
        profesion: payload.pacienteProfesion || undefined,
        obraSocial: payload.pacienteObraSocial || undefined,
        antecedentesPersonales: payload.pacienteAntecedentes || undefined,
        notas
      });

      const resumen = [
        `Motivo: ${motivoDiagnostico}`,
        payload.motivoPaciente ? `Paciente: ${payload.motivoPaciente}` : '',
        payload.motivoDerivacion ? `Derivación: ${payload.motivoDerivacion}` : '',
        medicoAsignado ? `Profesional: ${medicoAsignado}` : ''
      ].filter(Boolean).join(' | ');

      if (proband?.id) {
        await addEvolution(proband.id, resumen || 'Alta administrativa creada', user?.email || 'registro');
      }

      if (appointmentContext?.id) {
        try {
          const existingMetadata = appointmentContext.metadata && typeof appointmentContext.metadata === 'object' && !Array.isArray(appointmentContext.metadata)
            ? { ...appointmentContext.metadata }
            : {};
          const ingresoLabel = appointmentContext.primeraConsulta ? 'Ingreso de 1ra consulta' : 'Ingreso programado';
          const updatedMetadata = {
            ...existingMetadata,
            ingreso: {
              tipo: appointmentContext.primeraConsulta ? 'primera_consulta' : 'agenda',
              label: ingresoLabel,
              estado: 'en_sala',
              appointmentId: appointmentContext.id || null,
              actualizadoEn: nowIso,
              actualizadoPor: user?.email || 'registro',
              familyId: family.id,
              familyCode: code,
            },
            familia: {
              id: family.id,
              code,
              paciente: pacienteNombreCompleto || 'Paciente sin nombre',
            },
          };
          const basePayload = {
            status: 'IN_ROOM',
            metadata: updatedMetadata,
          };
          const payloadWithMember = proband?.id ? { ...basePayload, memberId: proband.id } : basePayload;
          try {
            await cenagemApi.updateAppointment(appointmentContext.id, payloadWithMember);
          } catch (updateError) {
            const message = (updateError?.message || '').toLowerCase();
            if (proband?.id && message.includes('no pertenece a la familia')) {
              await cenagemApi.updateAppointment(appointmentContext.id, basePayload);
            } else {
              throw updateError;
            }
          }
          setAgenda((prev) => prev.map((item) => {
            if (item.id !== appointmentContext.id) return item;
            return {
              ...item,
              familyId: family.id,
              memberId: proband?.id || item.memberId,
              estado: 'En sala',
              metadata: updatedMetadata,
            };
          }));
          try {
            await syncAgenda();
          } catch (syncError) {
            console.warn('No se pudo sincronizar la agenda tras actualizar el turno', syncError);
          }
        } catch (appointmentError) {
          console.error('No se pudo actualizar el turno asociado a la nueva HC', appointmentError);
        }
      }

      await ensureFamilyDetail(family.id, true);

      setShowNewCase(false);
      setPendingAppointmentForNewCase(null);
      console.log('HC creada exitosamente', { familyId: family.id, code, probandId: proband?.id });
      alert(`HC creada correctamente. Código asignado: ${code}`);
    } catch (error) {
      console.error('Error creando la HC', error);
      if (error?.info) {
        console.error('[new-case] Detalle de error API', error.info);
      }
      const friendlyMessage =
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'No se pudo crear la HC. Revisá los datos e intentá nuevamente.';
      setCreateCaseError(friendlyMessage);
    } finally {
      if (logOpened) {
        console.groupEnd();
      }
      setCreatingCase(false);
    }
  };

  const handleCompleteWizard = async (familyId, payload) => {
    if (!familyId) return;
    const family = familiesById[familyId];
    if (!family) return;
    setWizardBusy(true);
    try {
      const familyMembers = membersByFamilyId[familyId] || [];
      const mapping = mapIntakeToFamily({ family, members: familyMembers, payload });

      await updateFamily(familyId, mapping.familyPatch);

      const upsertRelative = async ({ role, initials, data = {}, obstetricos }) => {
        const nombre = (data.nombre || '').trim();
        const apellido = (data.apellido || '').trim();
        const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ');
        if (!nombreCompleto) return;
        const existing =
          familyMembers.find(
            (member) => member.rol === role || member.filiatorios?.iniciales === initials,
          ) || null;
        let contacto = existing?.contacto ? { ...existing.contacto } : {};
        if (data.email && data.email.trim()) contacto.email = data.email;
        if (data.telefono && data.telefono.trim()) contacto.telefono = data.telefono;
        if (!Object.keys(contacto).length) {
          contacto =
            existing?.contacto && Object.keys(existing.contacto).length
              ? existing.contacto
              : undefined;
        }
        const patch = {
          rol: role,
          filiatorios: { ...(existing?.filiatorios || {}), iniciales: initials, nombreCompleto },
          nombre: nombreCompleto,
          nacimiento: data.nacimiento || existing?.nacimiento || undefined,
          profesion: data.profesion || existing?.profesion || undefined,
          obraSocial: data.obraSocial || existing?.obraSocial || undefined,
          antecedentesPersonales: data.antecedentes || existing?.antecedentesPersonales || undefined,
        };
        if (contacto) patch.contacto = contacto;
        if (obstetricos) {
          const prev = existing?.obstetricos || {};
          patch.obstetricos = {
            gestas: obstetricos.gestas ?? prev.gestas,
            partos: obstetricos.partos ?? prev.partos,
            abortos: obstetricos.abortos ?? prev.abortos,
            cesareas: obstetricos.cesareas ?? prev.cesareas,
          };
        }
        if (existing) {
          await updateMember(existing.id, patch);
        } else {
          await createMember(familyId, { ...patch, notas: [] });
        }
      };

      if (mapping.probandId && mapping.probandPatch) {
        await updateMember(mapping.probandId, mapping.probandPatch);
      }

      for (const relative of mapping.relatives) {
        await upsertRelative(relative);
      }

      if (mapping.probandId && mapping.evolutionText) {
        await addEvolution(
          mapping.probandId,
          mapping.evolutionText || 'Historia clínica inicial completada',
          user?.email || 'registro',
        );
      }

      await ensureFamilyDetail(familyId, true);

      setWizardActive(false);
      setWizardFamilyId(null);
      window.location.hash = '#/family/' + familyId;
    } catch (error) {
      console.error('Error completando la HC', error);
      alert('No se pudo guardar la información clínica. Intentá nuevamente.');
    } finally {
      setWizardBusy(false);
    }
  };

  const handleCancelNewCase = () => {
    setCreateCaseError(null);
    setPendingAppointmentForNewCase(null);
    setShowNewCase(false);
  };
  return (
    <div className="app-shell p-6 grid gap-4">
      
      <HomeHeader
        onLogout={onLogout}
        user={user}
        title="CENAGEM · HC Familiar"
      />

      {canViewUsers && (
        <section className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Administración de usuarios</h2>
            <p className="text-xs text-white/70">{userAdminDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => { window.location.hash = '#/users'; }}
            className="px-4 py-2 rounded-xl border border-white/40 text-sm font-medium text-white hover:bg-white/10 transition self-start sm:self-auto"
          >
            Abrir panel
          </button>
        </section>
      )}

      <CaseAccessPanel
        onCreateCase={() => {
          setCreateCaseError(null);
          setPendingAppointmentForNewCase(null);
          setShowNewCase(true);
        }}
        onOpenAnalytics={() => { window.location.hash = 'analytics'; }}
        familyCodeValue={familyCodeInput}
        onFamilyCodeChange={handleFamilyCodeInputChange}
        onSubmitFamilyCode={handleGoToFamilyByCode}
        feedbackMessage={familyCodeFeedback}
        searchResults={familySearchResults}
        searchLoading={familySearchBusy}
        onSelectSearchResult={handleSelectFamilyFromSearch}
      />

      <TodayAgenda
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        service={service}
        onServiceChange={setService}
        appointments={agendaForSelectedDate}
        allAppointments={agenda}
        membersOptions={agendaMembersOptions}
        membersById={membersById}
        familiesById={familiesById}
        onCreateAppointment={handleCreateAppointment}
        onStatusChange={handleStatusChange}
        onRemoveAppointment={handleRemoveAppointment}
        onOpenFamily={handleOpenFamily}
        onCreateFamilyCase={handleCreateFamilyCaseFromAppointment}
        availableSlots={nextAvailableSlots}
        onEnsureFamilyDetail={(familyId) => ensureFamilyDetail(familyId, true)}
      />
      <WeeklyAgendaBoard
        agenda={agenda}
        membersById={membersById}
        familiesById={familiesById}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        service={service}
      />

{showNewCase && (
  <div className="fixed inset-0 z-40 overflow-auto bg-white">
    <NewCaseCreate
      currentUser={{ name: user?.displayName || user?.email }}
      onCreate={handleCreateCase}
      onCancel={handleCancelNewCase}
      errorMessage={createCaseError || ''}
      onDismissError={() => setCreateCaseError(null)}
      busy={creatingCase}
      nextAgNumber={nextAgNumber}
    />
  </div>
)}

{wizardFamily && (
  <div className="fixed inset-0 z-50 overflow-auto bg-white">
    {wizardActive ? (
      <NewCaseWizard
        key={`wizard-${wizardFamilyId}`}
        currentUser={{ name: user?.displayName || user?.email }}
        busy={wizardBusy}
        onSubmit={(payload) => handleCompleteWizard(wizardFamilyId, payload)}
        onCancel={handleCancelWizard}
        initialData={wizardInitialData || {}}
        initialStep={2}
        showAdministrativeStep={false}
      />
    ) : (
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl grid gap-4 text-center">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Ingresar a HC por primera vez</h2>
            <p className="text-sm text-slate-600">Esta historia clínica solo tiene los datos administrativos. Completá el asistente clínico para finalizar el ingreso.</p>
          </div>
          {wizardPatientName && (
            <div className="text-sm font-medium text-slate-700">Paciente: {wizardPatientName}</div>
          )}
          {!wizardReady && (
            <div className="text-xs text-slate-500">Preparando datos administrativos...</div>
          )}
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleCancelWizard}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={startWizardForFamily}
              disabled={!wizardReady}
              className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
            >
              Ingresar a HC por primera vez
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

      <MetricsBoard metrics={metrics} />

      {showAnalyticsButton && (
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center">
          <button
            onClick={() => { window.location.hash = 'analytics'; }}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm !text-white"
          >
            📊 Análisis de datos
          </button>
        </div>
      )}

      <FooterBar onAnalytics={() => { window.location.hash = 'analytics'; }} />
    </div>
  );
}





























