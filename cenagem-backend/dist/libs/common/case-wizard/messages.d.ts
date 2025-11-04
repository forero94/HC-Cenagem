export declare const CASE_WIZARD_MESSAGES: {
    readonly agNumber: "Asigná un número de HC/AG";
    readonly pacienteNombre: "Ingresá el nombre del paciente";
    readonly pacienteDni: "Completá el DNI";
    readonly motivoGroup: "Seleccioná el grupo del motivo de consulta";
    readonly motivoDetail: "Elegí el motivo puntual dentro del grupo";
    readonly motivoPaciente: "Escribí el relato del paciente para orientar la consulta";
    readonly enfInicioContexto: "Describí el inicio y contexto del cuadro clínico";
    readonly enfEvolucionActual: "Contá la evolución reciente del cuadro";
    readonly enfManifestacionesClaves: "Detallá las manifestaciones principales del cuadro";
    readonly consultaFecha: "Indicá la fecha de la consulta";
};
export type CaseWizardMessageKey = keyof typeof CASE_WIZARD_MESSAGES;
export declare const getCaseWizardMessage: (key: CaseWizardMessageKey) => "Asigná un número de HC/AG" | "Ingresá el nombre del paciente" | "Completá el DNI" | "Seleccioná el grupo del motivo de consulta" | "Elegí el motivo puntual dentro del grupo" | "Escribí el relato del paciente para orientar la consulta" | "Describí el inicio y contexto del cuadro clínico" | "Contá la evolución reciente del cuadro" | "Detallá las manifestaciones principales del cuadro" | "Indicá la fecha de la consulta";
