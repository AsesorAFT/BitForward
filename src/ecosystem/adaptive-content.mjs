import { missions } from './data.mjs';

// Reviewed against the sources linked from each existing mission. No live market assumptions.
export const ADAPTIVE_VERSION = 'atf-concepts-2026-09-v1';
export const concepts = [
  {
    id: 'fundamentos',
    missionId: '001',
    label: 'Red, activo y precio',
    requires: [],
    room: 'Fundamentos',
  },
  {
    id: 'custodia',
    missionId: '003',
    label: 'Claves y permisos',
    requires: ['fundamentos'],
    room: 'Seguridad',
  },
  {
    id: 'bitcoin',
    missionId: '004',
    label: 'Bitcoin y confirmaciones',
    requires: ['fundamentos', 'custodia'],
    room: 'Bitcoin',
  },
  {
    id: 'ethereum',
    missionId: '002',
    label: 'Gas en Ethereum',
    requires: ['fundamentos'],
    room: 'Ethereum',
  },
  {
    id: 'stablecoins',
    missionId: '005',
    label: 'Emisor, red y paridad',
    requires: ['fundamentos', 'custodia'],
    room: 'Stablecoins',
  },
  {
    id: 'cardano',
    missionId: '006',
    label: 'Delegación y custodia',
    requires: ['custodia'],
    room: 'Cardano',
  },
  {
    id: 'exposicion',
    missionId: '007',
    label: 'Exposición y escenarios',
    requires: ['fundamentos', 'stablecoins'],
    room: 'Riesgo',
  },
  {
    id: 'evidencia',
    missionId: '008',
    label: 'Evidencia e hipótesis',
    requires: ['fundamentos'],
    room: 'Análisis',
  },
  {
    id: 'revision',
    missionId: '009',
    label: 'Revisar una conclusión',
    requires: ['evidencia'],
    room: 'Bitácora',
  },
];
const exercises = {
  fundamentos: [
    [
      'Una red procesa más operaciones. ¿Qué puedes concluir sólo con ese dato?',
      [
        'Su activo necesariamente subirá.',
        'Hay más actividad; falta estudiar su significado y relación con el activo.',
        'Todos los participantes obtienen ganancias.',
      ],
      1,
      'Actividad de una red y precio del activo son dimensiones distintas. Hace falta evidencia para relacionarlas.',
      'Separa el dato observado de una predicción de precio.',
    ],
    [
      'Un informe mezcla «Ethereum», «ETH» y «3,000 USD por ETH». ¿Cómo los organizarías?',
      [
        'Tres nombres para la misma cosa.',
        'Precio, red y activo.',
        'Red, activo nativo y precio de referencia.',
      ],
      2,
      'Ethereum es la red, ETH su activo nativo y la cifra es un precio de referencia del ejemplo.',
      'Identifica qué es infraestructura, qué se transfiere y qué se cotiza.',
    ],
    [
      'Una aplicación útil usa una red, pero su token no es necesario para usarla. ¿Qué falta en una tesis sobre ese token?',
      [
        'Explicar su función y de dónde podría venir su demanda.',
        'Añadir un objetivo de precio más alto.',
        'Contar sus seguidores.',
      ],
      0,
      'La utilidad de una aplicación no demuestra por sí sola la función o demanda de un token.',
      'Busca la relación entre el producto y el activo.',
    ],
  ],
  custodia: [
    [
      'Alguien que dice ser soporte pide tus palabras de recuperación para ayudarte. ¿Qué haces?',
      [
        'Enviar sólo la mitad.',
        'Compartirlas si el logo es correcto.',
        'No compartirlas y verificar el canal oficial por otra vía.',
      ],
      2,
      'Las palabras de recuperación permiten restaurar el acceso. No se comparten con soporte ni se introducen en este campus.',
      'Piensa en lo que permite hacer una frase de recuperación.',
    ],
    [
      'Una web conocida te pide firmar un permiso que no comprendes. ¿Cuál es el siguiente paso?',
      [
        'Firmar: ya has usado esa web.',
        'Detenerte y revisar dominio, red y alcance del permiso.',
        'Aumentar el importe para probar.',
      ],
      1,
      'Una firma puede conceder permisos. El nombre o aspecto de una web no sustituyen revisar qué autorizas.',
      'Reconocer la interfaz no explica el contenido de una autorización.',
    ],
    [
      'Tienes el saldo visible en una app, pero el proveedor controla las claves. ¿Qué describes?',
      [
        'Un servicio de custodia con dependencia del proveedor.',
        'Autocustodia sólo por tener una contraseña.',
        'Ausencia de riesgo de contraparte.',
      ],
      0,
      'Ver un saldo y acceder con contraseña no significa controlar las claves. Debes identificar quién puede autorizar movimientos.',
      'Distingue acceso a una cuenta y control de las claves.',
    ],
  ],
  bitcoin: [
    [
      'Una operación aparece como pendiente. ¿Qué conviene distinguir?',
      [
        'Difusión a la red e inclusión confirmada en bloques.',
        'El color del logo y el de la wallet.',
        'Pendiente y confirmada significan lo mismo.',
      ],
      0,
      'Que una operación se haya difundido no implica que ya esté incluida en un bloque.',
      'El envío y la confirmación son etapas distintas.',
    ],
    [
      'Recibes BTC y una captura dice «enviado». ¿Qué evidencia revisarías?',
      [
        'La cantidad de seguidores del remitente.',
        'La captura es suficiente.',
        'La transacción y sus confirmaciones en la red, con los datos correctos.',
      ],
      2,
      'Una captura es una afirmación. Verificar la transacción y sus confirmaciones aporta evidencia de la red.',
      '¿Qué información puede verificarse independientemente del remitente?',
    ],
    [
      'Dos plataformas exigen distinto número de confirmaciones. ¿Qué interpretación es razonable?',
      [
        'Una confirmación elimina todos los riesgos.',
        'Cada servicio puede definir su política de aceptación; debes consultarla.',
        'La plataforma con menos confirmaciones garantiza ganancias.',
      ],
      1,
      'Las políticas de aceptación dependen del servicio. Ningún número convierte una operación en una inversión garantizada.',
      'Separa las reglas de la red de la política de un servicio.',
    ],
  ],
  ethereum: [
    [
      'Si mantienes las unidades de gas y duplicas el precio efectivo en gwei, la comisión en ETH…',
      ['Se divide entre dos.', 'Se mantiene igual.', 'Se duplica.'],
      2,
      'La comisión es gas consumido × precio efectivo. Si un factor se duplica y el otro no cambia, el producto se duplica.',
      'Usa la multiplicación de unidades por precio, no la cotización de ETH.',
    ],
    [
      'Ejemplo: 21,000 unidades de gas a 20 gwei. ¿Cuál es la comisión en ETH?',
      ['0.00042 ETH.', '0.42 ETH.', '420 ETH.'],
      0,
      '21,000 × 20 ÷ 1,000,000,000 = 0.00042 ETH. Es un ejemplo, no una tarifa actual.',
      'Un gwei equivale a una milmillonésima de ETH.',
    ],
    [
      'Ejemplo: 50,000 unidades a 8 gwei. ETH se cotiza a 2,500 USD. ¿Cuál es el costo equivalente?',
      ['100 USD.', '1 USD.', '0 USD si no transfieres ETH.'],
      1,
      '50,000 × 8 ÷ 1,000,000,000 = 0.0004 ETH; multiplicado por 2,500 resulta en 1 USD.',
      'Primero calcula ETH y después convierte el resultado a dólares.',
    ],
  ],
  stablecoins: [
    [
      'Un token busca mantener paridad con el dólar. ¿Qué significa?',
      [
        'Tiene un objetivo de paridad que también puede perder.',
        'Su precio nunca puede variar.',
        'Equivale siempre a un depósito bancario asegurado.',
      ],
      0,
      'Una paridad objetivo no es garantía. Deben revisarse emisor, reservas, condiciones y riesgos.',
      'Distingue un objetivo de diseño de una garantía.',
    ],
    [
      'Ves USDT en dos redes y quieres enviar a una plataforma. ¿Qué revisas primero?',
      [
        'Que los logos sean iguales.',
        'Sólo que ambos se llamen USDT.',
        'Red y token admitidos por el destino, dirección y condiciones del servicio.',
      ],
      2,
      'El nombre del token no garantiza compatibilidad entre redes. Verifica la red y el activo exactos que acepta el destino.',
      'El símbolo no identifica por sí solo una ruta de transferencia compatible.',
    ],
    [
      'Un anuncio dice «100% stablecoins, sin riesgo». ¿Qué falta evaluar?',
      [
        'El color del panel.',
        'Paridad, emisor, custodia y riesgos de la red o del servicio.',
        'Nada, la palabra stable lo garantiza.',
      ],
      1,
      'Reducir exposición a ciertos movimientos de precio no elimina riesgos del emisor, custodia, paridad o infraestructura.',
      'Considera riesgos distintos de la volatilidad de Bitcoin.',
    ],
  ],
  cardano: [
    [
      '¿Qué pregunta permite distinguir delegación nativa y un servicio custodial?',
      [
        '¿Quién controla las claves y bajo qué condiciones?',
        '¿Qué logo usa el servicio?',
        '¿Cuántos anuncios publica?',
      ],
      0,
      'El control de las claves y las condiciones del servicio permiten identificar diferencias que un nombre comercial puede ocultar.',
      'Identifica quién puede autorizar el movimiento de tus activos.',
    ],
    [
      'Un servicio exige depositar ADA en una cuenta bajo su control y lo llama «delegar». ¿Qué debes registrar?',
      [
        'Que el nombre elimina el riesgo.',
        'Que no hace falta leer condiciones.',
        'La relación de custodia y las condiciones del proveedor.',
      ],
      2,
      'Un rótulo comercial no cambia quién controla los activos. Analiza la custodia y las condiciones por separado.',
      'Mira qué ocurre con el control de los activos, no sólo la etiqueta.',
    ],
    [
      'Comparas dos opciones de delegación. ¿Qué ficha es más útil?',
      [
        'Sólo el rendimiento anunciado.',
        'Control de claves, reglas, costos, condiciones de retiro y riesgos.',
        'Sólo la popularidad.',
      ],
      1,
      'Una comparación útil documenta control y condiciones además de cualquier rendimiento anunciado.',
      'El rendimiento no describe toda la relación con un proveedor.',
    ],
  ],
  exposicion: [
    [
      'En un ejemplo de 1,000 unidades de valor, 600 corresponden a BTC. ¿Cuál es su peso?',
      ['6%.', '60%.', '600%.'],
      1,
      '600 ÷ 1,000 × 100 = 60%. El peso describe exposición, no una recomendación de asignación.',
      'Divide el valor de la posición entre el total.',
    ],
    [
      'Escenario: BTC vale 600 y cae 25%; otros activos valen 400 y no cambian. ¿Qué valor total queda?',
      ['750.', '975.', '850.'],
      2,
      'La caída de BTC es 150. Quedan 450 + 400 = 850. Es un escenario hipotético.',
      'Aplica la caída sólo a la posición afectada, no a todo el total.',
    ],
    [
      'Escenario: 800 en activos que caen 20% y 200 en una stablecoin que cae 5%. ¿Cuál es la pérdida?',
      ['170.', '160.', '250.'],
      0,
      '800 × 20% + 200 × 5% = 160 + 10 = 170. Este ejercicio incluye una pérdida de paridad hipotética.',
      'Calcula cada pérdida por separado y súmalas.',
    ],
  ],
  evidencia: [
    [
      '¿Cuál frase es una hipótesis y no un hecho ya observado?',
      [
        'La documentación describe una comisión.',
        'Una transacción figura en un bloque consultado.',
        'El uso del protocolo crecerá el próximo año.',
      ],
      2,
      'Una afirmación sobre el futuro necesita supuestos y posterior contraste. No es un hecho observado.',
      'Busca la afirmación que todavía necesita ocurrir.',
    ],
    [
      'Tu tesis dice «crecerá por su comunidad». ¿Qué mejora la hace evaluable?',
      [
        'Añadir «sin duda».',
        'Definir indicadores, fuentes, plazo y qué evidencia la invalidaría.',
        'Copiar más mensajes favorables.',
      ],
      1,
      'Una hipótesis útil establece qué observar, cuándo revisarlo y qué evidencia obligaría a cambiarla.',
      '¿Cómo sabrías que estabas equivocado?',
    ],
    [
      'Dos fuentes discrepan sobre la misma cifra. ¿Cómo lo registras?',
      [
        'Anotas fecha, definición, fuente y discrepancia antes de concluir.',
        'Eliges la mayor sin explicación.',
        'Promedias sin mirar qué mide cada una.',
      ],
      0,
      'Comparar definiciones, fechas y procedencia evita tratar medidas diferentes como si fueran equivalentes.',
      'Primero verifica si ambas cifras miden lo mismo.',
    ],
  ],
  revision: [
    [
      '¿Qué convierte una nota de opinión en una bitácora revisable?',
      [
        'Usar muchas siglas.',
        'Fecha, evidencia, conclusión y condición de revisión.',
        'Borrar las dudas.',
      ],
      1,
      'Una bitácora conserva el razonamiento y permite contrastarlo con evidencia posterior.',
      'Piensa en lo que necesitarás leer al volver dentro de un mes.',
    ],
    [
      'Aparece evidencia sólida que contradice tu tesis. ¿Qué haces en la bitácora?',
      [
        'Borras la tesis original para que parezca correcta.',
        'Ignoras la nueva fuente.',
        'Conservas el registro y añades una revisión fechada explicando el cambio.',
      ],
      2,
      'Conservar el razonamiento original y documentar la revisión ayuda a aprender de la decisión.',
      'Aprender requiere poder comparar lo que pensabas con lo que sabes ahora.',
    ],
    [
      'Tu conclusión aún depende de un dato que no has verificado. ¿Cómo la presentas?',
      [
        'Como provisional, identificando el dato pendiente y cuándo lo revisarás.',
        'Como certeza para inspirar confianza.',
        'Sin mencionar la limitación.',
      ],
      0,
      'Una conclusión provisional puede ser útil si sus límites y el siguiente paso quedan claros.',
      'Distingue lo conocido de lo que sigue pendiente.',
    ],
  ],
};
export const questions = concepts.flatMap(c => {
  const m = missions.find(m => m.id === c.missionId);
  return [
    {
      id: c.id + '-d',
      conceptId: c.id,
      stage: 'diagnostic',
      level: 0,
      prompt: m.question,
      options: m.options,
      correct: m.correct,
      explanation: m.explanation,
      hint: '',
    },
    ...exercises[c.id].map(([prompt, options, correct, explanation, hint], i) => ({
      id: c.id + '-' + (i + 1),
      conceptId: c.id,
      stage: 'practice',
      level: i === 0 ? 1 : 2,
      prompt,
      options,
      correct,
      explanation,
      hint,
    })),
  ];
});
