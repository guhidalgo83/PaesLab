export type SixthGradeLabDefinition={slug:string;title:string;emoji:string;topicSlug:string;type:"factors"|"ratio"|"percent"|"mixed_fraction"|"decimal_scale"|"equation"|"angle"|"volume"|"probability"|"double_bar";summary:string};

export const sixthGradeLabs:SixthGradeLabDefinition[]=[
  {
    "slug": "factores-primos",
    "title": "Detector de factores",
    "emoji": "🔎",
    "topicSlug": "factores-y-divisores",
    "type": "factors",
    "summary": "Cambia el número y observa sus factores y si es primo."
  },
  {
    "slug": "mezclador-razones",
    "title": "Mezclador de razones",
    "emoji": "🥤",
    "topicSlug": "razon-comparacion",
    "type": "ratio",
    "summary": "Modifica dos cantidades y observa la razón."
  },
  {
    "slug": "porcentaje-100",
    "title": "Laboratorio del 100%",
    "emoji": "💯",
    "topicSlug": "porcentaje-significado",
    "type": "percent",
    "summary": "Conecta porcentaje, fracción y decimal."
  },
  {
    "slug": "fracciones-mixtas",
    "title": "Constructor de números mixtos",
    "emoji": "🍫",
    "topicSlug": "impropias-y-mixtos",
    "type": "mixed_fraction",
    "summary": "Pasa entre mixtos e impropias."
  },
  {
    "slug": "escala-decimal",
    "title": "Escala decimal",
    "emoji": "🔬",
    "topicSlug": "multiplicacion-decimales",
    "type": "decimal_scale",
    "summary": "Observa cambios al multiplicar por potencias de 10."
  },
  {
    "slug": "balanza-ecuaciones",
    "title": "Balanza de ecuaciones",
    "emoji": "⚖️",
    "topicSlug": "ecuaciones-con-balanza",
    "type": "equation",
    "summary": "Mantén la igualdad haciendo la misma transformación."
  },
  {
    "slug": "explorador-angulos",
    "title": "Explorador de ángulos",
    "emoji": "📐",
    "topicSlug": "tipos-y-construccion-angulos",
    "type": "angle",
    "summary": "Mueve y clasifica ángulos."
  },
  {
    "slug": "constructor-volumen",
    "title": "Constructor de volumen",
    "emoji": "🧊",
    "topicSlug": "volumen-cubos-paralelepipedos",
    "type": "volume",
    "summary": "Visualiza largo, ancho, alto y volumen."
  },
  {
    "slug": "simulador-probabilidad",
    "title": "Simulador de probabilidad",
    "emoji": "🪙",
    "topicSlug": "experimentos-repetidos-probabilidad",
    "type": "probability",
    "summary": "Repite lanzamientos y observa frecuencias."
  },
  {
    "slug": "graficos-comparativos",
    "title": "Comparador de gráficos",
    "emoji": "📊",
    "topicSlug": "graficos-dobles-circulares",
    "type": "double_bar",
    "summary": "Compara dos grupos lado a lado."
  }
];

export function getSixthGradeLab(slug:string){return sixthGradeLabs.find((lab)=>lab.slug===slug)??null;}
