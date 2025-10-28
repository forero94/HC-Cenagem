export const GROUP_GUIDES = {
  di_rm: {
    sections: [
      {
        id: 'di_rm-specific',
        title: "Detalles específicos — Déficit intelectual / retraso madurativo",
        description: "Complementá con estudios neurológicos y apoyos terapéuticos relevantes para el abordaje integral del paciente.",
        groups: [
          {
            id: 'di_rm-neuro',
            columns: 3,
            fields: [
              {
                component: 'textarea',
                name: 'ndEEG',
                label: 'EEG',
                placeholder: 'Fecha, motivo, hallazgos relevantes',
              },
              {
                component: 'textarea',
                name: 'ndRMN',
                label: 'RMN / neuroimágenes',
                placeholder: 'Malformaciones, lesiones estructurales, seguimiento',
              },
              {
                component: 'textarea',
                name: 'ndEstudiosOtros',
                label: 'Otros estudios neurológicos',
                placeholder: 'Potenciales evocados, metabolismo cerebral, estudios genéticos dirigidos',
              },
            ],
          },
          {
            id: 'di_rm-apoyos',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'ndInterconsultas',
                label: 'Interconsultas / evaluaciones',
                placeholder: 'Neurología, psicopedagogía, fonoaudiología, terapia ocupacional…',
              },
              {
                component: 'textarea',
                name: 'ndApoyos',
                label: 'Apoyos y tratamientos en curso',
                placeholder: 'Medicaciones, terapias, acompañamiento escolar, apoyos comunitarios',
              },
            ],
          },
        ],
      },
    ],
  },
  talla: {
    sections: [
      {
        id: 'talla-datos-iniciales',
        title: '1. Datos iniciales',
        description: 'Organizá los datos clínicos clave del paciente con talla baja.',
        groups: [
          {
            id: 'talla-motivo-consulta',
            fields: [
              {
                component: 'checkbox-group',
                name: 'tallaMotivoConsulta',
                label: 'Motivo de consulta',
                optionsWrapperClass: 'grid gap-2 sm:grid-cols-2',
                options: [
                  { value: 'aislada', label: 'Talla baja aislada' },
                  { value: 'dismorfias', label: 'Talla baja + dismorfias' },
                  { value: 'retraso-crecimiento', label: 'Retraso del crecimiento' },
                  { value: 'sindrome', label: 'Sospecha de síndrome genético' },
                ],
              },
            ],
          },
          {
            id: 'talla-antropometria',
            columns: 2,
            fields: [
              {
                component: 'input',
                name: 'tallaTallaCm',
                label: 'Talla (cm)',
                placeholder: 'Ej. 120',
                inputType: 'text',
              },
              {
                component: 'input',
                name: 'tallaTallaDE',
                label: 'DE talla',
                placeholder: 'Ej. -2.3',
                inputType: 'text',
              },
              {
                component: 'input',
                name: 'tallaPesoKg',
                label: 'Peso (kg)',
                placeholder: 'Ej. 24',
                inputType: 'text',
              },
              {
                component: 'input',
                name: 'tallaImc',
                label: 'IMC',
                placeholder: 'Ej. 15.8',
                inputType: 'text',
              },
              {
                component: 'input',
                name: 'tallaVelocidadCrecimiento',
                label: 'Velocidad de crecimiento anual (cm/año)',
                placeholder: 'Ej. 4.5',
                inputType: 'text',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'input',
                name: 'tallaTallaDiana',
                label: 'Talla diana familiar (cm)',
                placeholder: 'Ej. 165',
                inputType: 'text',
                colSpan: 'md:col-span-2',
              },
            ],
          },
          {
            id: 'talla-edad-osea',
            columns: 2,
            fields: [
              {
                component: 'input',
                name: 'tallaEdadOsea',
                label: 'Edad ósea (años)',
                placeholder: 'Ej. 8.5',
                inputType: 'text',
              },
              {
                component: 'radio-group',
                name: 'tallaDiscrepanciaEdadOsea',
                label: 'Discrepancia edad ósea / cronológica',
                optionsWrapperClass: 'grid gap-2 sm:grid-cols-3',
                options: [
                  { value: 'normal', label: 'Normal' },
                  { value: 'retrasada', label: 'Retrasada' },
                  { value: 'adelantada', label: 'Adelantada' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'talla-evaluacion-clinica',
        title: '2. Evaluación clínica inicial',
        description: 'Seleccioná antecedentes y hallazgos clínicos relevantes.',
        groups: [
          {
            id: 'talla-antecedentes',
            fields: [
              {
                component: 'checkbox-group',
                name: 'tallaAntecedentes',
                label: 'Antecedentes relevantes',
                optionsWrapperClass: 'grid gap-2 sm:grid-cols-2',
                options: [
                  { value: 'rciu-prematuridad', label: 'RCIU / prematuridad' },
                  { value: 'enfermedad-cronica', label: 'Enfermedad crónica (digestiva, renal, cardiaca, etc.)' },
                  { value: 'medicacion-prolongada', label: 'Medicacion prolongada (corticoides, anticonvulsivantes)' },
                  { value: 'alteraciones-pubertad', label: 'Retraso puberal / pubertad precoz' },
                  { value: 'consanguinidad', label: 'Consanguinidad' },
                  { value: 'historia-familiar', label: 'Historia familiar de talla baja' },
                ],
              },
            ],
          },
          {
            id: 'talla-examen-fisico',
            fields: [
              {
                component: 'checkbox-group',
                name: 'tallaExamenFisico',
                label: 'Examen físico',
                optionsWrapperClass: 'grid gap-2 sm:grid-cols-2',
                options: [
                  { value: 'proporciones-normales', label: 'Proporciones normales' },
                  { value: 'desproporcion', label: 'Desproporción (tronco corto / extremidades cortas)' },
                  { value: 'rasgos-dismorficos', label: 'Rasgos dismórficos' },
                  { value: 'malformaciones', label: 'Malformaciones / disfunción orgánica' },
                  { value: 'alteraciones-genitales', label: 'Alteraciones genitales' },
                ],
              },
            ],
          },
          {
            id: 'talla-clasificacion',
            fields: [
              {
                component: 'radio-group',
                name: 'tallaClasificacionMorfologica',
                label: 'Clasificación morfológica',
                optionsWrapperClass: 'grid gap-2 sm:grid-cols-2',
                options: [
                  { value: 'proporcionada', label: 'Talla baja proporcionada' },
                  { value: 'desproporcionada', label: 'Talla baja desproporcionada' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  dismorfias: {
    sections: [
      {
        id: 'dismorfias-plan',
        title: "Malformaciones congénitas y dismorfias",
        description: "Describí los hallazgos principales y los estudios ya realizados.",
        groups: [
          {
            id: 'dismorfias-descripcion',
            fields: [
              {
                component: 'textarea',
                name: 'dismorfiasDescripcion',
                label: 'Descripción clínica resumida',
                placeholder: 'Fenotipo general, malformaciones mayores y menores',
              },
            ],
          },
          {
            id: 'dismorfias-sistemas',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'dismorfiasSistemasAfectados',
                label: 'Órganos / sistemas afectados',
                placeholder: 'Cardiovascular, SNC, genitourinario, esquelético…',
              },
              {
                component: 'textarea',
                name: 'dismorfiasImagenes',
                label: 'Imágenes / screening',
                placeholder: 'Eco, RMN, RX, estudios funcionales',
              },
            ],
          },
          {
            id: 'dismorfias-genetica',
            fields: [
              {
                component: 'textarea',
                name: 'dismorfiasEstudiosGeneticos',
                label: 'Estudios genéticos previos',
                placeholder: 'Cariotipo, array-CGH, MLPA, paneles, FISH',
              },
            ],
          },
        ],
      },
    ],
  },
  fertilidad: {
    sections: [
      {
        id: 'fertilidad-plan',
        title: "Fertilidad / asesoría preconcepcional",
        description: "Documentá diagnósticos previos y enfoque reproductivo.",
        groups: [
          {
            id: 'fertilidad-diagnostico',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'reproDiagnosticos',
                label: 'Diagnósticos o hallazgos clave',
                placeholder: 'Amenorrea, azoospermia, fallas implantatorias, alteraciones cromosómicas',
              },
              {
                component: 'textarea',
                name: 'reproTratamientos',
                label: 'Tratamientos intentados',
                placeholder: 'Estimulación ovárica, FIV, inseminaciones, medicamentos',
              },
            ],
          },
          {
            id: 'fertilidad-estudios',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'reproEstudiosPrevios',
                label: 'Estudios genéticos / de portadores',
                placeholder: 'Cariotipo, paneles, CFTR, X frágil, Y microdeleciones',
              },
              {
                component: 'textarea',
                name: 'reproPlan',
                label: 'Plan o próximas acciones',
                placeholder: 'Nuevos estudios, derivaciones, recomendación reproductiva',
              },
            ],
          },
        ],
      },
    ],
  },
  onco: {
    sections: [
      {
        id: 'onco-plan',
        title: "Predisposición oncológica",
        description: "Profundizá en el árbol familiar y los estudios disponibles.",
        groups: [
          {
            id: 'onco-historia',
            fields: [
              {
                component: 'textarea',
                name: 'oncoArbolFamiliar',
                label: 'Historia familiar detallada',
                placeholder: 'Ginealograma, edades al diagnóstico, parentescos',
              },
            ],
          },
          {
            id: 'onco-analisis',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'oncoRiesgoModelos',
                label: 'Modelos de riesgo / criterios',
                placeholder: 'BOADICEA, NCCN, Amsterdam, PREMM, otros',
              },
              {
                component: 'textarea',
                name: 'oncoEstudiosDisponibles',
                label: 'Estudios genéticos disponibles',
                placeholder: 'Paneles multigén, BRCA1/2, MMR, TP53, etc.',
              },
            ],
          },
          {
            id: 'onco-seguimiento',
            fields: [
              {
                component: 'textarea',
                name: 'oncoPlanSeguimiento',
                label: 'Plan de seguimiento / recomendaciones',
                placeholder: 'Tamizajes, derivaciones, indicaciones para familiares',
              },
            ],
          },
        ],
      },
    ],
  },
  monogenica: {
    sections: [
      {
        id: 'monogenica-plan',
        title: "Plan para sospecha monogénica",
        description: "Revisá la información clínica cargada en el paso previo y definí el abordaje complementario.",
        groups: [
          {
            id: 'monogenica-tratamiento',
            fields: [
              {
                component: 'textarea',
                name: 'monoTratamiento',
                label: 'Tratamiento / respuesta observada',
                placeholder: 'Dietas, suplementos, terapias específicas, respuesta clínica',
              },
            ],
          },
          {
            id: 'monogenica-plan-estudios',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'monoPlanEstudios',
                label: 'Plan de estudios propuesto',
                placeholder: 'Secuenciación, validaciones, estudios familiares',
              },
              {
                component: 'textarea',
                name: 'monoNotas',
                label: 'Notas adicionales',
                placeholder: 'Documentación pendiente, derivaciones, alertas',
              },
            ],
          },
        ],
      },
    ],
  },
  otros: {
    sections: [
      {
        id: 'otros-plan',
        title: "Otros motivos",
        description: "Usá este espacio para registrar motivos no contemplados en los grupos principales.",
        groups: [
          {
            id: 'otros-registro',
            fields: [
              {
                component: 'textarea',
                name: 'otrosMotivo',
                label: 'Descripción del caso',
                placeholder: 'Resumen clínico y hallazgos clave',
              },
              {
                component: 'textarea',
                name: 'otrosEstudios',
                label: 'Estudios realizados',
                placeholder: 'Laboratorio, imágenes, genética, otras especialidades',
              },
              {
                component: 'textarea',
                name: 'otrosPlan',
                label: 'Plan / próximos pasos',
                placeholder: 'Derivaciones, seguimiento, consultas pendientes',
              },
            ],
          },
        ],
      },
    ],
  },
  prenatal: {
    sections: [
      {
        id: 'prenatal-identificacion',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '1. Datos de identificación',
        groups: [
          {
            id: 'prenatal-identificacion-datos',
            columns: 2,
            fields: [
              {
                component: 'input',
                name: 'identificacionNombre',
                label: 'Nombre completo',
                placeholder: 'Nombre y apellido',
              },
              {
                component: 'input',
                name: 'identificacionEdad',
                label: 'Edad',
                placeholder: 'Años cumplidos',
              },
              {
                component: 'input',
                name: 'identificacionDni',
                label: 'Documento / DNI',
                placeholder: 'Número de documento',
              },
              {
                component: 'input',
                name: 'identificacionCobertura',
                label: 'Cobertura',
                placeholder: 'Obra social, prepaga, sin cobertura',
              },
              {
                component: 'textarea',
                name: 'identificacionDomicilio',
                label: 'Domicilio',
                placeholder: 'Calle, número, localidad',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'input',
                inputType: 'date',
                name: 'identificacionFechaConsulta',
                label: 'Fecha de consulta',
              },
              {
                component: 'input',
                inputType: 'date',
                name: 'identificacionFum',
                label: 'FUM (fecha de última menstruación)',
              },
              {
                component: 'input',
                name: 'identificacionEdadGestacional',
                label: 'Edad gestacional actual',
                placeholder: 'Semanas + días',
              },
              {
                component: 'input',
                name: 'identificacionMetodoCalculo',
                label: 'Método de cálculo',
                placeholder: 'FUM, ecografía, FIV, etc.',
              },
              {
                component: 'textarea',
                name: 'identificacionMotivoConsulta',
                label: 'Motivo de consulta',
                placeholder: 'Control rutinario, antecedentes familiares, cribado positivo, ecografía alterada, etc.',
                colSpan: 'md:col-span-2',
              },
            ],
          },
        ],
      },
      {
        id: 'prenatal-antecedentes-personales',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '2. Antecedentes personales de la gestante',
        groups: [
          {
            id: 'prenatal-medicos',
            heading: 'a. Médicos generales',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'antecedentesMedicosCronicos',
                label: 'Enfermedades crónicas',
                placeholder: 'Diabetes, hipertensión, epilepsia, asma, autoinmunes',
              },
              {
                component: 'textarea',
                name: 'antecedentesCirugias',
                label: 'Cirugías / transfusiones / hospitalizaciones',
                placeholder: 'Detalle procedimientos previos relevantes',
              },
              {
                component: 'textarea',
                name: 'antecedentesMedicaciones',
                label: 'Medicación actual y durante el embarazo',
                placeholder: 'Nombre, dosis y trimestre de uso',
              },
              {
                component: 'textarea',
                name: 'antecedentesConsumo',
                label: 'Consumo de tabaco, alcohol o drogas',
                placeholder: 'Frecuencia, tipo de sustancia, exposición laboral o tóxicos',
              },
              {
                component: 'textarea',
                name: 'antecedentesVacunas',
                label: 'Vacunas aplicadas',
                placeholder: 'Rubéola, hepatitis, COVID, gripe, otras',
                colSpan: 'md:col-span-2',
              },
            ],
          },
          {
            id: 'prenatal-gineco',
            heading: 'b. Gineco-obstétricos',
            columns: 2,
            fields: [
              {
                component: 'input',
                name: 'antecedentesMenarca',
                label: 'Edad de menarca y ciclos',
                placeholder: 'Menarca, regularidad menstrual',
              },
              {
                component: 'textarea',
                name: 'antecedentesMetodoAnticonceptivo',
                label: 'Métodos anticonceptivos previos',
                placeholder: 'Tipos usados y tiempo hasta concepción',
              },
              {
                component: 'textarea',
                name: 'antecedentesHistoriaObstetrica',
                label: 'Historia obstétrica (G P A C)',
                placeholder: 'Detalle de gestas, partos, abortos, cesáreas',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'antecedentesComplicacionesPrevias',
                label: 'Complicaciones obstétricas previas',
                placeholder: 'Preeclampsia, parto pretérmino, óbito, RCIU, malformaciones',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'antecedentesAbortos',
                label: 'Abortos espontáneos o inducidos',
                placeholder: 'Cantidad, edad gestacional y estudios realizados',
                colSpan: 'md:col-span-2',
              },
            ],
          },
          {
            id: 'prenatal-personales',
            heading: 'c. Familiares personales relevantes',
            columns: 2,
            fields: [
              {
                component: 'input',
                name: 'antecedentesConsanguinidad',
                label: 'Consanguinidad con la pareja',
                placeholder: 'Parentesco y origen común',
              },
              {
                component: 'input',
                name: 'antecedentesEtnia',
                label: 'Etnia u origen geográfico',
                placeholder: 'Riesgos específicos según origen',
              },
            ],
          },
        ],
      },
      {
        id: 'prenatal-antecedentes-familiares',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '3. Antecedentes familiares',
        groups: [
          {
            id: 'prenatal-familia',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'familiaHistoriaGenetica',
                label: 'Historia genética y hereditaria',
                placeholder: 'Malformaciones, discapacidad intelectual, autismo, metabolopatías, cardiopatías, muertes neonatales',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'familiaAbortosRecurrentes',
                label: 'Abortos recurrentes en la familia',
                placeholder: 'Líneas afectadas y relación con la paciente',
              },
              {
                component: 'textarea',
                name: 'familiaPortadores',
                label: 'Portadores conocidos',
                placeholder: 'Translocaciones, aneuploidías, síndromes genéticos, enfermedades monogénicas',
              },
              {
                component: 'textarea',
                name: 'familiaCancer',
                label: 'Cáncer familiar',
                placeholder: 'Cáncer temprano o agrupado por tipo, relación con la familia',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'familiaArbolGenealogico',
                label: 'Árbol genealógico',
                placeholder: 'Pedigrí de tres generaciones, incluir abortos, fallecidos y consanguinidad',
                colSpan: 'md:col-span-2',
              },
            ],
          },
        ],
      },
      {
        id: 'prenatal-pareja',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '4. Antecedentes del padre / pareja',
        groups: [
          {
            id: 'prenatal-pareja-datos',
            columns: 2,
            fields: [
              {
                component: 'input',
                name: 'parejaEdad',
                label: 'Edad',
                placeholder: 'Años cumplidos',
              },
              {
                component: 'textarea',
                name: 'parejaOcupacion',
                label: 'Ocupación y exposiciones',
                placeholder: 'Exposición laboral a tóxicos o radiaciones',
              },
              {
                component: 'textarea',
                name: 'parejaAntecedentesMedicos',
                label: 'Antecedentes médicos relevantes',
                placeholder: 'Genéticos, hematológicos, neurológicos, psiquiátricos',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'parejaConsumo',
                label: 'Consumo de tabaco, alcohol o drogas',
                placeholder: 'Frecuencia y tipo de sustancia',
              },
              {
                component: 'textarea',
                name: 'parejaHistoriaFamiliar',
                label: 'Historia familiar del padre / pareja',
                placeholder: 'Antecedentes genéticos o enfermedades relevantes en su familia',
                colSpan: 'md:col-span-2',
              },
            ],
          },
        ],
      },
      {
        id: 'prenatal-embarazo-actual',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '5. Evolución del embarazo actual',
        groups: [
          {
            id: 'prenatal-embarazo',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'embarazoControlPrenatal',
                label: 'Semana de diagnóstico y tipo de control',
                placeholder: 'Semana de confirmación, controles realizados',
              },
              {
                component: 'textarea',
                name: 'embarazoSuplementacion',
                label: 'Suplementación',
                placeholder: 'Ácido fólico, yodo, vitaminas u otros',
              },
              {
                component: 'textarea',
                name: 'embarazoInfecciones',
                label: 'Infecciones o enfermedades intercurrentes',
                placeholder: 'TORCH, ITS, COVID, gripe u otras',
              },
              {
                component: 'textarea',
                name: 'embarazoEventos',
                label: 'Eventos durante el embarazo',
                placeholder: 'Sangrados, fiebre, exposición a fármacos o radiaciones',
              },
              {
                component: 'textarea',
                name: 'embarazoPesoTension',
                label: 'Peso materno y tensión arterial',
                placeholder: 'Peso inicial y actual, TA en controles',
              },
              {
                component: 'textarea',
                name: 'embarazoMovimientos',
                label: 'Movimientos fetales y contracciones',
                placeholder: 'Percepción de movimientos, dinámica uterina',
              },
              {
                component: 'textarea',
                name: 'embarazoLaboratorios',
                label: 'Resultados de laboratorios y serologías',
                placeholder: 'Glucemia, VDRL, VIH, HBsAg, grupo y factor, otros',
                colSpan: 'md:col-span-2',
              },
            ],
          },
        ],
      },
      {
        id: 'prenatal-estudios',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '6. Estudios prenatales realizados',
        groups: [
          {
            id: 'prenatal-eco',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'estudiosEcoPrimerTrimestre',
                label: 'Ecografía 1º trimestre',
                placeholder: 'Traslucencia nucal, CRL, hueso nasal',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'estudiosEcoSegundoTrimestre',
                label: 'Ecografía 2º trimestre / morfológica',
                placeholder: 'Hallazgos estructurales y marcadores blandos',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'estudiosEcoDoppler',
                label: 'Doppler o ecografía de crecimiento',
                placeholder: 'Estimación de peso, flujos uterinos y umbilicales',
                colSpan: 'md:col-span-2',
              },
            ],
          },
          {
            id: 'prenatal-screening',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'estudiosScreening',
                label: 'Screening genético / bioquímico',
                placeholder: 'Test combinado, cuádruple marcador, NIPT (DNA fetal libre)',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'estudiosScreeningResultados',
                label: 'Resultados y seguimiento',
                placeholder: 'Riesgo estimado, recomendaciones y controles posteriores',
                colSpan: 'md:col-span-2',
              },
            ],
          },
          {
            id: 'prenatal-invasivos',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'estudiosInvasivos',
                label: 'Estudios invasivos',
                placeholder: 'CVS, amniocentesis, cordocentesis: indicación, semana y resultados',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'estudiosInvasivosHallazgos',
                label: 'Hallazgos diagnósticos',
                placeholder: 'Aneuploidías, deleciones, microarrays, secuenciación, etc.',
                colSpan: 'md:col-span-2',
              },
            ],
          },
        ],
      },
      {
        id: 'prenatal-psicosocial',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '7. Contexto psicosocial',
        groups: [
          {
            id: 'prenatal-psico',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'psicosocialEducacion',
                label: 'Nivel educativo y comprensión',
                placeholder: 'Capacidad de comprensión de los estudios y la consejería',
              },
              {
                component: 'textarea',
                name: 'psicosocialApoyo',
                label: 'Apoyo familiar y de la pareja',
                placeholder: 'Red de apoyo disponible',
              },
              {
                component: 'textarea',
                name: 'psicosocialDeseo',
                label: 'Deseo reproductivo y decisiones',
                placeholder: 'Actitud frente a resultados anormales, preferencias de manejo',
              },
              {
                component: 'textarea',
                name: 'psicosocialSituacion',
                label: 'Situación económica y habitacional',
                placeholder: 'Recursos disponibles, condiciones del hogar',
              },
              {
                component: 'textarea',
                name: 'psicosocialViolencia',
                label: 'Antecedentes de violencia o estrés significativo',
                placeholder: 'Situaciones de violencia, estrés laboral o social',
                colSpan: 'md:col-span-2',
              },
            ],
          },
        ],
      },
      {
        id: 'prenatal-sintesis',
        wrapper: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        title: '8. Síntesis y plan',
        groups: [
          {
            id: 'prenatal-sintesis-grupo',
            columns: 2,
            fields: [
              {
                component: 'textarea',
                name: 'sintesisResumen',
                label: 'Resumen de riesgos maternos, fetales y genéticos',
                placeholder: 'Síntesis de hallazgos relevantes',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'select',
                name: 'sintesisClasificacion',
                label: 'Clasificación de riesgo',
                options: [
                  { value: '', label: 'Seleccionar' },
                  { value: 'bajo', label: 'Bajo' },
                  { value: 'intermedio', label: 'Intermedio' },
                  { value: 'alto', label: 'Alto' },
                ],
              },
              {
                component: 'textarea',
                name: 'sintesisPlanAccion',
                label: 'Plan de acción',
                placeholder: 'Estudios pendientes, interconsultas, derivaciones, seguimiento',
                colSpan: 'md:col-span-2',
              },
              {
                component: 'textarea',
                name: 'sintesisRegistro',
                label: 'Registro y consentimiento informado',
                placeholder: 'Detalle de registros en historia clínica y consentimientos obtenidos',
                colSpan: 'md:col-span-2',
              },
            ],
          },
        ],
      },
    ],
  },
};
