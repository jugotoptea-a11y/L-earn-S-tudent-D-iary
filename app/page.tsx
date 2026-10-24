"use client";

import React, { useEffect, useState } from "react";

type RoleTab = "estudiante" | "docente" | "admin";
type TeacherStatus = "pending" | "approved" | "rejected";
type ContentCategory =
  | "Plataformas"
  | "Tareas"
  | "Notas"
  | "Información general";

interface Teacher {
  id: string;
  name: string;
  email: string;
  course: string;
  accessCode: string;
  status: TeacherStatus;
  createdAt: string;
}

interface ConnectedTeacherInfo {
  id: string;
  name: string;
  email: string;
  course: string;
  accessCode: string;
  contentsCount: number;
}

interface CourseContent {
  id: string;
  teacherId: string;
  teacherEmail: string;
  teacherName: string;
  category: ContentCategory;
  title: string;
  content: string;
  createdAt: string;
}

interface EscalationRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  studentEmail: string;
  question: string;
  emailSent: boolean;
  emailId?: string;
  emailError?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: "student" | "bot";
  text: string;
  answered?: boolean;
  escalatedTo?: string;
  emailSent?: boolean;
  emailId?: string;
  emailError?: string;
}

export default function HomePage() {
  const [activeRole, setActiveRole] = useState<RoleTab>("docente");

  // Global data from Neon Postgres
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Docente state
  const [docenteEmail, setDocenteEmail] = useState("");
  const [docenteName, setDocenteName] = useState("");
  const [docenteCourse, setDocenteCourse] = useState("");
  const [docenteCustomCode, setDocenteCustomCode] = useState("");
  const [loggedTeacher, setLoggedTeacher] = useState<Teacher | null>(null);
  const [docenteMsg, setDocenteMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Docente content upload state
  const [category, setCategory] = useState<ContentCategory>("Plataformas");
  const [contentTitle, setContentTitle] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [savingContent, setSavingContent] = useState(false);

  // Estudiante state (connects via teacher access code)
  const [studentCodeInput, setStudentCodeInput] = useState("");
  const [connectedTeacher, setConnectedTeacher] =
    useState<ConnectedTeacherInfo | null>(null);
  const [studentConnectError, setStudentConnectError] = useState("");
  const [connectingCode, setConnectingCode] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [askingGemma, setAskingGemma] = useState(false);

  async function fetchAllData(currentTeacherEmail?: string) {
    setLoadingData(true);
    try {
      const res = await fetch("/api/teachers", { cache: "no-store" });
      const data = await res.json();
      const allTeachers: Teacher[] = data.teachers || [];
      const allContents: CourseContent[] = data.contents || [];
      const allEscalations: EscalationRecord[] = data.escalations || [];

      setTeachers(allTeachers);
      setContents(allContents);
      setEscalations(allEscalations);

      const emailToSync =
        currentTeacherEmail?.toLowerCase() ||
        loggedTeacher?.email?.toLowerCase();
      if (emailToSync) {
        const updated =
          allTeachers.find((t) => t.email.toLowerCase() === emailToSync) ||
          null;
        setLoggedTeacher(updated);
      }

      if (connectedTeacher) {
        const refreshed = allTeachers.find(
          (t) => t.id === connectedTeacher.id && t.status === "approved"
        );
        if (refreshed) {
          setConnectedTeacher({
            id: refreshed.id,
            name: refreshed.name,
            email: refreshed.email,
            course: refreshed.course,
            accessCode: refreshed.accessCode,
            contentsCount: allContents.filter(
              (c) => c.teacherId === refreshed.id
            ).length,
          });
        }
      }
    } catch (err) {
      console.error("Error cargando datos desde Neon Postgres:", err);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/teachers", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setTeachers(data.teachers || []);
        setContents(data.contents || []);
        setEscalations(data.escalations || []);
      })
      .catch((err) => {
        console.error("Error cargando datos desde Neon Postgres:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // --- ADMIN ACTIONS ---
  async function handleUpdateTeacherStatus(
    teacherId: string,
    status: TeacherStatus
  ) {
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, status }),
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // --- DOCENTE ACTIONS ---
  async function handleDocenteLogin(e: React.FormEvent) {
    e.preventDefault();
    setDocenteMsg("");
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: docenteEmail,
          name: docenteName,
          course: docenteCourse,
          customCode: docenteCustomCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDocenteMsg(data.error || "Error al iniciar sesión.");
        return;
      }
      setLoggedTeacher(data.teacher);
      await fetchAllData(data.teacher.email);
    } catch {
      setDocenteMsg("Error de red al intentar iniciar sesión.");
    }
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (!contentTitle) {
      setContentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    setContentBody((prev) => (prev ? `${prev}\n\n${text}` : text));
  }

  async function handleAddContent(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedTeacher) return;
    setSavingContent(true);
    setDocenteMsg("");
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: loggedTeacher.id,
          category,
          title: contentTitle,
          content: contentBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDocenteMsg(data.error || "No se pudo guardar el contenido.");
      } else {
        setContentTitle("");
        setContentBody("");
        setDocenteMsg(
          "Información guardada en Neon Postgres y disponible para Gemma 4."
        );
        await fetchAllData(loggedTeacher.email);
      }
    } catch {
      setDocenteMsg("Error guardando contenido.");
    } finally {
      setSavingContent(false);
    }
  }

  async function handleDeleteContent(contentId: string) {
    if (!loggedTeacher) return;
    await fetch(
      `/api/contents?id=${encodeURIComponent(contentId)}&teacherId=${encodeURIComponent(loggedTeacher.id)}`,
      { method: "DELETE" }
    );
    await fetchAllData(loggedTeacher.email);
  }

  function handleCopyTeacherCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // --- ESTUDIANTE ACTIONS ---
  async function handleConnectByCode(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = studentCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setConnectingCode(true);
    setStudentConnectError("");

    try {
      const res = await fetch(
        `/api/teachers?code=${encodeURIComponent(cleanCode)}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok) {
        setConnectedTeacher(null);
        setStudentConnectError(
          data.error || "No se pudo conectar con ese código."
        );
      } else {
        setConnectedTeacher(data.teacher);
        setChatHistory([]);
      }
    } catch {
      setStudentConnectError("Error de conexión al validar el código.");
    } finally {
      setConnectingCode(false);
    }
  }

  async function handleSendQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !connectedTeacher) return;

    const currentQ = question.trim();
    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_u`,
      sender: "student",
      text: currentQ,
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuestion("");
    setAskingGemma(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: connectedTeacher.accessCode,
          studentName,
          studentEmail,
          question: currentQ,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setChatHistory((prev) => [
          ...prev,
          {
            id: `m_${Date.now()}_err`,
            sender: "bot",
            text: data.error || "Ocurrió un error al procesar tu consulta.",
            answered: false,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            id: `m_${Date.now()}_b`,
            sender: "bot",
            text: data.answer,
            answered: data.answered,
            escalatedTo: data.escalatedTo,
            emailSent: data.emailSent,
            emailId: data.emailId,
            emailError: data.emailError,
          },
        ]);
        await fetchAllData();
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}_neterr`,
          sender: "bot",
          text: "Error de conexión al consultar al chatbot.",
          answered: false,
        },
      ]);
    } finally {
      setAskingGemma(false);
    }
  }

  const myTeacherContents = loggedTeacher
    ? contents.filter((c) => c.teacherId === loggedTeacher.id)
    : [];
  const myTeacherEscalations = loggedTeacher
    ? escalations.filter((e) => e.teacherId === loggedTeacher.id)
    : [];

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header & Role Selector */}
        <header className="rounded border border-zinc-300 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Chatbot Estudiantil Open Source (Gemma 4 + Neon Postgres +
                Resend)
              </h1>
              <p className="text-sm text-zinc-600">
                Perfiles de Admin, Docente (carga de contenidos + código) y
                Estudiante.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveRole("admin");
                  fetchAllData();
                }}
                className={`rounded px-4 py-2 text-sm font-semibold border ${
                  activeRole === "admin"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                1. Perfil Admin (
                {teachers.filter((t) => t.status === "pending").length}{" "}
                pendientes)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole("docente");
                  fetchAllData();
                }}
                className={`rounded px-4 py-2 text-sm font-semibold border ${
                  activeRole === "docente"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                2. Perfil Docente
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole("estudiante");
                  fetchAllData();
                }}
                className={`rounded px-4 py-2 text-sm font-semibold border ${
                  activeRole === "estudiante"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                3. Perfil Estudiante
              </button>
            </div>
          </div>
        </header>

        {/* ===================== PERFIL ADMIN ===================== */}
        {activeRole === "admin" && (
          <section className="space-y-6">
            <div className="rounded border border-zinc-300 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">
                    Panel de Administrador — Aprobación de Login de Docentes
                  </h2>
                  <p className="text-sm text-zinc-600">
                    Acepta el login del docente para activar su código de
                    conexión y habilitarle el espacio de carga de información en
                    Neon Postgres.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchAllData()}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
                >
                  {loadingData ? "Actualizando..." : "Refrescar"}
                </button>
              </div>

              {teachers.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4">
                  Aún no hay docentes registrados. Ve a{" "}
                  <strong>2. Perfil Docente</strong> e ingresa con un correo.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="p-2.5 font-semibold">Docente</th>
                        <th className="p-2.5 font-semibold">Correo</th>
                        <th className="p-2.5 font-semibold">Curso</th>
                        <th className="p-2.5 font-semibold">
                          Código Estudiantes
                        </th>
                        <th className="p-2.5 font-semibold">Estado Login</th>
                        <th className="p-2.5 font-semibold">Acciones Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((t) => (
                        <tr key={t.id} className="border-b border-zinc-200">
                          <td className="p-2.5 font-medium">{t.name}</td>
                          <td className="p-2.5">{t.email}</td>
                          <td className="p-2.5">{t.course}</td>
                          <td className="p-2.5">
                            <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-900 border border-zinc-300">
                              {t.accessCode}
                            </code>
                          </td>
                          <td className="p-2.5">
                            {t.status === "pending" && (
                              <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                PENDIENTE
                              </span>
                            )}
                            {t.status === "approved" && (
                              <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                ACEPTADO
                              </span>
                            )}
                            {t.status === "rejected" && (
                              <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                RECHAZADO
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTeacherStatus(t.id, "approved")
                              }
                              disabled={t.status === "approved"}
                              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                            >
                              Aceptar Login
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTeacherStatus(t.id, "rejected")
                              }
                              disabled={t.status === "rejected"}
                              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                            >
                              Rechazar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded border border-zinc-300 bg-white p-5">
              <h3 className="text-base font-bold mb-2">
                Alertas Enviadas con Resend a Docentes (Cuando Gemma 4 responde
                NO_SE)
              </h3>
              {escalations.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No se han escalado consultas todavía.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {escalations.map((esc) => (
                    <li
                      key={esc.id}
                      className="rounded border border-zinc-200 p-3 bg-zinc-50"
                    >
                      <div>
                        <strong>Docente destino:</strong> {esc.teacherName} (
                        {esc.teacherEmail}) |{" "}
                        <strong>Estudiante:</strong> {esc.studentName} (
                        {esc.studentEmail})
                      </div>
                      <div className="mt-1">
                        <strong>Pregunta sin respuesta en contenidos:</strong>{" "}
                        {esc.question}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        Estado Resend:{" "}
                        {esc.emailSent
                          ? `Correo enviado exitosamente (ID: ${esc.emailId})`
                          : `Registrado en bandeja (${esc.emailError})`}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ===================== PERFIL DOCENTE ===================== */}
        {activeRole === "docente" && (
          <section className="space-y-6">
            {/* Paso 1: Login del Docente */}
            <div className="rounded border border-zinc-300 bg-white p-5">
              <h2 className="text-lg font-bold mb-1">
                Paso 1: Acceso Docente (Login por Correo)
              </h2>
              <p className="text-sm text-zinc-600 mb-4">
                Ingresa con tu correo electrónico. Cuando el{" "}
                <strong>Admin</strong> acepte tu login, tendrás tu{" "}
                <strong>código único</strong> para compartir con los estudiantes
                y se habilitará el espacio inferior para cargar la información
                de tu curso.
              </p>

              <form
                onSubmit={handleDocenteLogin}
                className="grid grid-cols-1 gap-3 sm:grid-cols-5"
              >
                <input
                  type="email"
                  required
                  placeholder="Correo del docente *"
                  value={docenteEmail}
                  onChange={(e) => setDocenteEmail(e.target.value)}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Nombre del docente"
                  value={docenteName}
                  onChange={(e) => setDocenteName(e.target.value)}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Materia / Curso"
                  value={docenteCourse}
                  onChange={(e) => setDocenteCourse(e.target.value)}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Código opcional (ej. MAT-101)"
                  value={docenteCustomCode}
                  onChange={(e) =>
                    setDocenteCustomCode(e.target.value.toUpperCase())
                  }
                  className="rounded border border-zinc-300 px-3 py-2 text-sm font-mono uppercase"
                />
                <button
                  type="submit"
                  className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ingresar / Solicitar
                </button>
              </form>

              {docenteMsg && (
                <p className="mt-3 text-sm font-medium text-blue-700">
                  {docenteMsg}
                </p>
              )}

              {loggedTeacher && (
                <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm">
                        Docente: <strong>{loggedTeacher.name}</strong> (
                        {loggedTeacher.email}) — Curso:{" "}
                        <strong>{loggedTeacher.course}</strong>
                      </p>
                      <p className="text-sm mt-1">
                        Estado de login:{" "}
                        {loggedTeacher.status === "pending" && (
                          <span className="font-bold text-amber-700">
                            PENDIENTE DE APROBACIÓN POR EL ADMIN
                          </span>
                        )}
                        {loggedTeacher.status === "approved" && (
                          <span className="font-bold text-emerald-700">
                            ACEPTADO POR EL ADMIN
                          </span>
                        )}
                        {loggedTeacher.status === "rejected" && (
                          <span className="font-bold text-red-700">
                            RECHAZADO POR EL ADMIN
                          </span>
                        )}
                      </p>
                    </div>

                    {loggedTeacher.status === "approved" && (
                      <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-3 py-2">
                        <div className="text-xs text-emerald-950">
                          Código para tus estudiantes:{" "}
                          <strong className="font-mono text-base ml-1">
                            {loggedTeacher.accessCode}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyTeacherCode(loggedTeacher.accessCode)
                          }
                          className="rounded bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                        >
                          {copiedCode ? "¡Copiado!" : "Copiar código"}
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fetchAllData(loggedTeacher.email)}
                        className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
                      >
                        Actualizar estado
                      </button>
                      {loggedTeacher.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => setActiveRole("admin")}
                          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          Ir a Perfil Admin para aceptar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Paso 2: Espacio de Carga de Información del Docente */}
            <div className="rounded border border-zinc-300 bg-white p-5">
              <h2 className="text-lg font-bold mb-1">
                Paso 2: Espacio del Docente para Cargar Información del Curso
              </h2>
              <p className="text-sm text-zinc-600 mb-4">
                Aquí cargas la información académica (plataformas, tareas, notas
                e información general) en <strong>Neon Postgres</strong> para
                que <strong>Gemma 4</strong> responda las consultas de tus
                estudiantes.
              </p>

              {!loggedTeacher ? (
                <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                  Primero ingresa tu correo en el <strong>Paso 1</strong> arriba
                  para identificar tu cuenta docente.
                </div>
              ) : loggedTeacher.status !== "approved" ? (
                <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  Tu cuenta (<strong>{loggedTeacher.email}</strong>) está en
                  estado <strong>{loggedTeacher.status.toUpperCase()}</strong>.
                  Un Administrador debe aceptar tu login en{" "}
                  <strong>1. Perfil Admin</strong> para habilitar la carga de
                  información.
                </div>
              ) : (
                <form onSubmit={handleAddContent} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Categoría de la información
                      </label>
                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as ContentCategory)
                        }
                        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="Plataformas">Plataformas</option>
                        <option value="Tareas">Tareas</option>
                        <option value="Notas">Notas</option>
                        <option value="Información general">
                          Información general
                        </option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">
                        Título del tema o documento
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Entrega Taller 3, Cálculo de nota final, Uso de Moodle..."
                        value={contentTitle}
                        onChange={(e) => setContentTitle(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold">
                        Información / Contenido detallado para Gemma 4
                      </label>
                      <label className="cursor-pointer text-xs font-semibold text-blue-700 hover:underline">
                        + O subir archivo de texto (.txt / .md / .csv)
                        <input
                          type="file"
                          accept=".txt,.md,.csv,.json"
                          onChange={handleUploadFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      required
                      rows={5}
                      placeholder="Escribe o pega aquí toda la información del curso: fechas de entrega, rúbricas, notas, enlaces de plataforma, horarios de atención, etc."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full rounded border border-zinc-300 p-3 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingContent}
                    className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {savingContent
                      ? "Guardando en Neon Postgres..."
                      : "Cargar Información en Base de Conocimiento (Neon)"}
                  </button>
                </form>
              )}
            </div>

            {loggedTeacher && loggedTeacher.status === "approved" && (
              <>
                {/* Lista de contenidos del docente */}
                <div className="rounded border border-zinc-300 bg-white p-5">
                  <h3 className="text-base font-bold mb-3">
                    Información Cargada en mi Curso ({myTeacherContents.length})
                  </h3>
                  {myTeacherContents.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Todavía no has cargado información para tus estudiantes.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {myTeacherContents.map((item) => (
                        <li
                          key={item.id}
                          className="rounded border border-zinc-200 p-3 bg-zinc-50 flex items-start justify-between gap-4"
                        >
                          <div>
                            <span className="inline-block rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-800 mr-2">
                              {item.category}
                            </span>
                            <strong className="text-sm">{item.title}</strong>
                            <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">
                              {item.content}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteContent(item.id)}
                            className="text-xs font-semibold text-red-600 hover:underline shrink-0"
                          >
                            Eliminar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Consultas que Gemma 4 no supo y escaló por correo a este docente */}
                <div className="rounded border border-zinc-300 bg-white p-5">
                  <h3 className="text-base font-bold mb-2">
                    Alertas de Estudiantes Escaladas a mi Correo (
                    {loggedTeacher.email}) ({myTeacherEscalations.length})
                  </h3>
                  {myTeacherEscalations.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Ninguna consulta ha requerido ser escalada a tu correo
                      todavía.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {myTeacherEscalations.map((esc) => (
                        <li
                          key={esc.id}
                          className="rounded border border-amber-200 bg-amber-50 p-3"
                        >
                          <div>
                            <strong>Estudiante:</strong> {esc.studentName} (
                            <a
                              href={`mailto:${esc.studentEmail}?subject=Respuesta a tu consulta de ${loggedTeacher.course}`}
                              className="underline text-blue-700"
                            >
                              {esc.studentEmail}
                            </a>
                            )
                          </div>
                          <div className="mt-1">
                            <strong>Pregunta:</strong> {esc.question}
                          </div>
                          <div className="mt-1 text-xs text-zinc-600">
                            Resend:{" "}
                            {esc.emailSent
                              ? `Enviado a ${esc.teacherEmail} (ID: ${esc.emailId})`
                              : esc.emailError}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* ===================== PERFIL ESTUDIANTE ===================== */}
        {activeRole === "estudiante" && (
          <section className="space-y-6">
            <div className="rounded border border-zinc-300 bg-white p-5">
              <h2 className="text-lg font-bold mb-1">
                Módulo del Estudiante — Conexión por Código de Docente
              </h2>
              <p className="text-sm text-zinc-600 mb-4">
                Ingresa el <strong>código de acceso</strong> compartido por tu
                docente para conectarte a su chatbot de <strong>Gemma 4</strong>
                . Si Gemma 4 no puede responder con base en los contenidos del
                curso, enviará automáticamente una alerta con{" "}
                <strong>Resend</strong> al correo de tu docente.
              </p>

              {/* Paso 1: Conectarse con el código del docente */}
              <form
                onSubmit={handleConnectByCode}
                className="flex flex-col gap-3 sm:flex-row sm:items-end mb-4 pb-4 border-b border-zinc-200"
              >
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1">
                    Código del Docente / Curso
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: SOFT-101"
                    value={studentCodeInput}
                    onChange={(e) =>
                      setStudentCodeInput(e.target.value.toUpperCase())
                    }
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-sm font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={connectingCode}
                  className="rounded bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {connectingCode
                    ? "Verificando código..."
                    : "Conectar al Chatbot del Docente"}
                </button>
              </form>

              {studentConnectError && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                  {studentConnectError}
                </div>
              )}

              {connectedTeacher && (
                <>
                  <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      Conectado al chatbot de:{" "}
                      <strong>{connectedTeacher.name}</strong> — Curso:{" "}
                      <strong>{connectedTeacher.course}</strong> (Código:{" "}
                      <code className="font-mono font-bold">
                        {connectedTeacher.accessCode}
                      </code>
                      )
                    </div>
                    <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded border border-emerald-200">
                      {connectedTeacher.contentsCount} contenidos cargados en
                      Neon
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Tu Nombre
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Ana Pérez"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Tu Correo (para que el docente te responda si Gemma 4 no
                        sabe)
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="estudiante@institucion.edu"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Ventana de Chat */}
                  <div className="rounded border border-zinc-300 bg-zinc-50 p-4 h-96 overflow-y-auto space-y-3 mb-4">
                    {chatHistory.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center mt-32">
                        Haz tu consulta para{" "}
                        <strong>{connectedTeacher.course}</strong> (
                        {connectedTeacher.name}). Gemma 4 responderá con base en
                        los contenidos cargados en Neon Postgres.
                      </p>
                    ) : (
                      chatHistory.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col ${
                            m.sender === "student"
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-xl rounded p-3 text-sm ${
                              m.sender === "student"
                                ? "bg-zinc-900 text-white"
                                : m.answered
                                  ? "bg-white border border-zinc-300 text-zinc-900"
                                  : "bg-amber-50 border border-amber-300 text-amber-950"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.text}</p>

                            {m.sender === "bot" && m.escalatedTo && (
                              <div className="mt-2 border-t border-amber-200 pt-1.5 text-xs">
                                <strong>Alerta Resend al docente:</strong>{" "}
                                {m.escalatedTo}{" "}
                                {m.emailSent
                                  ? `(Correo enviado vía Resend - ID: ${m.emailId})`
                                  : `(${m.emailError || "Registrado en bandeja del docente"})`}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {askingGemma && (
                      <div className="text-xs text-zinc-500 italic">
                        Consultando a Gemma 4 (Ollama) con los contenidos de{" "}
                        {connectedTeacher.name}...
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendQuestion} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Escribe tu pregunta para Gemma 4..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={askingGemma}
                      className="rounded bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Preguntar a Gemma 4
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
