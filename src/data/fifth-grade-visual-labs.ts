export type VisualLabChallenge = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type VisualLabDefinition = {
  slug: string;
  title: string;
  emoji: string;
  type:
    | "place_value"
    | "multiplication"
    | "division"
    | "length"
    | "decimals"
    | "patterns"
    | "fractions"
    | "data";
  summary: string;
  lessonHref: string;
  chapter: string;
  gradient: string;
  challenges: VisualLabChallenge[];
};

export const fifthGradeVisualLabs: VisualLabDefinition[] = [
  {
    "slug": "valor-posicional",
    "title": "Ciudad de los números",
    "emoji": "🏙️",
    "type": "place_value",
    "summary": "Construye números grandes y observa cuánto vale cada cifra según su posición.",
    "lessonHref": "/aprender/leccion/5b-numeros-naturales-valor-posicional",
    "chapter": "Números grandes",
    "gradient": "from-cyan-300/20 to-blue-400/10",
    "challenges": [
      {
        "prompt": "En 374 205, ¿cuánto vale la cifra 7?",
        "options": [
          "7",
          "700",
          "7 000",
          "70 000"
        ],
        "answer": "70 000",
        "explanation": "El 7 está en la posición de decenas de mil, por eso representa 70 000."
      },
      {
        "prompt": "¿Cuál es la descomposición correcta de 508 030?",
        "options": [
          "500 000 + 8 000 + 30",
          "50 000 + 8 000 + 30",
          "500 000 + 800 + 30",
          "500 000 + 80 000 + 3"
        ],
        "answer": "500 000 + 8 000 + 30",
        "explanation": "Solo aparecen valores distintos de cero: 500 000, 8 000 y 30."
      },
      {
        "prompt": "¿Cuál número es mayor?",
        "options": [
          "489 999",
          "490 001",
          "Son iguales",
          "No se puede saber"
        ],
        "answer": "490 001",
        "explanation": "Ambos tienen seis cifras, pero 490 001 tiene 490 mil y el otro 489 mil."
      }
    ]
  },
  {
    "slug": "multiplicacion-visual",
    "title": "Fábrica de multiplicaciones",
    "emoji": "🏭",
    "type": "multiplication",
    "summary": "Mueve filas y columnas para ver la multiplicación como grupos iguales.",
    "lessonHref": "/aprender/leccion/5b-multiplicacion-de-dos-digitos",
    "chapter": "Multiplicación",
    "gradient": "from-amber-300/20 to-orange-400/10",
    "challenges": [
      {
        "prompt": "¿Cuál es el producto de 24 × 15?",
        "options": [
          "260",
          "340",
          "360",
          "390"
        ],
        "answer": "360",
        "explanation": "24 × 15 = 24 × 10 + 24 × 5 = 240 + 120 = 360."
      },
      {
        "prompt": "¿Qué estimación es razonable para 39 × 21?",
        "options": [
          "Aproximadamente 80",
          "Aproximadamente 800",
          "Aproximadamente 8 000",
          "Aproximadamente 18"
        ],
        "answer": "Aproximadamente 800",
        "explanation": "39 ≈ 40 y 21 ≈ 20, entonces 40 × 20 = 800."
      },
      {
        "prompt": "¿Qué expresión muestra correctamente productos parciales para 32 × 14?",
        "options": [
          "32 × 10 + 32 × 4",
          "32 × 1 + 32 × 4",
          "30 × 14 + 2",
          "32 + 14"
        ],
        "answer": "32 × 10 + 32 × 4",
        "explanation": "14 se descompone en 10 + 4."
      }
    ]
  },
  {
    "slug": "division-grupos",
    "title": "Estación de reparto",
    "emoji": "📦",
    "type": "division",
    "summary": "Forma grupos, observa el cociente y decide qué significa el resto.",
    "lessonHref": "/aprender/leccion/5b-division-interpretacion-resto",
    "chapter": "División",
    "gradient": "from-indigo-300/20 to-violet-400/10",
    "challenges": [
      {
        "prompt": "37 objetos se agrupan de 5 en 5. ¿Qué ocurre?",
        "options": [
          "7 grupos y sobran 2",
          "6 grupos y sobran 7",
          "8 grupos exactos",
          "7 grupos y sobra 1"
        ],
        "answer": "7 grupos y sobran 2",
        "explanation": "5 × 7 = 35 y 37 − 35 = 2."
      },
      {
        "prompt": "41 estudiantes viajan en vehículos de 9 personas. ¿Cuántos vehículos se necesitan como mínimo?",
        "options": [
          "4",
          "5",
          "6",
          "9"
        ],
        "answer": "5",
        "explanation": "Con 4 vehículos viajan 36; quedan 5 estudiantes, así que hace falta otro vehículo."
      },
      {
        "prompt": "¿Cómo se comprueba 86 ÷ 4 = 21 resto 2?",
        "options": [
          "21 + 4 + 2 = 27",
          "21 × 4 + 2 = 86",
          "86 × 4 = 21",
          "21 × 2 + 4 = 46"
        ],
        "answer": "21 × 4 + 2 = 86",
        "explanation": "Divisor × cociente + resto debe dar el dividendo."
      }
    ]
  },
  {
    "slug": "medidas-conversion",
    "title": "Taller de medidas",
    "emoji": "📏",
    "type": "length",
    "summary": "Experimenta con mm, cm, m y km sin perder de vista la longitud real.",
    "lessonHref": "/aprender/leccion/5b-conversion-unidades-longitud",
    "chapter": "Longitud",
    "gradient": "from-emerald-300/20 to-lime-400/10",
    "challenges": [
      {
        "prompt": "3,4 m equivalen a:",
        "options": [
          "34 cm",
          "340 cm",
          "3 400 cm",
          "0,34 cm"
        ],
        "answer": "340 cm",
        "explanation": "1 m = 100 cm, entonces 3,4 × 100 = 340."
      },
      {
        "prompt": "¿Qué unidad conviene para el grosor de una moneda?",
        "options": [
          "km",
          "m",
          "cm",
          "mm"
        ],
        "answer": "mm",
        "explanation": "El milímetro es adecuado para longitudes muy pequeñas."
      },
      {
        "prompt": "2 km equivalen a:",
        "options": [
          "20 m",
          "200 m",
          "2 000 m",
          "20 000 m"
        ],
        "answer": "2 000 m",
        "explanation": "1 km = 1 000 m."
      }
    ]
  },
  {
    "slug": "decimales-cuadricula",
    "title": "Piscina de centésimos",
    "emoji": "🟦",
    "type": "decimals",
    "summary": "Pinta centésimos y conecta la cuadrícula con fracciones y números decimales.",
    "lessonHref": "/aprender/leccion/5b-fracciones-decimales-equivalentes",
    "chapter": "Números decimales",
    "gradient": "from-sky-300/20 to-cyan-400/10",
    "challenges": [
      {
        "prompt": "37 de 100 cuadrados pintados representan:",
        "options": [
          "0,037",
          "0,37",
          "3,7",
          "37,0"
        ],
        "answer": "0,37",
        "explanation": "37/100 son treinta y siete centésimos: 0,37."
      },
      {
        "prompt": "¿Cuál es mayor?",
        "options": [
          "0,7",
          "0,67",
          "Son iguales",
          "No se puede saber"
        ],
        "answer": "0,7",
        "explanation": "0,7 = 0,70, y 70 centésimos es mayor que 67 centésimos."
      },
      {
        "prompt": "¿Qué fracción equivale a 0,25?",
        "options": [
          "1/2",
          "1/4",
          "2/5",
          "3/4"
        ],
        "answer": "1/4",
        "explanation": "0,25 = 25/100 = 1/4."
      }
    ]
  },
  {
    "slug": "patrones-maquina",
    "title": "Máquina de patrones",
    "emoji": "⚙️",
    "type": "patterns",
    "summary": "Cambia el inicio y la regla para observar cómo crecen juntas las cantidades.",
    "lessonHref": "/aprender/leccion/5b-reglas-sucesiones",
    "chapter": "Patrones",
    "gradient": "from-fuchsia-300/20 to-pink-400/10",
    "challenges": [
      {
        "prompt": "Secuencia: 4, 7, 10, 13... ¿cuál es el siguiente término?",
        "options": [
          "14",
          "15",
          "16",
          "17"
        ],
        "answer": "16",
        "explanation": "La regla es sumar 3."
      },
      {
        "prompt": "Una figura empieza con 5 fichas y aumenta 2 fichas por etapa. ¿Cuántas tiene la figura 4?",
        "options": [
          "9",
          "10",
          "11",
          "13"
        ],
        "answer": "11",
        "explanation": "5, 7, 9, 11."
      },
      {
        "prompt": "¿Qué herramienta ayuda especialmente a descubrir cómo cambian dos cantidades juntas?",
        "options": [
          "Una tabla",
          "Un transportador",
          "Una balanza",
          "Un reloj"
        ],
        "answer": "Una tabla",
        "explanation": "Una tabla organiza la posición y la cantidad para hacer visible la regularidad."
      }
    ]
  },
  {
    "slug": "muro-fracciones",
    "title": "Muro de fracciones",
    "emoji": "🧱",
    "type": "fractions",
    "summary": "Construye fracciones, compara tamaños y genera equivalencias visualmente.",
    "lessonHref": "/aprender/leccion/5b-fracciones-propias",
    "chapter": "Fracciones",
    "gradient": "from-rose-300/20 to-orange-300/10",
    "challenges": [
      {
        "prompt": "¿Cuál fracción es equivalente a 2/3?",
        "options": [
          "3/4",
          "4/6",
          "4/5",
          "6/8"
        ],
        "answer": "4/6",
        "explanation": "Multiplicando numerador y denominador por 2 se obtiene 4/6."
      },
      {
        "prompt": "¿Cuál es mayor?",
        "options": [
          "2/3",
          "3/4",
          "Son iguales",
          "No se puede comparar"
        ],
        "answer": "3/4",
        "explanation": "2/3 = 8/12 y 3/4 = 9/12."
      },
      {
        "prompt": "7/4 expresado como número mixto es:",
        "options": [
          "1 3/4",
          "2 1/4",
          "1 1/4",
          "3 1/4"
        ],
        "answer": "1 3/4",
        "explanation": "4/4 forma una unidad y quedan 3/4."
      }
    ]
  },
  {
    "slug": "datos-en-accion",
    "title": "Observatorio de datos",
    "emoji": "📊",
    "type": "data",
    "summary": "Modifica barras y observa cuándo conviene un gráfico de barras o uno de líneas.",
    "lessonHref": "/aprender/leccion/5b-tablas-graficos",
    "chapter": "Datos",
    "gradient": "from-violet-300/20 to-cyan-300/10",
    "challenges": [
      {
        "prompt": "¿Qué gráfico conviene para mostrar cómo cambia la temperatura cada hora?",
        "options": [
          "Gráfico de líneas",
          "Solo una lista",
          "Un dibujo sin escala",
          "Ninguno"
        ],
        "answer": "Gráfico de líneas",
        "explanation": "El gráfico de líneas muestra cambios de una cantidad a lo largo del tiempo."
      },
      {
        "prompt": "En un gráfico de barras, ¿qué debes mirar para conocer la cantidad exacta?",
        "options": [
          "Solo el color",
          "La escala",
          "El título únicamente",
          "El ancho de la hoja"
        ],
        "answer": "La escala",
        "explanation": "La altura visual orienta, pero la escala permite leer el valor exacto."
      },
      {
        "prompt": "Si las cantidades son 6, 8, 5, 9 y 7, ¿cuál es la mayor?",
        "options": [
          "5",
          "7",
          "8",
          "9"
        ],
        "answer": "9",
        "explanation": "9 es el valor máximo del conjunto."
      }
    ]
  }
];

export function getFifthGradeVisualLab(slug: string) {
  return fifthGradeVisualLabs.find((lab) => lab.slug === slug) ?? null;
}
