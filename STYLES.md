# Learn Student Diary: diseño de la interfaz

Aplicativo open source para estudiantes. Se carga el contenido y el syllabus de una asignatura, y una IA resuelve las dudas obvias del estudiante para liberar tiempo al profesor. Cuando la IA no tiene la información o no puede resolver la duda, genera un ticket para el profesor.

Este documento reúne las ideas de interfaz, la paleta de colores y las capturas del mockup.

---

## 1. Concepto central: chat primero, con contexto a la vista

El estudiante no debería navegar menús para resolver una duda. La pantalla principal es una conversación, con el contexto de la asignatura siempre cerca.

### Vista del estudiante

- **Selector de asignatura arriba:** pestañas o tarjetas con un color propio por materia, para saber siempre en qué curso se está preguntando.
- **Chat central con chips de sugerencias**, como "¿Cuándo es el próximo parcial?", "¿Qué entra en el examen?" o "¿Cómo se califica?". Resuelven las preguntas obvias con un clic.
- **Respuestas con fuente:** cada respuesta de la IA muestra una etiqueta del tipo "Syllabus · Sección 3.2" que abre el fragmento original. Da confianza y reduce la duda de "¿esto es verdad?".
- **Panel lateral colapsable** con calendario de entregas, syllabus y material, para consultar sin salir del chat.

### El momento del ticket (lo más importante de la experiencia)

Cuando la IA no sabe, no debe fallar en silencio:

1. La IA dice con honestidad: "No encuentro esto en el material del curso."
2. Muestra un **borrador del ticket ya redactado**, con la pregunta y el contexto de la conversación, que el estudiante puede editar.
3. Botón claro: **"Enviar al profesor"**.
4. El ticket aparece en una **línea de tiempo** con tres estados: Enviado → En revisión → Respondido.
5. Cuando el profesor responde, llega una notificación y la respuesta se muestra en el mismo chat.

### Vista del profesor

- **Bandeja de tickets** ordenada por urgencia y agrupada por preguntas similares: si varios estudiantes preguntan lo mismo, el profesor ve un solo ticket con un contador.
- **Botón "Añadir a la base de conocimiento":** al responder, el profesor decide si esa respuesta se guarda para que la IA la use después. Así cada ticket reduce los futuros.
- **Panel de métricas simple:** porcentaje de dudas resueltas por la IA, tiempo ahorrado y temas más confusos. Lo último también sirve para mejorar el syllabus.

---

## 2. Paleta de colores

Para un entorno académico conviene transmitir confianza y calma, sin saturar.

| Rol | Color | Uso |
|---|---|---|
| Primario | Índigo `#4F46E5` | Botones principales, navegación, identidad |
| IA | Teal `#14B8A6` | Burbujas y avatar de la IA, para distinguirla de las personas |
| Profesor | Ámbar `#F59E0B` | Mensajes del profesor y tickets pendientes |
| Éxito | Verde `#22C55E` | Ticket resuelto, entrega completada |
| Alerta | Rojo `#EF4444` | Solo fechas límite críticas y errores |
| Fondo | `#F8FAFC` (claro) / `#0F172A` (oscuro) | Superficies |
| Texto | `#1E293B` / `#F1F5F9` | Texto principal |

### Colores de apoyo usados en el mockup

Para cumplir el contraste mínimo, el texto sobre fondos de color usa tonos oscuros de la misma familia, no blanco sobre el color base.

| Familia | Fondo suave | Texto sobre el fondo suave |
|---|---|---|
| Índigo | `#EEF2FF` | `#3730A3` |
| Teal (IA) | `#CCFBF1` | `#115E59` |
| Ámbar (profesor, pendiente) | `#FEF3C7` | `#92400E` |
| Verde (éxito) | `#DCFCE7` | `#166534` |
| Rojo (urgente) | `#FEE2E2` | `#991B1B` |
| Texto secundario | `#F8FAFC` | `#475569` |

Acentos por asignatura en el mockup: Cálculo II índigo `#4F46E5`, Física I celeste `#0EA5E9`, Programación violeta `#A855F7`.

### Criterios para usar bien los colores

- **El color comunica quién habla:** teal es la IA y ámbar es el profesor. El estudiante ve de un vistazo si le responde una máquina o una persona.
- **El rojo se usa poco.** Si todo es urgente, nada lo es.
- **Nunca solo color:** se acompaña de iconos y texto (Resuelto, Pendiente, Urgente) para que sea accesible a personas con daltonismo.
- **Contraste mínimo WCAG AA (4.5:1)** en el texto, y modo oscuro desde el inicio, porque muchos estudiantes estudian de noche.
- **Un color de acento por asignatura**, derivado de la paleta, para orientarse rápido.

---

## 3. Detalles que mejoran la usabilidad

- Diseño **mobile-first**: la mayoría de los estudiantes preguntará desde el celular.
- Indicador de **confianza de la IA** ("Basada en el syllabus" frente a "Respuesta inferida"), para saber cuándo conviene verificar.
- **Micro-interacciones:** animación de "escribiendo…", confirmación suave al enviar un ticket y feedback de pulgar arriba o abajo en cada respuesta, que además sirve para mejorar la IA.
- **Estado vacío amable** en cada asignatura nueva: "Pregúntame sobre el syllabus, fechas o evaluación".
- Controles táctiles de al menos 44 px y elementos HTML reales (`button`, `a`, `input`, `label`) para que la interfaz sea navegable con teclado y lector de pantalla.

---

## 4. Capturas del mockup

Los textos son contenido de ejemplo. Las cifras de métricas del profesor están como marcadores (`[ 00 % ]`) porque dependen de datos reales.

### 4.1 Chat del estudiante

Pestañas por asignatura, respuesta de la IA con su fuente, y el borrador de ticket cuando la IA no encuentra la información. Abajo, chips de sugerencias y campo de escritura.

![Chat del estudiante](imagenes/01-chat-estudiante.png)

### 4.2 Seguimiento del ticket

Línea de tiempo con tres estados. Cada estado combina color e icono, y el estudiante puede seguir usando el chat mientras espera.

![Seguimiento del ticket](imagenes/02-seguimiento-ticket.png)

### 4.3 Bandeja del profesor

Navegación lateral, métricas arriba, tickets agrupados por pregunta similar con su estado, y un panel para responder con la opción de guardar la respuesta en la base de conocimiento.

![Bandeja del profesor](imagenes/03-bandeja-profesor.png)

---

## 5. Pendiente

- Versión en modo oscuro de las tres pantallas.
- Panel lateral del estudiante (calendario, syllabus, material).
- Pantalla de métricas completa para el profesor.
- Elegir el stack para contribuidores open source (por ejemplo React + Tailwind) y pasar el mockup a código.
