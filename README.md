# 📖 Learn Student Diary — Asistente Académico Open Source con IA

> Proyecto Open Source desarrollado para **Hacktoberfest** 🎃

**Learn Student Diary** es un aplicativo académico open source donde el docente carga el syllabus y el material de su asignatura en **Neon Lakebase Postgres**, y un asistente de IA (**Gemma 4 con Ollama**) resuelve al instante las dudas frecuentes de los estudiantes citando la fuente original.

Cuando la IA no cuenta con la información suficiente en el material cargado, **no falla en silencio**: informa con honestidad al estudiante, prepara un **borrador de ticket editable**, envía una alerta al profesor mediante **[Resend](https://resend.com)** y agrupa las preguntas similares en la **Bandeja de tickets del profesor**, permitiendo que la respuesta del docente alimente la base de conocimiento para futuras consultas.

---

## 📋 Tabla de contenidos

- [Concepto de diseño (`STYLES.md`)](#-concepto-de-diseño-stylesmd)
- [Vistas y módulos de la interfaz](#-vistas-y-módulos-de-la-interfaz)
- [Paleta de colores y accesibilidad (WCAG AA)](#-paleta-de-colores-y-accesibilidad-wcag-aa)
- [Flujo de funcionamiento](#-flujo-de-funcionamiento)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Uso](#-uso)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎨 Concepto de diseño (`STYLES.md`)

El diseño de la interfaz sigue las estipulaciones definidas en [`STYLES.md`](./STYLES.md):

1. **Chat primero, con contexto a la vista (Vista del Estudiante):**
   - **Selector de asignatura superior** con acento cromático por materia (*Cálculo II* `#4F46E5`, *Física I* `#0EA5E9`, *Programación* `#A855F7`) y conexión mediante código único de docente.
   - **Chips de sugerencias rápidas** (*"¿Cuándo es el próximo parcial?"*, *"¿Qué entra en el examen?"*, *"¿Cómo se califica?"*).
   - **Respuestas con fuente verificable e indicador de confianza:** cada respuesta de la IA incluye una etiqueta interactiva (por ejemplo, `Syllabus · Sección 3.2`) que despliega el fragmento original del curso, junto con botones de retroalimentación (`👍` / `👎`).
   - **Panel lateral colapsable** con calendario de entregas (destacando en rojo únicamente fechas límite críticas), syllabus interactivo y material descargable.

2. **El momento del ticket (Escalamiento honesto al profesor):**
   - Si la IA no encuentra la respuesta en los contenidos del curso (`NO_SE`), responde con honestidad: *"No encuentro esto en el material del curso."*
   - Presenta un **borrador del ticket ya redactado** con la pregunta y el contexto de la conversación para que el estudiante pueda editarlo antes de pulsar **"Enviar al profesor"**.
   - Muestra el seguimiento en una **línea de tiempo de tres estados** (`1. Enviado` → `2. En revisión` → `3. Respondido`) combinando icono, color y texto.

3. **Bandeja de tickets del profesor (Imagen de referencia):**
   - **Navegación lateral en índigo profundo** con acceso directo a **Bandeja de tickets**, **Base de conocimiento** y **Métricas**, además de selector de vista y **Modo Oscuro / Claro**.
   - **Tarjetas superiores de métricas:** *Dudas resueltas por la IA* (`[ 00 % ]`), *Tiempo ahorrado esta semana* (`[ 0 h ]`) y *Tema más confuso* (`[ tema ]`).
   - **Tickets pendientes agrupados por pregunta similar:** etiquetas accesibles con icono y texto (`⚠ Urgente · parcial cerca`, `🕒 Pendiente`, `✓ Resuelto`).
   - **Panel lateral `RESPONDER`:** muestra el contexto del asistente en tono Teal suave (`#CCFBF1` / `#115E59`), campo de respuesta del profesor, casilla **"Añadir a la base de conocimiento"** (`#EEF2FF` / `#3730A3`) y botón **"Responder a todos los estudiantes"** (`#4F46E5`).

---

## 🧩 Vistas y módulos de la interfaz

| Módulo | Descripción |
|---|---|
| **Bandeja de tickets (Profesor)** | Visualiza dudas escaladas ordenadas por urgencia y agrupadas por similitud. Al responder, permite guardar la respuesta directamente en **Neon Postgres** para que **Gemma 4** la utilice en futuras consultas. |
| **Base de conocimiento (Profesor)** | Registro/login docente por correo, generación de código único para estudiantes (ej. `CALC-202`) y carga de fragmentos del syllabus o archivos (`.txt`, `.md`, `.csv`, `.json`). |
| **Métricas (Profesor)** | Resumen del porcentaje de dudas resueltas por la IA, horas ahorradas y sugerencias para mejorar las secciones del syllabus que generan más dudas. |
| **Chat del estudiante** | Conversación asistida por IA con citas del syllabus, borrador editable de tickets, línea de tiempo de seguimiento y recepción de respuestas del profesor en el mismo chat. |
| **Panel Admin** | Aprobación o rechazo del acceso de docentes (`pending` → `approved` / `rejected`) y auditoría de correos enviados con **Resend**. |

---

## 🎯 Paleta de colores y accesibilidad (WCAG AA)

Para transmitir calma y confianza en un entorno académico y garantizar un contraste mínimo **WCAG AA (4.5:1)**, los textos sobre fondos suaves usan tonos oscuros de la misma familia cromática y nunca dependen únicamente del color:

| Rol / Familia | Color Base | Fondo Suave | Texto sobre Fondo Suave | Uso en la Interfaz |
|---|---|---|---|---|
| **Primario (Índigo)** | `#4F46E5` | `#EEF2FF` | `#3730A3` | Botones principales, navegación activa, bordes de selección |
| **IA (Teal)** | `#14B8A6` | `#CCFBF1` | `#115E59` | Contexto del asistente, etiquetas de fuente e identidad de la IA |
| **Profesor / Pendiente (Ámbar)** | `#F59E0B` | `#FEF3C7` | `#92400E` | Respuestas del profesor y estado `🕒 Pendiente` |
| **Éxito / Resuelto (Verde)** | `#22C55E` | `#DCFCE7` | `#166534` | Estado `✓ Resuelto` y confirmaciones de base de conocimiento |
| **Alerta / Urgente (Rojo)** | `#EF4444` | `#FEE2E2` | `#991B1B` | Solo fechas límite críticas y tickets `⚠ Urgente · parcial cerca` |
| **Superficies y Texto** | Claro: `#F8FAFC` | Oscuro: `#0F172A` | Texto: `#1E293B` / `#F1F5F9` | Soporte nativo de **Modo Claro y Modo Oscuro** |

---

## 🔄 Flujo de funcionamiento

```mermaid
flowchart TD
    D["Docente registra su asignatura y carga el syllabus en Neon Postgres"] --> A["Estudiante consulta en el Chat de su asignatura"]
    A --> B{"¿Gemma 4 encuentra la respuesta en el syllabus?"}
    B -- "Sí" --> C["Responde citando la sección (ej. Syllabus · Sección 3.2)"]
    B -- "No (NO_SE)" --> T["Muestra mensaje honesto y borrador editable de ticket"]
    T --> E["Estudiante pulsa 'Enviar al profesor' (alerta Resend + registro en Neon)"]
    E --> F["Profesor responde en la Bandeja de tickets y marca 'Añadir a la base de conocimiento'"]
    F --> G["El ticket pasa a 'Respondido', el estudiante recibe la respuesta y la IA aprende el nuevo contenido"]
```

---

## 🛠️ Tecnologías

- **[Next.js 16 (App Router)](https://nextjs.org)** + **React 19** + **Tailwind CSS v4**: interfaz *mobile-first* con controles táctiles de al menos `44 px` y elementos HTML semánticos.
- **[Gemma 4](https://ollama.com/library/gemma4)** vía **[Ollama](https://ollama.com)**: modelo de lenguaje local que responde estrictamente con base en los contenidos del curso.
- **[Neon Lakebase Postgres](https://neon.com)** (`@neondatabase/serverless`): persistencia serverless de docentes, fragmentos del syllabus/contenidos y tickets escalados.
- **[Resend](https://resend.com)**: envío automático de notificaciones por correo electrónico al docente cuando se genera un ticket.

### 🧠 Configuración del modelo con `Modelfile`

```Modelfile
FROM gemma4

PARAMETER temperature 0.3

SYSTEM """
Eres un asistente académico para estudiantes. Responde solo con la información
de los contenidos del curso (plataformas, tareas, notas e información general).
Si no conoces la respuesta, responde exactamente: NO_SE
"""
```

```bash
ollama create chatbot-estudiantil -f Modelfile
```

---

## ⚙️ Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/<repositorio>.git
cd <repositorio>

# 2. Instalar Ollama (https://ollama.com/download) y descargar Gemma 4
ollama pull gemma4

# 3. (Opcional) Crear el modelo personalizado con el Modelfile
ollama create chatbot-estudiantil -f Modelfile

# 4. Instalar dependencias de Node.js
npm install

# 5. Configurar las variables de entorno
cp .env.example .env
```

---

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto a partir de [`.env.example`](./.env.example):

```env
# Neon Lakebase Postgres
DATABASE_URL=postgresql://user:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@ep-example.region.aws.neon.tech/neondb?sslmode=require
NEON_BRANCH=production

# Ollama (modelo local Gemma 4)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma4

# Resend (envío de correos al docente)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
PROFESSOR_EMAIL=profesor@institucion.edu
```

> ⚠️ Nunca subas el archivo `.env` al repositorio. Ya está excluido en `.gitignore`.

---

## 🚀 Uso

```bash
ollama serve       # Inicia Ollama (si no está ejecutándose en segundo plano)
npm run dev        # Inicia la aplicación en http://localhost:3000
```

1. Abre `http://localhost:3000` en tu navegador.
2. Explora la **Bandeja de tickets** del profesor (vista inicial inspirada en el mockup de referencia): selecciona un ticket agrupado, redacta tu respuesta, marca **"Añadir a la base de conocimiento"** y pulsa **"Responder a todos los estudiantes"**.
3. En **Base de conocimiento**, registra tu correo docente, apruébalo desde el botón **Admin** de la barra lateral, copia tu código de curso y carga secciones del syllabus en **Neon Postgres**.
4. Cambia a **💬 Chat del estudiante** en la parte inferior de la barra lateral para probar las pestañas por asignatura, los chips de sugerencias, las citas del syllabus, el borrador editable de tickets y la línea de tiempo de seguimiento.

---

## 📁 Estructura del proyecto

```text
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Consulta a Gemma 4, citas de fuente y creación de tickets con Resend
│   │   ├── contents/route.ts  # CRUD de syllabus y contenidos del curso en Neon Postgres
│   │   └── teachers/route.ts  # Login docente, aprobación Admin y resolución de tickets (PUT)
│   ├── globals.css            # Variables de tema claro/oscuro y paleta de colores de STYLES.md
│   ├── layout.tsx             # Layout raíz en español con tipografía Geist
│   └── page.tsx               # Interfaz completa: Bandeja de tickets, Base de conocimiento, Métricas, Chat estudiante y Admin
├── src/
│   ├── chatbot/ollama.ts      # Integración con Ollama (Gemma 4) y detección de fuente del syllabus
│   ├── email/resend.ts        # Envío de alertas por correo al profesor con Resend
│   └── knowledge/db.ts        # Esquema y consultas en Neon Lakebase Postgres
├── STYLES.md                  # Especificación de diseño de interfaz, colores y usabilidad
├── Modelfile                  # Definición del sistema para el modelo local en Ollama
├── neon.ts                    # Configuración de conexión con Neon
├── .env.example               # Plantilla de variables de entorno
└── README.md                  # Documentación general del proyecto
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas, especialmente durante **Hacktoberfest**! 🎃

1. Haz un fork del repositorio.
2. Crea una rama para tu mejora: `git checkout -b feature/mi-mejora`
3. Realiza tus cambios respetando los criterios de diseño y accesibilidad de [`STYLES.md`](./STYLES.md).
4. Haz commit de tus cambios: `git commit -m "feat: agrega mi mejora"`
5. Sube la rama: `git push origin feature/mi-mejora`
6. Abre un Pull Request.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
