"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCaseWizardMessage = exports.CASE_WIZARD_MESSAGES = void 0;
exports.CASE_WIZARD_MESSAGES = {
    agNumber: 'Asigná un número de HC/AG',
    pacienteNombre: 'Ingresá el nombre del paciente',
    pacienteDni: 'Completá el DNI',
    motivoGroup: 'Seleccioná el grupo del motivo de consulta',
    motivoDetail: 'Elegí el motivo puntual dentro del grupo',
    motivoPaciente: 'Escribí el relato del paciente para orientar la consulta',
    enfInicioContexto: 'Describí el inicio y contexto del cuadro clínico',
    enfEvolucionActual: 'Contá la evolución reciente del cuadro',
    enfManifestacionesClaves: 'Detallá las manifestaciones principales del cuadro',
    consultaFecha: 'Indicá la fecha de la consulta',
};
const getCaseWizardMessage = (key) => exports.CASE_WIZARD_MESSAGES[key];
exports.getCaseWizardMessage = getCaseWizardMessage;
//# sourceMappingURL=messages.js.map