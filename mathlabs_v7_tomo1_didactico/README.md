# MathLabs V7 · 5° básico Tomo 1 didáctico

Este paquete da un salto importante en la experiencia de **5° básico**, tomando como referencia la **progresión pedagógica del Texto del Estudiante 5° básico Tomo 1 del Mineduc**, pero con **redacción original** y una presentación más **didáctica, visual y amigable para niños**.

## Qué mejora este avance

### 1) Rediseño visual de las lecciones
Se reemplaza el render anterior por un estilo más infantil y claro:
- bloques con identidad visual más marcada
- secciones tipo **Explora / Ideas clave / Mira la idea / Tu turno / Ojo / Cierre**
- ejemplos más guiados
- checkpoints de reflexión
- mejor jerarquía visual

### 2) Nuevos modelos matemáticos visuales
Se amplía `MathConceptModel.tsx` con modelos como:
- valor posicional
- arreglos de multiplicación
- agrupamientos para división
- regla graduada
- escalera de conversión
- barras de fracciones
- equivalencia fracción-decimal
- número mixto
- comparación de decimales
- tabla de patrón
- gráfico de barras y gráfico de líneas

### 3) Reescritura didáctica de 14 lecciones clave de 5° básico
Se actualizan los bloques de apoyo de estas lecciones:
- `school-5b-num-01` Números naturales y valor posicional
- `school-5b-num-02` Estrategias de cálculo mental
- `school-5b-num-03` Multiplicación de dos dígitos
- `school-5b-num-04` División e interpretación del resto
- `school-5b-oa-19` Medición de longitudes
- `school-5b-oa-20` Conversión de unidades de longitud
- `school-5b-frac-07` Fracciones propias
- `school-5b-frac-08` Fracciones impropias y números mixtos
- `school-5b-frac-09` Suma y resta de fracciones
- `school-5b-frac-10` Fracciones y decimales equivalentes
- `school-5b-frac-11` Comparación de decimales
- `school-5b-frac-12` Suma y resta de decimales
- `school-5b-oa-14` Reglas y sucesiones
- `school-5b-oa-26` Tablas y gráficos

Cada una queda con una estructura más rica, normalmente con:
- meta de aprendizaje
- activación de saberes previos
- relato breve o situación inicial
- ideas clave
- modelo visual
- estrategia paso a paso
- ejemplos resueltos
- práctica guiada
- checkpoint de reflexión
- errores frecuentes
- tips útiles
- síntesis final
- siguiente paso

## Archivos incluidos

- `database/20_mathlabs_tomo1_didactico.sql`
- `database/21_verify_mathlabs_v7.sql`
- `scripts/install_mathlabs_v7.sh`
- `src/components/learning/LessonBlockRenderer.tsx`
- `src/components/mathlabs/MathConceptModel.tsx`

## Cómo instalar

1. Descomprime el paquete en la raíz del proyecto.
2. Reemplaza los archivos cuando te lo solicite.
3. Ejecuta la migración SQL:
   - `database/20_mathlabs_tomo1_didactico.sql`
4. Ejecuta la verificación:
   - `database/21_verify_mathlabs_v7.sql`
5. Prueba el proyecto:
   - `npm run build`

## Qué revisar después de instalar

### Lecciones sugeridas
- `/aprender/leccion/5b-numeros-naturales-valor-posicional`
- `/aprender/leccion/5b-division-interpretacion-resto`
- `/aprender/leccion/5b-fracciones-propias`
- `/aprender/leccion/5b-fracciones-decimales-equivalentes`
- `/aprender/leccion/5b-reglas-sucesiones`
- `/aprender/leccion/5b-tablas-graficos`

## Recomendación de siguiente etapa
Si luego subes el **Tomo 2**, el siguiente paso ideal sería un **V8** para:
- geometría
- plano cartesiano
- rectas y transformaciones
- área de figuras
- promedio, probabilidad y tallo-hojas
- consolidación visual del resto de 5° básico

