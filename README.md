# 🤖 Chatbot Estudiantil con IA

> Proyecto Open Source desarrollado para **Hacktoberfest** 🎃

Asistente virtual basado en inteligencia artificial (**Gemma 4 con Ollama**) conectado a **Neon Lakebase Postgres** que responde las dudas de los estudiantes sobre plataformas, tareas, notas e información académica. Cuando el chatbot no tiene la respuesta en los contenidos cargados por el docente, envía automáticamente un correo al profesor usando [Resend](https://resend.com), para que sea él quien responda personalmente al estudiante.

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Perfiles y Módulos](#-perfiles-y-módulos)
- [Flujo de funcionamiento](#-flujo-de-funcionamiento)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Uso](#-uso)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 📖 Descripción

Los estudiantes suelen tener preguntas repetidas sobre cómo usar las plataformas de la institución, fechas de entrega, calificaciones o información general del curso. Este chatbot centraliza esas respuestas y está disponible en todo momento.

Si una pregunta queda fuera de lo que el chatbot conoce según los contenidos cargados por el docente, no deja al estudiante sin respuesta: **escala la consulta al profesor por correo electrónico**, y el profesor responde de forma personal.

---

## 🧩 Perfiles y Módulos

### 1. Perfil Administrador
- Revisa y acepta (o rechaza) las solicitudes de ingreso (login) de los docentes.
- Supervisa el historial de alertas enviadas por correo a los docentes.

### 2. Perfil Docente
- Inicia sesión con su correo electrónico.
- Una vez aceptado por el Administrador, recibe un **código único de conexión** (por ejemplo `SOFT-101`) para compartir con sus estudiantes y accede al **Espacio de Carga de Información del Curso** (almacenado en **Neon Postgres**).

### 3. Perfil Estudiante
- Se conecta al chatbot de su docente ingresando el **código de acceso** del curso.
- Realiza consultas a **Gemma 4** sobre:

| Categoría | Ejemplos de preguntas |
|---|---|
| **Plataformas** | "¿Cómo subo un archivo a la plataforma?", "¿Dónde encuentro el aula virtual?" |
| **Tareas** | "¿Cuándo se entrega el taller 3?", "¿Qué hay que hacer en la tarea de esta semana?" |
| **Notas** | "¿Cuál es mi nota del parcial?", "¿Cómo se calcula la nota final?" |
| **Información general** | "¿Cuál es el horario de clase?", "¿Cómo contacto al profesor?" |

Cuando el chatbot no encuentra la respuesta en los contenidos cargados por ese docente:
1. Envía automáticamente un correo al docente en cuestión mediante **Resend**, con la pregunta del estudiante y sus datos de contacto (`replyTo`).
2. El docente recibe el correo y **responde personalmente** al estudiante.

---

## 🔄 Flujo de funcionamiento

```mermaid
flowchart TD
    D[Docente ingresa con su correo] --> P{¿Admin acepta el login?}
    P -- Sí --> K[Docente recibe código único y carga contenidos en Neon Postgres]
    K --> A[Estudiante se conecta con el código y hace una pregunta]
    A --> B{¿Gemma 4 tiene la información en los contenidos?}
    B -- Sí --> C[Gemma 4 responde al estudiante]
    B -- "No (NO_SE)" --> E[Se envía un correo al docente con Resend]
    E --> F[El docente responde personalmente al estudiante]
```

---

## 🛠️ Tecnologías

- **[Gemma 4](https://ollama.com/library/gemma4)**: modelo de lenguaje de Google que entiende y responde las preguntas de los estudiantes.
- **[Ollama](https://ollama.com)**: ejecuta el modelo de forma local, sin depender de una API de pago.
- **[Neon Lakebase Postgres](https://neon.com)**: base de datos Postgres serverless para almacenar docentes, códigos de acceso, contenidos del curso e historial de escalamientos.
- **[Resend](https://resend.com)**: API para el envío automático de correos al profesor.
- **Next.js (App Router)**: interfaz y API Route Handlers para los perfiles de Admin, Docente y Estudiante.

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

Cuando el modelo responde `NO_SE`, el sistema activa el envío del correo al profesor.

---

## ⚙️ Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/<repositorio>.git
cd <repositorio>

# 2. Instalar Ollama (https://ollama.com/download) y descargar el modelo
ollama pull gemma4

# 3. Crear el modelo del chatbot con el Modelfile
ollama create chatbot-estudiantil -f Modelfile

# 4. Instalar dependencias
npm install

# 5. Configurar las variables de entorno
cp .env.example .env
```

---

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto a partir de `.env.example`:

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
ollama serve       # inicia Ollama (si no está corriendo)
npm run dev        # inicia la aplicación en http://localhost:3000
```

1. Abre `http://localhost:3000` en el navegador.
2. En **2. Perfil Docente**, solicita el ingreso con tu correo electrónico.
3. En **1. Perfil Admin**, acepta el login del docente.
4. En **2. Perfil Docente**, copia el código único de acceso y carga los contenidos del curso en el **Paso 2**.
5. En **3. Perfil Estudiante**, conéctate con el código del docente y realiza tus preguntas a **Gemma 4**.

---

## 📁 Estructura del proyecto

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Consulta a Gemma 4 y escalamiento por Resend
│   │   ├── contents/route.ts  # CRUD de contenidos del docente en Neon Postgres
│   │   └── teachers/route.ts  # Login de docentes, aprobación Admin y validación por código
│   ├── layout.tsx
│   └── page.tsx               # Interfaz de los perfiles Admin, Docente y Estudiante
├── src/
│   ├── chatbot/ollama.ts      # Conexión con Ollama (Gemma 4)
│   ├── email/resend.ts        # Integración de alertas por correo con Resend
│   └── knowledge/db.ts        # Conexión y esquema en Neon Lakebase Postgres
├── Modelfile                  # Definición del modelo en Ollama
├── neon.ts                    # Configuración de infraestructura de Neon
├── .env.example
├── package.json
└── README.md
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas, especialmente durante Hacktoberfest! 🎃

1. Haz un fork del repositorio.
2. Crea una rama para tu cambio: `git checkout -b feature/mi-mejora`
3. Haz commit de tus cambios: `git commit -m "Agrega mi mejora"`
4. Sube la rama: `git push origin feature/mi-mejora`
5. Abre un Pull Request.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
