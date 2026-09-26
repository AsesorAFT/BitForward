export const content = {
  '004': {
    intro:
      'ATF entra a la sala de confirmaciones. Un saldo visible no cuenta toda la historia: hay que saber quién puede autorizar su movimiento.',
    sections: [
      [
        'Tres piezas, tres preguntas',
        'Bitcoin es una red abierta; bitcoin o BTC es su activo. La red mantiene un registro compartido de operaciones. El precio, en cambio, resulta del intercambio en el mercado. Comprender una pieza no resuelve automáticamente las otras.',
      ],
      [
        'Una dirección recibe; una clave autoriza',
        'Una dirección sirve para indicar un destino. Una clave privada permite generar la firma necesaria para gastar los fondos asociados. Ver una dirección o su saldo en un explorador no significa tener control sobre ellos. En un servicio custodial, ese control puede depender del intermediario.',
      ],
      [
        'Confirmar toma tiempo',
        'Los mineros agrupan operaciones en bloques mediante prueba de trabajo. Nuevos bloques añaden confirmaciones. La espera y la comisión importan; un pago visto como pendiente aún no es lo mismo que uno confirmado.',
      ],
      [
        'Tu ejercicio',
        'Abre una ficha de BTC. Describe la diferencia entre activo, red y precio. Anota quién conservaría las claves en el caso que estás investigando y registra una fuente. No necesitas comprar ni mover fondos para completar esta misión.',
      ],
    ],
    sources: [['Bitcoin.org · Cómo funciona Bitcoin', 'https://bitcoin.org/en/how-it-works']],
  },
  '005': {
    intro:
      'En la estación de paridad, dos indicadores apuntan a un dólar. ATF abre la parte menos visible del tablero: emisor, reservas, red y condiciones.',
    sections: [
      [
        'Un objetivo de precio no elimina el riesgo',
        'USDT y USDC están diseñados para seguir el dólar estadounidense. Esa referencia es un objetivo de paridad, no una garantía de ausencia de pérdidas. El precio de mercado y las condiciones de canje son conceptos distintos.',
      ],
      [
        'Empieza por el emisor',
        'Tether y Circle publican información sobre sus productos y reservas. Léela como información del emisor: revisa fechas, alcance y condiciones. El acceso al canje directo puede depender de elegibilidad y requisitos; no presupongas que cualquier persona puede canjear cualquier monto de inmediato.',
      ],
      [
        'El mismo nombre puede vivir en varias redes',
        'Antes de analizar un token, identifica su red y contrato. Una versión nativa y una representación que utiliza un puente pueden añadir riesgos diferentes. El nombre o el logotipo no bastan para identificar qué tienes delante.',
      ],
      [
        'Tu ejercicio',
        'Compara USDT con USDC en el laboratorio. Registra la fuente de cada emisor y una pregunta pendiente. Después abre el mapa de exposición y prueba una pérdida de paridad del 5%: observa que “stable” no significa que el resultado sea siempre cero.',
      ],
    ],
    sources: [
      ['Tether · Funcionamiento', 'https://tether.to/en/how-it-works/'],
      ['Tether · Condiciones', 'https://tether.to/en/legal/'],
      ['Circle · USDC', 'https://www.circle.com/usdc'],
    ],
  },
  '006': {
    intro:
      'ATF llega a un observatorio de Cardano. En el panel aparece una palabra familiar: staking. La misión consiste en descubrir qué mecanismo hay detrás.',
    sections: [
      [
        'ADA dentro de Cardano',
        'ADA es el activo nativo de Cardano, una red con prueba de participación. Antes de formular una tesis sobre su precio, separa el funcionamiento del protocolo, el uso de sus aplicaciones y las condiciones de cada servicio.',
      ],
      [
        'Delegar no es una palabra universal',
        'La documentación de Cardano describe la delegación a pools dentro de su sistema de participación. No la equipares automáticamente con entregar activos a un intermediario que ofrece un producto llamado staking. El control, las condiciones y los riesgos pueden cambiar.',
      ],
      [
        'Mira el mecanismo antes que la cifra',
        'Pregunta quién conserva el control, qué decisiones estás autorizando, qué condiciones se aplican y cómo se describen las recompensas. Un porcentaje mostrado no es una promesa de resultado futuro en dólares. El precio de ADA sigue pudiendo variar.',
      ],
      [
        'Tu ejercicio',
        'Construye una ficha de ADA y anota dos columnas en la evidencia: “lo que dice el protocolo” y “lo que ofrece el servicio”. Deja por escrito qué información necesitarías antes de confiar en ese servicio. Esta misión no requiere delegar fondos.',
      ],
    ],
    sources: [
      ['Cardano Docs · Introducción', 'https://docs.cardano.org/about-cardano/introduction'],
      ['Cardano Docs · Delegación', 'https://docs.cardano.org/about-cardano/learn/delegation'],
    ],
  },
  '007': {
    intro:
      'En la mesa de riesgo, ATF apaga los precios en movimiento. Primero importa entender cuánto pesa cada posición y qué ocurre bajo una hipótesis explícita.',
    sections: [
      [
        'El peso conecta una posición con el total',
        'Si un conjunto de posiciones vale $1,000 y BTC representa $600, su peso es 60%. Una caída del 20% en esa posición representa $120: el 12% del total inicial, si todo lo demás permanece igual.',
      ],
      [
        'Expón el supuesto',
        'El laboratorio toma valores manuales en USD y aplica una caída común a BTC, ETH, ADA y SOL. Por separado, aplica una pérdida de paridad a USDT y USDC. Ambas magnitudes las eliges tú. No es una predicción ni un cálculo de probabilidades.',
      ],
      [
        'Reconoce lo que falta',
        'El modelo no reproduce correlaciones, diferencias de liquidez, comisiones, impuestos, fallas de custodios ni todos los riesgos de cada activo. Una cifra de pérdida resume sólo los supuestos introducidos. No demuestra que una cartera sea segura o adecuada.',
      ],
      [
        'Tu ejercicio',
        'Carga el ejemplo de $1,000. Con una caída del 30% en activos nativos y 5% en stablecoins, la pérdida es $250 y el valor restante $750. Cambia un supuesto, compara y descarga el escenario con sus límites.',
      ],
    ],
    sources: [
      ['Ethereum.org · Riesgos y seguridad', 'https://ethereum.org/en/security/'],
      ['Circle · Características de USDC', 'https://www.circle.com/usdc'],
    ],
  },
  '008': {
    intro:
      'ATF reúne datos en la mesa de análisis. La misión no termina con una opinión convincente, sino con una hipótesis que pueda revisarse.',
    sections: [
      [
        'Empieza con una afirmación concreta',
        '“Esta red resuelve este problema” es un punto de partida. “El precio siempre subirá” no es una conclusión que se desprenda de esa frase. Define qué estás analizando: el protocolo, una aplicación, el token o un servicio.',
      ],
      [
        'Separa evidencia e interpretación',
        'Un documento oficial puede describir cómo debería funcionar un mecanismo. Tu interpretación sobre su utilidad o adopción requiere pasos adicionales. Anota la fuente, su fecha y qué parte respalda exactamente. Una explicación del emisor tampoco es una evaluación independiente.',
      ],
      [
        'Escribe qué te haría cambiar de opinión',
        'Una hipótesis gana utilidad cuando identificas un riesgo y una condición observable que la refutaría. “Revisaré mi conclusión si cambia este mecanismo o deja de verificarse este dato” es más concreto que una convicción sin condiciones.',
      ],
      [
        'Tu ejercicio',
        'Elige BTC, ETH, ADA, SOL o una stablecoin. Completa propósito, evidencia, riesgo y condición de revisión en la ficha. Agrega una fuente primaria y descarga el documento. No necesitas formular un precio objetivo.',
      ],
    ],
    sources: [
      ['Solana · Documentación del protocolo y desarrollo', 'https://solana.com/docs'],
      ['Ethereum.org · Qué es Ethereum', 'https://ethereum.org/en/what-is-ethereum/'],
    ],
  },
  '009': {
    intro:
      'Al final de la misión, ATF vuelve a la bitácora. El registro permite recordar qué sabías, qué suponías y por qué cambiaste de opinión.',
    sections: [
      [
        'Anota el contexto antes de perderlo',
        'Una nota útil incluye el activo, la fecha, la fuente, tu conclusión y una condición de revisión. No hace falta escribir mucho: hace falta poder entender el razonamiento cuando lo leas después.',
      ],
      [
        'Un ejemplo de nota',
        '“Revisé las condiciones del emisor de una stablecoin. Mi conclusión depende de la red y del acceso al canje. Antes de seguir, comprobaré si las condiciones aplican a mi caso”. Es una pregunta documentada, no una indicación de compra.',
      ],
      [
        'Revisar también es avanzar',
        'Conserva lo que sigue respaldado, cambia lo que nueva evidencia contradiga y deja visibles las dudas que no resolviste. La bitácora sirve para mejorar un método, no para fabricar un historial de aciertos.',
      ],
      [
        'Tu ejercicio',
        'Escribe una nota, añade su fuente y guárdala. Descarga una copia. La bitácora actual es local a este navegador: no tiene cuenta ni sincronización. No escribas claves, contraseñas, datos personales o información sensible.',
      ],
    ],
    sources: [
      ['Ethereum.org · Seguridad y prevención de estafas', 'https://ethereum.org/en/security/'],
    ],
  },
};
