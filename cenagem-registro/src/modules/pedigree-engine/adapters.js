// Utilidades de adaptación entre el modelo legacy (HC sandbox) y el motor NSGC.

export function membersToIndividuals(members = []) {
  return members.map((member) => {
    const bornYear = member.nacimiento ? new Date(member.nacimiento).getFullYear() : null;
    const deathYear =
      member.fallecimiento?.year ||
      (member.defuncion ? new Date(member.defuncion).getFullYear() : null) ||
      null;
    const notas = Array.isArray(member.notas)
      ? member.notas.map((note) => note?.texto || '').filter(Boolean).join(' · ')
      : typeof member.notas === 'string'
        ? member.notas
        : '';
    const dx = [];
    if (member.diagnostico) dx.push(member.diagnostico);
    if (Array.isArray(member.diagnosticos)) {
      member.diagnosticos.forEach((item) => {
        if (typeof item === 'string') dx.push(item);
        else if (item?.texto) dx.push(item.texto);
      });
    }
    const affectedValue = member.afectado === true || member.estadoClinico === 'afectado';
    const carrierType =
      member.portador && ['AR', 'X'].includes(member.portador) ? member.portador : 'none';

    let deathNote = null;
    if (member.estado === 'fallecido') {
      if (member.edadTexto) deathNote = `d. ${member.edadTexto}`;
      else if (deathYear) deathNote = `d. ${deathYear}`;
    }

    return {
      id: member.id,
      label: member.nombre || member.filiatorios?.iniciales || member.id,
      nombre: member.nombre || '',
      rol: member.rol || '',
      sex: member.sexo === 'M' ? 'M' : member.sexo === 'F' ? 'F' : 'U',
      bornYear,
      age: typeof member.edadCalculada === 'number' ? member.edadCalculada : null,
      dead: member.estado === 'fallecido',
      deadInfo: { year: deathYear, note: deathNote },
      affected: { value: affectedValue, dx },
      carrier: { type: carrierType, evidence: member.portadorEvidencia || 'unknown' },
      evaluations: Array.isArray(member.evaluaciones)
        ? member.evaluaciones.map((ev, index) => ({
            code: ev.code || `E${index + 1}`,
            desc: ev.desc || '',
            result: ev.result || '',
          }))
        : [],
      notes: notas,
      ancestry: {
        maternal: member.ancestry?.maternal || null,
        paternal: member.ancestry?.paternal || null,
      },
      filiatorios: member.filiatorios || {},
    };
  });
}

export function pedigreeToRelationships(pedigree = {}) {
  return Object.entries(pedigree).map(([childId, node]) => ({
    type: 'parentChild',
    father: node.padreId || null,
    mother: node.madreId || null,
    child: childId,
    biological: node.biological !== false,
    gestational: node.gestational === true,
    adoptive: node.biological === false || node.adoptive === true,
  }));
}
