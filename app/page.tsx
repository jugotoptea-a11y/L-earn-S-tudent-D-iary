"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type AppView = "profesor" | "estudiante" | "admin";
type ProfesorNav = "bandeja" | "conocimiento" | "metricas";
type TeacherStatus = "pending" | "approved" | "rejected";
type TicketStatus = "urgent" | "pending" | "resolved";
type TicketTimelineStep = "enviado" | "en_revision" | "respondido";
type ContentCategory =
  | "Plataformas"
  | "Tareas"
  | "Notas"
  | "Información general";

interface SyllabusSection {
  id: string;
  section: string;
  title: string;
  snippet: string;
  fileType?: "PDF" | "CSV" | "TXT" | "MD" | "JSON" | "SYLLABUS";
}

interface SubjectConfig {
  id: string;
  name: string;
  accentHex: string;
  teacherName: string;
  code: string;
  syllabusSections: SyllabusSection[];
  deadlines: {
    id: string;
    title: string;
    date: string;
    critical?: boolean;
  }[];
  materials: {
    id: string;
    title: string;
    type: string;
  }[];
}

const SUBJECTS: SubjectConfig[] = [
  {
    id: "calculo-ii",
    name: "Cálculo II",
    accentHex: "#4F46E5",
    teacherName: "Prof. Martín Gómez",
    code: "CALC-202",
    syllabusSections: [
      {
        id: "syl-1",
        section: "Syllabus · Sección 2.1",
        title: "Temario del Segundo Parcial",
        snippet:
          "El segundo parcial evalúa técnicas de integración (por partes, fracciones parciales), integrales impropias y aplicaciones de la integral definida (áreas y volúmenes de revolución).",
        fileType: "SYLLABUS",
      },
      {
        id: "syl-2",
        section: "Syllabus · Sección 3.2",
        title: "Calendario de Evaluaciones y Ponderación",
        snippet:
          "Primer parcial: 25% · Segundo parcial: 25% (viernes 14 de noviembre, 10:00 a.m., Aula Magna) · Talleres prácticos (4 entregas): 20% · Examen final acumulativo: 30%.",
        fileType: "SYLLABUS",
      },
      {
        id: "syl-3",
        section: "Syllabus · Sección 4.1",
        title: "Entrega de Talleres",
        snippet:
          "Todos los talleres se entregan en formato PDF a través de la plataforma del curso antes de las 23:59 del día indicado. El Taller 3 vence este viernes.",
        fileType: "SYLLABUS",
      },
    ],
    deadlines: [
      {
        id: "dl-1",
        title: "Segundo Parcial Presencial",
        date: "En 48 horas · Viernes 10:00",
        critical: true,
      },
      {
        id: "dl-2",
        title: "Entrega Taller 3 (Integrales impropias)",
        date: "Viernes · 23:59",
      },
      {
        id: "dl-3",
        title: "Quiz de lectura: Series de Taylor",
        date: "Próximo miércoles · 18:00",
      },
    ],
    materials: [
      { id: "m-1", title: "Guía de ejercicios resueltos — Unidad 3", type: "PDF" },
      { id: "m-2", title: "Formulario oficial de integrales", type: "PDF" },
      { id: "m-3", title: "Plantilla LaTeX para entrega de talleres", type: "ZIP" },
    ],
  },
  {
    id: "fisica-i",
    name: "Física I",
    accentHex: "#0EA5E9",
    teacherName: "Prof. Laura Méndez",
    code: "FISI-101",
    syllabusSections: [
      {
        id: "fis-1",
        section: "Syllabus · Sección 1.4",
        title: "Criterios de Calificación y Laboratorio",
        snippet:
          "Parciales teóricos: 50% · Informes de laboratorio quincenales: 30% · Proyecto experimental final: 20%. Es requisito aprobar el componente práctico.",
        fileType: "SYLLABUS",
      },
      {
        id: "fis-2",
        section: "Syllabus · Sección 2.3",
        title: "Próximo Examen de Cinemática y Dinámica",
        snippet:
          "El examen abarca leyes de Newton, rozamiento, trabajo y conservación de la energía mecánica. Se permite formulario de una carilla escrito a mano.",
        fileType: "SYLLABUS",
      },
    ],
    deadlines: [
      {
        id: "fdl-1",
        title: "Informe Laboratorio 4: Conservación de Energía",
        date: "Mañana · 23:59",
        critical: true,
      },
      {
        id: "fdl-2",
        title: "Segundo Parcial de Dinámica",
        date: "Jueves 20 nov · 08:00",
      },
    ],
    materials: [
      { id: "fm-1", title: "Guía de incertidumbre y propagación de errores", type: "PDF" },
      { id: "fm-2", title: "Datos experimentales — Péndulo balístico", type: "CSV" },
    ],
  },
  {
    id: "programacion",
    name: "Programación",
    accentHex: "#A855F7",
    teacherName: "Prof. Andrés Silva",
    code: "PROG-105",
    syllabusSections: [
      {
        id: "prg-1",
        section: "Syllabus · Sección 3.1",
        title: "Evaluación Continua y Entregas en Git",
        snippet:
          "Laboratorios semanales automatizados: 35% · Parcial práctico en sala: 30% · Proyecto final en equipo: 35%. Todas las entregas deben compilar sin errores.",
        fileType: "SYLLABUS",
      },
      {
        id: "prg-2",
        section: "Syllabus · Sección 3.4",
        title: "Contenido del Parcial Práctico",
        snippet:
          "Recursividad, estructuras de datos lineales (listas enlazadas, pilas y colas) y análisis básico de complejidad algorítmica O(n).",
        fileType: "SYLLABUS",
      },
    ],
    deadlines: [
      {
        id: "pdl-1",
        title: "Entrega Hito 2 del Proyecto en GitHub",
        date: "Hoy · 23:59",
        critical: true,
      },
      {
        id: "pdl-2",
        title: "Parcial Práctico en Laboratorio",
        date: "Lunes 17 nov · 14:00",
      },
    ],
    materials: [
      { id: "pm-1", title: "Casos de prueba públicos — Taller Recursión", type: "JSON" },
      { id: "pm-2", title: "Guía de estilo y buenas prácticas", type: "MD" },
    ],
  },
];

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
  status?: TicketStatus;
  teacherAnswer?: string;
  addedToKb?: boolean;
  createdAt: string;
}

interface GroupedTicket {
  id: string;
  course: string;
  question: string;
  status: TicketStatus;
  statusLabel: string;
  metaLabel: string;
  similarCount?: number;
  assistantContext: string;
  teacherAnswer?: string;
  addedToKb: boolean;
  escalationIds: string[];
  studentEmails: string[];
}

interface StudentTicketTracker {
  id: string;
  course: string;
  question: string;
  context: string;
  step: TicketTimelineStep;
  teacherAnswer?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: "student" | "bot" | "professor";
  text: string;
  answered?: boolean;
  sourceLabel?: string;
  sourceSnippet?: string;
  confidence?: "Basada en el syllabus" | "Respuesta inferida";
  feedback?: "up" | "down";
  isTicketDraft?: boolean;
  draftQuestion?: string;
  draftContext?: string;
  ticketSent?: boolean;
  ticketId?: string;
  escalatedTo?: string;
  emailSent?: boolean;
  emailId?: string;
  emailError?: string;
}

interface FileAnalysisReport {
  usedGemma: boolean;
  modelName: string;
  summary: string;
  keyFindings: string[];
  suggestedQuestions: string[];
  perFileHighlights: {
    fileName: string;
    fileType: string;
    charCount: number;
    preview: string;
  }[];
}

const INITIAL_MOCKUP_TICKETS: GroupedTicket[] = [
  {
    id: "mock-ticket-1",
    course: "Cálculo II",
    question: "¿Se permite calculadora gráfica en el segundo parcial?",
    status: "urgent",
    statusLabel: "Urgente · parcial cerca",
    metaLabel: "Agrupa N preguntas similares",
    similarCount: 4,
    assistantContext:
      "Contexto del asistente: la política de calculadoras no aparece en el syllabus ni en el material cargado.",
    addedToKb: true,
    escalationIds: [],
    studentEmails: [],
  },
  {
    id: "mock-ticket-2",
    course: "Cálculo II",
    question: "¿Hay tutoría antes del examen final?",
    status: "pending",
    statusLabel: "Pendiente",
    metaLabel: "Agrupa N preguntas similares",
    similarCount: 3,
    assistantContext:
      "Contexto del asistente: las fechas de tutorías adicionales previas al examen final no figuran en el calendario del curso.",
    addedToKb: true,
    escalationIds: [],
    studentEmails: [],
  },
  {
    id: "mock-ticket-3",
    course: "Cálculo II",
    question: "¿Cómo se entrega el taller 3?",
    status: "resolved",
    statusLabel: "Resuelto",
    metaLabel: "Guardado en la base de conocimiento",
    similarCount: 5,
    assistantContext:
      "Contexto del asistente: esta duda fue respondida por el profesor y añadida a la base de conocimiento para futuras consultas.",
    teacherAnswer:
      "El taller 3 se entrega únicamente en formato PDF mediante la plataforma del curso hasta el viernes a las 23:59. Recuerden incluir el procedimiento completo.",
    addedToKb: true,
    escalationIds: [],
    studentEmails: [],
  },
];

export default function HomePage() {
  // Navigation & Theme
  const [appView, setAppView] = useState<AppView>("profesor");
  const [profesorNav, setProfesorNav] = useState<ProfesorNav>("bandeja");
  const [darkMode, setDarkMode] = useState(false);

  const seqRef = useRef(1);
  function makeId(prefix: string) {
    seqRef.current += 1;
    return `${prefix}-${seqRef.current}`;
  }

  // Selected subject for accent color & context
  const [selectedSubjectId, setSelectedSubjectId] =
    useState<string>("calculo-ii");
  const currentSubject = useMemo(
    () =>
      SUBJECTS.find((s) => s.id === selectedSubjectId) || SUBJECTS[0],
    [selectedSubjectId]
  );

  // Uploaded & AI-analyzed documents per subject (supports multiple PDFs, CSVs, TXTs)
  const [uploadedSectionsBySubject, setUploadedSectionsBySubject] = useState<
    Record<string, SyllabusSection[]>
  >({
    "calculo-ii": [],
    "fisica-i": [],
    programacion: [],
  });

  // Multi-file queue & AI analysis state
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  const [analyzingFiles, setAnalyzingFiles] = useState(false);
  const [aiAnalysisReport, setAiAnalysisReport] =
    useState<FileAnalysisReport | null>(null);
  const [fileUploadError, setFileUploadError] = useState("");

  // Database state from Neon Postgres
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Professor Tickets state (starts with the exact mockup tickets from reference image)
  const [localTickets, setLocalTickets] = useState<GroupedTicket[]>(
    INITIAL_MOCKUP_TICKETS
  );
  const [selectedTicketId, setSelectedTicketId] =
    useState<string>("mock-ticket-1");
  const [replyText, setReplyText] = useState<string>("");
  const [addToKbChecked, setAddToKbChecked] = useState<boolean>(true);
  const [replyFeedbackMsg, setReplyFeedbackMsg] = useState<string>("");
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  // Docente Login & Manual Fragment Upload state
  const [docenteEmail, setDocenteEmail] = useState("");
  const [docenteName, setDocenteName] = useState("");
  const [docenteCourse, setDocenteCourse] = useState("");
  const [docenteCustomCode, setDocenteCustomCode] = useState("");
  const [loggedTeacher, setLoggedTeacher] = useState<Teacher | null>(null);
  const [docenteMsg, setDocenteMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const [category, setCategory] = useState<ContentCategory>(
    "Información general"
  );
  const [contentTitle, setContentTitle] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [savingContent, setSavingContent] = useState(false);

  // Student View state
  const [studentSidebarOpen, setStudentSidebarOpen] = useState<boolean>(true);
  const [expandedSourceMsgId, setExpandedSourceMsgId] = useState<string | null>(
    null
  );
  const [studentCodeInput, setStudentCodeInput] = useState("");
  const [connectedTeacher, setConnectedTeacher] =
    useState<ConnectedTeacherInfo | null>(null);
  const [studentConnectError, setStudentConnectError] = useState("");
  const [connectingCode, setConnectingCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const [studentName, setStudentName] = useState("Ana Pérez");
  const [studentEmail, setStudentEmail] = useState("ana.perez@universidad.edu");
  const [question, setQuestion] = useState("");
  const [askingGemma, setAskingGemma] = useState(false);

  // Student Chat messages per subject + Ticket timeline tracker
  const [chatBySubject, setChatBySubject] = useState<
    Record<string, ChatMessage[]>
  >({
    "calculo-ii": [
      {
        id: "init-q-1",
        sender: "student",
        text: "¿Cuándo es el próximo parcial y qué porcentaje vale?",
      },
      {
        id: "init-a-1",
        sender: "bot",
        text: "El segundo parcial de Cálculo II es el viernes 14 de noviembre a las 10:00 a.m. en el Aula Magna y tiene un valor del 25% de la nota final.",
        answered: true,
        sourceLabel: "Syllabus · Sección 3.2",
        sourceSnippet:
          "Primer parcial: 25% · Segundo parcial: 25% (viernes 14 de noviembre, 10:00 a.m., Aula Magna) · Talleres prácticos (4 entregas): 20% · Examen final acumulativo: 30%.",
        confidence: "Basada en el syllabus",
      },
    ],
    "fisica-i": [],
    programacion: [],
  });

  const [studentTickets, setStudentTickets] = useState<StudentTicketTracker[]>([
    {
      id: "st-demo-1",
      course: "Cálculo II",
      question: "¿Se permite calculadora gráfica en el segundo parcial?",
      context:
        "Consultado en el chat de Cálculo II · No figura política de calculadoras en el syllabus.",
      step: "en_revision",
      createdAt: "Hace 15 min",
    },
  ]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Combined syllabus + uploaded PDF/CSV/TXT sections for the active subject
  const activeSubjectSections = useMemo(() => {
    const uploaded = uploadedSectionsBySubject[selectedSubjectId] || [];
    return [...uploaded, ...currentSubject.syllabusSections];
  }, [uploadedSectionsBySubject, selectedSubjectId, currentSubject]);

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

  // Merge Neon Postgres escalations with the reference mockup tickets grouped by similar question
  const combinedTickets = useMemo(() => {
    const relevantEscalations = loggedTeacher
      ? escalations.filter((e) => e.teacherId === loggedTeacher.id)
      : escalations;

    const groupedMap = new Map<string, GroupedTicket>();

    for (const esc of relevantEscalations) {
      const normKey = esc.question.trim().toLowerCase();
      const existing = groupedMap.get(normKey);
      if (existing) {
        existing.similarCount = (existing.similarCount || 1) + 1;
        existing.escalationIds.push(esc.id);
        if (!existing.studentEmails.includes(esc.studentEmail)) {
          existing.studentEmails.push(esc.studentEmail);
        }
        if (esc.status === "resolved") {
          existing.status = "resolved";
          existing.statusLabel = "Resuelto";
          existing.metaLabel = esc.addedToKb
            ? "Guardado en la base de conocimiento"
            : "Respondido por el docente";
          existing.teacherAnswer = esc.teacherAnswer;
        }
      } else {
        const isUrgent =
          esc.status === "urgent" ||
          /parcial|examen|entrega|hoy|mañana|urgente/i.test(esc.question);
        const status: TicketStatus =
          esc.status === "resolved"
            ? "resolved"
            : isUrgent
              ? "urgent"
              : "pending";
        groupedMap.set(normKey, {
          id: `db-${esc.id}`,
          course: loggedTeacher?.course || currentSubject.name,
          question: esc.question,
          status,
          statusLabel:
            status === "urgent"
              ? "Urgente · parcial cerca"
              : status === "resolved"
                ? "Resuelto"
                : "Pendiente",
          metaLabel:
            status === "resolved"
              ? "Guardado en la base de conocimiento"
              : "Agrupa N preguntas similares",
          similarCount: 1,
          assistantContext: `Contexto del asistente: consulta de ${esc.studentName} (${esc.studentEmail}). No aparece en el syllabus ni en el material cargado.`,
          teacherAnswer: esc.teacherAnswer,
          addedToKb: esc.addedToKb ?? true,
          escalationIds: [esc.id],
          studentEmails: [esc.studentEmail],
        });
      }
    }

    const dbGrouped = Array.from(groupedMap.values());
    const orderWeight: Record<TicketStatus, number> = {
      urgent: 0,
      pending: 1,
      resolved: 2,
    };

    const merged = [...localTickets, ...dbGrouped].sort(
      (a, b) => orderWeight[a.status] - orderWeight[b.status]
    );
    return merged;
  }, [escalations, localTickets, loggedTeacher, currentSubject.name]);

  const selectedTicket = useMemo(
    () =>
      combinedTickets.find((t) => t.id === selectedTicketId) ||
      combinedTickets[0],
    [combinedTickets, selectedTicketId]
  );

  function handleSelectTicket(ticket: GroupedTicket) {
    setSelectedTicketId(ticket.id);
    setReplyText(ticket.teacherAnswer || "");
    setAddToKbChecked(ticket.addedToKb);
    setReplyFeedbackMsg("");
  }

  async function handleReplyToStudents(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setSendingReply(true);
    setReplyFeedbackMsg("");
    const cleanReply = replyText.trim();

    try {
      if (selectedTicket.escalationIds.length > 0 || loggedTeacher) {
        await fetch("/api/teachers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escalationIds: selectedTicket.escalationIds,
            teacherId: loggedTeacher?.id,
            question: selectedTicket.question,
            answer: cleanReply,
            addToKb: addToKbChecked,
          }),
        });
        await fetchAllData(loggedTeacher?.email);
      }

      setLocalTickets((prev) =>
        prev.map((item) =>
          item.id === selectedTicket.id
            ? {
                ...item,
                status: "resolved",
                statusLabel: "Resuelto",
                metaLabel: addToKbChecked
                  ? "Guardado en la base de conocimiento"
                  : "Respondido a los estudiantes",
                teacherAnswer: cleanReply,
                addedToKb: addToKbChecked,
              }
            : item
        )
      );

      if (addToKbChecked) {
        const kbSecId = makeId("kb-ans");
        setUploadedSectionsBySubject((prev) => ({
          ...prev,
          [selectedSubjectId]: [
            {
              id: kbSecId,
              section: "Base de conocimiento · Respuesta del profesor",
              title: selectedTicket.question,
              snippet: cleanReply,
              fileType: "SYLLABUS",
            },
            ...(prev[selectedSubjectId] || []),
          ],
        }));
      }

      setStudentTickets((prev) =>
        prev.map((st) =>
          st.question.toLowerCase().trim() ===
          selectedTicket.question.toLowerCase().trim()
            ? {
                ...st,
                step: "respondido",
                teacherAnswer: cleanReply,
              }
            : st
        )
      );

      const replyMsgId = makeId("prof-reply");
      setChatBySubject((prev) => {
        const currentList = prev[selectedSubjectId] || [];
        return {
          ...prev,
          [selectedSubjectId]: [
            ...currentList,
            {
              id: replyMsgId,
              sender: "professor",
              text: cleanReply,
              sourceLabel: `Respuesta del profesor · ${
                loggedTeacher?.name || currentSubject.teacherName
              }`,
            },
          ],
        };
      });

      setReplyFeedbackMsg(
        addToKbChecked
          ? "Respuesta enviada a los estudiantes y añadida a la base de conocimiento."
          : "Respuesta enviada a todos los estudiantes."
      );
    } catch {
      setReplyFeedbackMsg("Ocurrió un error al enviar la respuesta.");
    } finally {
      setSendingReply(false);
    }
  }

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
          course: docenteCourse || currentSubject.name,
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

  // --- MULTI-FILE UPLOAD (.pdf, .txt, .csv, .md, .json) & AI ANALYSIS ---
  function handleSelectMultipleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    setQueuedFiles((prev) => [...prev, ...incoming]);
    setFileUploadError("");
    e.target.value = "";
  }

  function handleRemoveQueuedFile(indexToRemove: number) {
    setQueuedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function handleAnalyzeFilesWithAI(e: React.FormEvent) {
    e.preventDefault();
    if (queuedFiles.length === 0) {
      setFileUploadError(
        "Selecciona al menos un archivo PDF, TXT o CSV para analizar."
      );
      return;
    }

    setAnalyzingFiles(true);
    setFileUploadError("");

    try {
      const formData = new FormData();
      for (const file of queuedFiles) {
        formData.append("files", file);
      }
      formData.append(
        "courseName",
        loggedTeacher?.course || currentSubject.name
      );
      formData.append("category", category);
      if (loggedTeacher?.id) {
        formData.append("teacherId", loggedTeacher.id);
      }
      if (customAiPrompt.trim()) {
        formData.append("customPrompt", customAiPrompt.trim());
      }

      const res = await fetch("/api/analyze-files", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setFileUploadError(
          data.error || "No se pudieron analizar los archivos."
        );
        return;
      }

      const newSections: SyllabusSection[] = (data.files || []).map(
        (f: {
          fileName: string;
          fileType: SyllabusSection["fileType"];
          extractedText: string;
        }) => ({
          id: makeId("file"),
          section: `Archivo ${f.fileType} · ${f.fileName}`,
          title: f.fileName,
          snippet: f.extractedText,
          fileType: f.fileType,
        })
      );

      setUploadedSectionsBySubject((prev) => ({
        ...prev,
        [selectedSubjectId]: [
          ...newSections,
          ...(prev[selectedSubjectId] || []),
        ],
      }));

      setAiAnalysisReport(data.analysis || null);
      setQueuedFiles([]);
      if (loggedTeacher?.email) {
        await fetchAllData(loggedTeacher.email);
      }
    } catch {
      setFileUploadError("Error de red al enviar los archivos al analizador IA.");
    } finally {
      setAnalyzingFiles(false);
    }
  }

  async function handleAddManualContent(e: React.FormEvent) {
    e.preventDefault();
    if (!contentTitle.trim() || !contentBody.trim()) return;
    setSavingContent(true);
    setDocenteMsg("");

    try {
      // Always add to active subject's knowledge base immediately
      const newSec: SyllabusSection = {
        id: makeId("manual"),
        section: `${category} · ${contentTitle.trim()}`,
        title: contentTitle.trim(),
        snippet: contentBody.trim(),
        fileType: "SYLLABUS",
      };

      setUploadedSectionsBySubject((prev) => ({
        ...prev,
        [selectedSubjectId]: [newSec, ...(prev[selectedSubjectId] || [])],
      }));

      if (loggedTeacher && loggedTeacher.status === "approved") {
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
        if (res.ok) {
          await fetchAllData(loggedTeacher.email);
        }
      }

      setContentTitle("");
      setContentBody("");
      setDocenteMsg(
        "Fragmento incorporado a la base de conocimiento y disponible para el análisis de la IA."
      );
    } catch {
      setDocenteMsg("Error guardando el fragmento.");
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

  function handleDeleteUploadedSection(secId: string) {
    setUploadedSectionsBySubject((prev) => ({
      ...prev,
      [selectedSubjectId]: (prev[selectedSubjectId] || []).filter(
        (s) => s.id !== secId
      ),
    }));
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
        setShowCodeModal(false);
      }
    } catch {
      setStudentConnectError("Error de conexión al validar el código.");
    } finally {
      setConnectingCode(false);
    }
  }

  async function askQuestionInChat(rawQuestion: string) {
    const currentQ = rawQuestion.trim();
    if (!currentQ) return;

    const userMsg: ChatMessage = {
      id: makeId("u"),
      sender: "student",
      text: currentQ,
    };

    setChatBySubject((prev) => ({
      ...prev,
      [selectedSubjectId]: [...(prev[selectedSubjectId] || []), userMsg],
    }));
    setQuestion("");
    setAskingGemma(true);

    try {
      // Build extraContents from activeSubjectSections (including uploaded PDFs, CSVs, TXTs!)
      const extraContentsPayload = activeSubjectSections.map((sec) => ({
        id: sec.id,
        category: "Información general",
        title: sec.section,
        content: `${sec.title}\n${sec.snippet}`,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: connectedTeacher?.accessCode || "",
          courseName: connectedTeacher?.course || currentSubject.name,
          studentName,
          studentEmail,
          question: currentQ,
          deferEscalation: true,
          extraContents: extraContentsPayload,
        }),
      });
      const data = await res.json();

      if (res.ok && data.answered) {
        const botMsg: ChatMessage = {
          id: makeId("b"),
          sender: "bot",
          text: data.answer,
          answered: true,
          sourceLabel: data.source?.title || "Syllabus · Material del curso",
          sourceSnippet: data.source?.snippet,
          confidence: data.confidence || "Basada en el syllabus",
        };
        setChatBySubject((prev) => ({
          ...prev,
          [selectedSubjectId]: [...(prev[selectedSubjectId] || []), botMsg],
        }));
        return;
      }

      // Honest message + editable ticket draft (STYLES.md §1)
      const draftMsg: ChatMessage = {
        id: makeId("draft"),
        sender: "bot",
        text: "No encuentro esto en el material del curso.",
        answered: false,
        isTicketDraft: true,
        draftQuestion: currentQ,
        draftContext:
          data.draftContext ||
          `Asignatura: ${
            connectedTeacher?.course || currentSubject.name
          } · Consultado por ${studentName} en el chat.`,
      };
      setChatBySubject((prev) => ({
        ...prev,
        [selectedSubjectId]: [...(prev[selectedSubjectId] || []), draftMsg],
      }));
    } catch {
      const errMsg: ChatMessage = {
        id: makeId("err"),
        sender: "bot",
        text: "No encuentro esto en el material del curso.",
        answered: false,
        isTicketDraft: true,
        draftQuestion: currentQ,
        draftContext: `Asignatura: ${currentSubject.name}`,
      };
      setChatBySubject((prev) => ({
        ...prev,
        [selectedSubjectId]: [...(prev[selectedSubjectId] || []), errMsg],
      }));
    } finally {
      setAskingGemma(false);
    }
  }

  function handleUpdateDraftQuestion(msgId: string, newQuestion: string) {
    setChatBySubject((prev) => ({
      ...prev,
      [selectedSubjectId]: (prev[selectedSubjectId] || []).map((m) =>
        m.id === msgId ? { ...m, draftQuestion: newQuestion } : m
      ),
    }));
  }

  function handleUpdateDraftContext(msgId: string, newContext: string) {
    setChatBySubject((prev) => ({
      ...prev,
      [selectedSubjectId]: (prev[selectedSubjectId] || []).map((m) =>
        m.id === msgId ? { ...m, draftContext: newContext } : m
      ),
    }));
  }

  async function handleSendTicketToProfessor(msg: ChatMessage) {
    const finalQuestion = (msg.draftQuestion || "").trim();
    const finalContext = (msg.draftContext || "").trim();
    if (!finalQuestion) return;

    let emailSent = false;
    let emailId: string | undefined;
    let emailError: string | undefined;
    let escalatedTo = connectedTeacher?.email || "profesor@universidad.edu";

    if (connectedTeacher) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_ticket",
            accessCode: connectedTeacher.accessCode,
            studentName,
            studentEmail,
            question: finalQuestion,
          }),
        });
        const data = await res.json();
        emailSent = Boolean(data.emailSent);
        emailId = data.emailId;
        emailError = data.emailError;
        escalatedTo = data.escalatedTo || escalatedTo;
        await fetchAllData();
      } catch {
        emailError = "Registrado en la bandeja de tickets del profesor.";
      }
    } else {
      const newTicketId = makeId("local-ticket");
      setLocalTickets((prev) => [
        {
          id: newTicketId,
          course: currentSubject.name,
          question: finalQuestion,
          status: /parcial|examen|urgente|hoy/i.test(finalQuestion)
            ? "urgent"
            : "pending",
          statusLabel: /parcial|examen|urgente|hoy/i.test(finalQuestion)
            ? "Urgente · parcial cerca"
            : "Pendiente",
          metaLabel: "Agrupa N preguntas similares",
          similarCount: 1,
          assistantContext: `Contexto del asistente: ${finalContext}`,
          addedToKb: true,
          escalationIds: [],
          studentEmails: [studentEmail],
        },
        ...prev,
      ]);
    }

    const trackerId = makeId("st");
    setStudentTickets((prev) => [
      {
        id: trackerId,
        course: connectedTeacher?.course || currentSubject.name,
        question: finalQuestion,
        context: finalContext,
        step: "enviado",
        createdAt: "Justo ahora",
      },
      ...prev,
    ]);

    setChatBySubject((prev) => ({
      ...prev,
      [selectedSubjectId]: (prev[selectedSubjectId] || []).map((m) =>
        m.id === msg.id
          ? {
              ...m,
              ticketSent: true,
              ticketId: trackerId,
              escalatedTo,
              emailSent,
              emailId,
              emailError,
            }
          : m
      ),
    }));
  }

  function handleFeedback(msgId: string, vote: "up" | "down") {
    setChatBySubject((prev) => ({
      ...prev,
      [selectedSubjectId]: (prev[selectedSubjectId] || []).map((m) =>
        m.id === msgId
          ? { ...m, feedback: m.feedback === vote ? undefined : vote }
          : m
      ),
    }));
  }

  const currentMessages = chatBySubject[selectedSubjectId] || [];
  const myTeacherContents = loggedTeacher
    ? contents.filter((c) => c.teacherId === loggedTeacher.id)
    : [];

  // Explicit theme classes for guaranteed contrast in both Light and Dark mode
  const surfaceCard = darkMode
    ? "bg-[#1E293B] border-[#334155] text-[#F1F5F9]"
    : "bg-white border-slate-200 text-[#1E293B]";
  const surfaceSubCard = darkMode
    ? "bg-[#0F172A] border-[#334155] text-[#F1F5F9]"
    : "bg-[#F8FAFC] border-slate-200 text-[#1E293B]";
  const textPrimary = darkMode ? "text-[#F1F5F9]" : "text-[#1E293B]";
  const textSecondary = darkMode ? "text-[#94A3B8]" : "text-[#475569]";
  const inputSurface = darkMode
    ? "bg-[#0F172A] border-[#475569] text-[#F1F5F9] placeholder:text-slate-400"
    : "bg-white border-slate-300 text-[#1E293B] placeholder:text-slate-400";

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${
        darkMode
          ? "dark bg-[#0F172A] text-[#F1F5F9]"
          : "bg-[#F8FAFC] text-[#1E293B]"
      }`}
    >
      {/* ===================== LEFT SIDEBAR (Matches Reference Image) ===================== */}
      <aside className="w-full md:w-[270px] shrink-0 bg-[#2A236E] dark:bg-[#15123A] text-white flex flex-col justify-between select-none border-r border-indigo-950/30">
        <div>
          {/* Brand Logo & Title */}
          <div className="px-6 pt-7 pb-6 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-xs shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="font-bold text-[17px] tracking-tight text-white">
              Learn Student Diary
            </span>
          </div>

          {/* Primary Navigation Items */}
          <nav
            aria-label="Navegación principal"
            className="px-3.5 space-y-2 mt-1"
          >
            <button
              type="button"
              onClick={() => {
                setAppView("profesor");
                setProfesorNav("bandeja");
              }}
              className={`w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center gap-3.5 text-[15px] transition-colors text-left cursor-pointer ${
                appView === "profesor" && profesorNav === "bandeja"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-xs"
                  : "text-indigo-200 hover:bg-white/10 hover:text-white font-medium"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <span>Bandeja de tickets</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAppView("profesor");
                setProfesorNav("conocimiento");
              }}
              className={`w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center gap-3.5 text-[15px] transition-colors text-left cursor-pointer ${
                appView === "profesor" && profesorNav === "conocimiento"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-xs"
                  : "text-indigo-200 hover:bg-white/10 hover:text-white font-medium"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 4v16M9 4v16M14 5l4 15M4 20h16"
                />
              </svg>
              <span>Base de conocimiento</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAppView("profesor");
                setProfesorNav("metricas");
              }}
              className={`w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center gap-3.5 text-[15px] transition-colors text-left cursor-pointer ${
                appView === "profesor" && profesorNav === "metricas"
                  ? "bg-[#4F46E5] text-white font-semibold shadow-xs"
                  : "text-indigo-200 hover:bg-white/10 hover:text-white font-medium"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 20h16M7 16v-6M12 16v-3M17 16V7"
                />
              </svg>
              <span>Métricas</span>
            </button>
          </nav>
        </div>

        {/* Bottom Switcher: Vista Estudiante, Admin & Modo Claro/Oscuro */}
        <div className="p-4 mt-8 border-t border-white/10 space-y-2.5">
          <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
            Cambiar experiencia y tema
          </p>
          <button
            type="button"
            onClick={() => setAppView("estudiante")}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
              appView === "estudiante"
                ? "bg-[#14B8A6] text-slate-950 font-bold"
                : "bg-white/10 text-indigo-100 hover:bg-white/15"
            }`}
          >
            <span>💬 Chat del estudiante</span>
            <span className="text-[11px] opacity-85">Vista alumno</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAppView("admin");
                fetchAllData();
              }}
              className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                appView === "admin"
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "bg-white/10 text-indigo-100 hover:bg-white/15"
              }`}
            >
              Admin ({teachers.filter((t) => t.status === "pending").length})
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Alternar modo claro u oscuro"
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WORKSPACE ===================== */}
      <main className="flex-1 min-w-0">
        {/* =====================================================================
            1. VISTA DEL PROFESOR: BANDEJA DE TICKETS (Reference Image Match)
           ===================================================================== */}
        {appView === "profesor" && profesorNav === "bandeja" && (
          <div className="max-w-[1180px] mx-auto px-5 py-7 md:px-9 md:py-8 space-y-6">
            {/* Header Row */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-[28px] leading-tight font-bold ${textPrimary}`}>
                  Bandeja de tickets
                </h1>
                <p className={`text-[14.5px] mt-0.5 ${textSecondary}`}>
                  {loggedTeacher?.course || currentSubject.name} · preguntas que
                  el asistente no pudo resolver
                </p>
              </div>

              {/* Subject Pill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const idx = SUBJECTS.findIndex(
                      (s) => s.id === selectedSubjectId
                    );
                    const next = SUBJECTS[(idx + 1) % SUBJECTS.length];
                    setSelectedSubjectId(next.id);
                  }}
                  title="Haz clic para cambiar de asignatura"
                  className={`min-h-[44px] rounded-full border px-5 py-2 flex items-center gap-2.5 shadow-2xs transition-colors cursor-pointer ${surfaceCard}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: currentSubject.accentHex }}
                  />
                  <span className={`text-[14px] font-bold ${textPrimary}`}>
                    {loggedTeacher?.course || currentSubject.name}
                  </span>
                </button>
              </div>
            </header>

            {/* 3 Metric Cards Row */}
            <section
              aria-label="Métricas rápidas del curso"
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              <div className={`rounded-2xl border px-6 py-5 shadow-2xs ${surfaceCard}`}>
                <p className={`text-[13.5px] font-bold ${textSecondary}`}>
                  Dudas resueltas por la IA
                </p>
                <p
                  className={`mt-1.5 text-[32px] leading-none font-extrabold tracking-tight ${
                    darkMode ? "text-[#2DD4BF]" : "text-[#115E59]"
                  }`}
                >
                  [ 00 % ]
                </p>
              </div>

              <div className={`rounded-2xl border px-6 py-5 shadow-2xs ${surfaceCard}`}>
                <p className={`text-[13.5px] font-bold ${textSecondary}`}>
                  Tiempo ahorrado esta semana
                </p>
                <p
                  className={`mt-1.5 text-[32px] leading-none font-extrabold tracking-tight ${
                    darkMode ? "text-[#818CF8]" : "text-[#3730A3]"
                  }`}
                >
                  [ 0 h ]
                </p>
              </div>

              <div className={`rounded-2xl border px-6 py-5 shadow-2xs ${surfaceCard}`}>
                <p className={`text-[13.5px] font-bold ${textSecondary}`}>
                  Tema más confuso
                </p>
                <p
                  className={`mt-1.5 text-[32px] leading-none font-extrabold tracking-tight ${
                    darkMode ? "text-[#FBBF24]" : "text-[#92400E]"
                  }`}
                >
                  [ tema ]
                </p>
              </div>
            </section>

            {/* Two-Column Section: Ticket List (Left) & Responder Panel (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-1">
              {/* Left Column: Grouped Tickets */}
              <section
                aria-label="Tickets pendientes agrupados"
                className="lg:col-span-7 space-y-3.5"
              >
                <h2 className={`text-[12.5px] font-extrabold uppercase tracking-wider ${textSecondary}`}>
                  PENDIENTES, AGRUPADOS POR PREGUNTA SIMILAR
                </h2>

                <div className="space-y-3.5">
                  {combinedTickets.map((ticket) => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => handleSelectTicket(ticket)}
                        className={`w-full text-left rounded-2xl p-5 transition-all block cursor-pointer ${
                          darkMode ? "bg-[#1E293B]" : "bg-white"
                        } ${
                          isSelected
                            ? "border-2 border-[#4F46E5] shadow-xs"
                            : darkMode
                              ? "border border-[#334155] hover:border-slate-500"
                              : "border border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                          {ticket.status === "urgent" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] text-[#991B1B] px-3 py-1 text-xs font-bold">
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.2}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <span>{ticket.statusLabel}</span>
                            </span>
                          )}

                          {ticket.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] text-[#92400E] px-3 py-1 text-xs font-bold">
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.2}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>{ticket.statusLabel}</span>
                            </span>
                          )}

                          {ticket.status === "resolved" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] text-[#166534] px-3 py-1 text-xs font-bold">
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>{ticket.statusLabel}</span>
                            </span>
                          )}

                          <span className={`text-[13px] font-bold ${textSecondary}`}>
                            {ticket.metaLabel}
                          </span>
                        </div>

                        <p className={`text-[16.5px] font-bold leading-snug ${textPrimary}`}>
                          {ticket.question}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Right Column: RESPONDER Panel */}
              <section
                aria-label="Responder al ticket seleccionado"
                className={`lg:col-span-5 rounded-2xl border p-6 shadow-2xs ${surfaceCard}`}
              >
                {selectedTicket && (
                  <form onSubmit={handleReplyToStudents} className="space-y-4">
                    <div className={`text-[12.5px] font-extrabold uppercase tracking-wider ${textSecondary}`}>
                      RESPONDER
                    </div>

                    <h3 className={`text-[17.5px] font-bold leading-snug ${textPrimary}`}>
                      {selectedTicket.question}
                    </h3>

                    {/* Assistant Context Box in Soft Teal (#CCFBF1 / #115E59) */}
                    <div className="rounded-xl bg-[#CCFBF1] text-[#115E59] px-4 py-3.5 text-[13.5px] leading-relaxed font-medium">
                      {selectedTicket.assistantContext}
                    </div>

                    <div>
                      <label
                        htmlFor="profesor-respuesta-textarea"
                        className={`block text-[13.5px] font-bold mb-2 ${textPrimary}`}
                      >
                        Tu respuesta
                      </label>
                      <textarea
                        id="profesor-respuesta-textarea"
                        required
                        rows={7}
                        placeholder="Escribe aquí la respuesta para los estudiantes..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className={`w-full rounded-2xl border p-4 text-[14px] focus:border-[#4F46E5] focus:outline-none resize-y ${inputSurface}`}
                      />
                    </div>

                    {/* Checkbox "Añadir a la base de conocimiento" */}
                    <label
                      className={`min-h-[48px] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer select-none ${
                        darkMode
                          ? "bg-[#312E81]/60 text-[#E0E7FF] border border-indigo-500/30"
                          : "bg-[#EEF2FF] text-[#3730A3]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={addToKbChecked}
                        onChange={(e) => setAddToKbChecked(e.target.checked)}
                        className="w-5 h-5 rounded accent-[#4F46E5] cursor-pointer"
                      />
                      <span className="text-[13.5px] font-bold">
                        Añadir a la base de conocimiento
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={sendingReply}
                      className="w-full min-h-[48px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[14.5px] py-3.5 px-5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {sendingReply
                        ? "Enviando respuesta..."
                        : "Responder a todos los estudiantes"}
                    </button>

                    {replyFeedbackMsg && (
                      <div className="rounded-xl bg-[#DCFCE7] text-[#166534] px-4 py-3 text-xs font-bold flex items-center gap-2">
                        <span>✓</span>
                        <span>{replyFeedbackMsg}</span>
                      </div>
                    )}
                  </form>
                )}
              </section>
            </div>
          </div>
        )}

        {/* =====================================================================
            2. VISTA DEL PROFESOR: BASE DE CONOCIMIENTO (Multi-file PDF/TXT/CSV + IA)
           ===================================================================== */}
        {appView === "profesor" && profesorNav === "conocimiento" && (
          <div className="max-w-[1140px] mx-auto px-5 py-7 md:px-9 md:py-8 space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-[28px] leading-tight font-bold ${textPrimary}`}>
                  Base de conocimiento
                </h1>
                <p className={`text-[14.5px] mt-0.5 ${textSecondary}`}>
                  Sube múltiples archivos (PDF, TXT, CSV) para que la IA (Gemma
                  4) los analice y responda dudas con fuente verificable
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const idx = SUBJECTS.findIndex(
                    (s) => s.id === selectedSubjectId
                  );
                  const next = SUBJECTS[(idx + 1) % SUBJECTS.length];
                  setSelectedSubjectId(next.id);
                }}
                className={`min-h-[44px] rounded-full border px-5 py-2 flex items-center gap-2.5 cursor-pointer ${surfaceCard}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: currentSubject.accentHex }}
                />
                <span className={`text-sm font-bold ${textPrimary}`}>
                  {loggedTeacher?.course || currentSubject.name}
                </span>
              </button>
            </header>

            {/* MÓDULO PRINCIPAL: Subir múltiples PDF, TXT, CSV y Analizarlos con IA */}
            <section className={`rounded-2xl border p-6 space-y-5 shadow-2xs ${surfaceCard}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="inline-block rounded-full bg-[#CCFBF1] text-[#115E59] px-3 py-0.5 text-xs font-extrabold mb-1.5">
                    Analizador Multimodal de Documentos IA
                  </span>
                  <h2 className={`text-lg font-bold ${textPrimary}`}>
                    1. Añadir varios archivos (.PDF, .TXT, .CSV) para que la IA
                    los analice
                  </h2>
                  <p className={`text-sm ${textSecondary}`}>
                    Puedes seleccionar varios archivos a la vez (syllabus en
                    PDF, listas o calificaciones en CSV, apuntes en TXT). La IA
                    extrae su contenido, genera un resumen analítico y los
                    indexa en <strong>{currentSubject.name}</strong>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAnalyzeFilesWithAI} className="space-y-4">
                {/* Multi-file Dropzone */}
                <label
                  className={`block rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                    darkMode
                      ? "border-indigo-400/50 bg-[#0F172A]/70 hover:bg-[#0F172A]"
                      : "border-indigo-300 bg-[#EEF2FF]/50 hover:bg-[#EEF2FF]"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.csv,.md,.json,application/pdf,text/plain,text/csv"
                    onChange={handleSelectMultipleFiles}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center mx-auto mb-3 font-bold text-lg shadow-xs">
                    +
                  </div>
                  <p className={`text-sm font-bold ${textPrimary}`}>
                    Haz clic aquí para seleccionar varios archivos (.PDF, .TXT,
                    .CSV)
                  </p>
                  <p className={`text-xs mt-1 ${textSecondary}`}>
                    Soporta selección múltiple simultánea · PDFs de syllabus o
                    guías, tablas CSV y documentos TXT/MD
                  </p>
                </label>

                {/* List of queued files ready for AI analysis */}
                {queuedFiles.length > 0 && (
                  <div className={`rounded-xl border p-4 space-y-2.5 ${surfaceSubCard}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${textSecondary}`}>
                        Archivos seleccionados para analizar ({queuedFiles.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setQueuedFiles([])}
                        className="text-xs font-bold text-[#EF4444] hover:underline cursor-pointer"
                      >
                        Vaciar lista
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {queuedFiles.map((file, idx) => {
                        const ext =
                          file.name.split(".").pop()?.toUpperCase() || "DOC";
                        return (
                          <div
                            key={`${file.name}-${idx}`}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${surfaceCard}`}
                          >
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${
                                ext === "PDF"
                                  ? "bg-[#FEE2E2] text-[#991B1B]"
                                  : ext === "CSV"
                                    ? "bg-[#DCFCE7] text-[#166534]"
                                    : "bg-[#EEF2FF] text-[#3730A3]"
                              }`}
                            >
                              {ext}
                            </span>
                            <span className={textPrimary}>{file.name}</span>
                            <span className={`text-[11px] font-normal ${textSecondary}`}>
                              ({Math.max(1, Math.round(file.size / 1024))} KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveQueuedFile(idx)}
                              aria-label={`Quitar ${file.name}`}
                              className="ml-1 text-[#EF4444] hover:opacity-80 font-extrabold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Optional AI analysis instruction + category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${textPrimary}`}>
                      Categoría de los archivos
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ContentCategory)
                      }
                      className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 text-sm ${inputSurface}`}
                    >
                      <option value="Información general">
                        Syllabus / Información general
                      </option>
                      <option value="Tareas">Tareas y Talleres</option>
                      <option value="Notas">Evaluación y Notas (CSV/PDF)</option>
                      <option value="Plataformas">Plataformas y Guías</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-bold mb-1.5 ${textPrimary}`}>
                      Instrucción opcional para el análisis de la IA
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Extrae las fechas de exámenes, reglas de calificación y resume los datos del CSV..."
                      value={customAiPrompt}
                      onChange={(e) => setCustomAiPrompt(e.target.value)}
                      className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 text-sm ${inputSurface}`}
                    />
                  </div>
                </div>

                {fileUploadError && (
                  <div className="rounded-xl bg-[#FEE2E2] text-[#991B1B] px-4 py-3 text-xs font-bold">
                    ⚠ {fileUploadError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={analyzingFiles}
                  className="min-h-[48px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-6 py-3 text-sm font-bold text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {analyzingFiles
                    ? "Analizando archivos con IA (Gemma 4)..."
                    : `Analizar ${
                        queuedFiles.length > 0 ? `${queuedFiles.length} ` : ""
                      }archivo(s) con la IA e indexar en ${currentSubject.name}`}
                </button>
              </form>

              {/* Resultado del análisis de la IA */}
              {aiAnalysisReport && (
                <div className="rounded-2xl border-2 border-[#14B8A6] bg-[#CCFBF1]/25 dark:bg-[#115E59]/25 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CCFBF1] text-[#115E59] px-3 py-1 text-xs font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                        Análisis completado · {aiAnalysisReport.modelName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppView("estudiante")}
                      className="min-h-[38px] rounded-xl bg-[#4F46E5] text-white px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Probar preguntas en el Chat del estudiante →
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-sm font-bold ${textPrimary}`}>
                      Resumen del análisis de la IA:
                    </h3>
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${textPrimary}`}>
                      {aiAnalysisReport.summary}
                    </p>
                  </div>

                  {aiAnalysisReport.keyFindings.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className={`text-xs font-extrabold uppercase tracking-wider ${textSecondary}`}>
                        Hallazgos detectados en los archivos:
                      </h4>
                      <ul className="space-y-1 text-xs list-disc list-inside">
                        {aiAnalysisReport.keyFindings.map((finding, idx) => (
                          <li key={idx} className={textPrimary}>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysisReport.suggestedQuestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-teal-500/20">
                      <p className={`text-xs font-bold ${textSecondary}`}>
                        Haz clic en una pregunta para consultarla con la IA en
                        el chat:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysisReport.suggestedQuestions.map((sq) => (
                          <button
                            key={sq}
                            type="button"
                            onClick={() => {
                              setAppView("estudiante");
                              askQuestionInChat(sq);
                            }}
                            className="rounded-full bg-[#CCFBF1] text-[#115E59] hover:opacity-90 px-3 py-1.5 text-xs font-bold cursor-pointer"
                          >
                            💬 {sq}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Paso 2: Añadir fragmento manual de texto + Cuenta Docente opcional */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Manual Snippet Form */}
              <section className={`rounded-2xl border p-6 space-y-4 shadow-2xs ${surfaceCard}`}>
                <h2 className={`text-base font-bold ${textPrimary}`}>
                  2. Redactar o pegar sección del syllabus manualmente
                </h2>
                <form onSubmit={handleAddManualContent} className="space-y-3">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textPrimary}`}>
                      Etiqueta de fuente (ej. Syllabus · Sección 3.2)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Syllabus · Sección 3.2 — Política de calculadoras"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 text-sm ${inputSurface}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textPrimary}`}>
                      Contenido detallado
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Escribe o pega aquí una regla, fecha o criterio del curso..."
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className={`w-full rounded-xl border p-3.5 text-sm ${inputSurface}`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingContent}
                    className="min-h-[44px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    {savingContent
                      ? "Guardando..."
                      : "Añadir fragmento a la base de conocimiento"}
                  </button>
                </form>
                {docenteMsg && (
                  <div className="rounded-xl bg-[#DCFCE7] text-[#166534] px-4 py-2.5 text-xs font-bold">
                    ✓ {docenteMsg}
                  </div>
                )}
              </section>

              {/* Cuenta Docente y Código para Neon Postgres */}
              <section className={`rounded-2xl border p-6 space-y-4 shadow-2xs ${surfaceCard}`}>
                <div>
                  <h2 className={`text-base font-bold ${textPrimary}`}>
                    3. Sincronización Docente en Neon Postgres (Opcional)
                  </h2>
                  <p className={`text-xs mt-1 ${textSecondary}`}>
                    Conéctate con tu correo institucional si deseas generar un
                    código compartido y persistir los archivos en tu cuenta de
                    Neon Postgres.
                  </p>
                </div>

                <form onSubmit={handleDocenteLogin} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      required
                      placeholder="Correo del docente *"
                      value={docenteEmail}
                      onChange={(e) => setDocenteEmail(e.target.value)}
                      className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-sm ${inputSurface}`}
                    />
                    <input
                      type="text"
                      placeholder="Nombre del profesor"
                      value={docenteName}
                      onChange={(e) => setDocenteName(e.target.value)}
                      className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-sm ${inputSurface}`}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Asignatura (ej. Cálculo II)"
                      value={docenteCourse}
                      onChange={(e) => setDocenteCourse(e.target.value)}
                      className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-sm ${inputSurface}`}
                    />
                    <input
                      type="text"
                      placeholder="Código opcional (CALC-202)"
                      value={docenteCustomCode}
                      onChange={(e) =>
                        setDocenteCustomCode(e.target.value.toUpperCase())
                      }
                      className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-sm font-mono uppercase ${inputSurface}`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[44px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    Conectar cuenta docente
                  </button>
                </form>

                {loggedTeacher && (
                  <div className={`rounded-xl border p-4 space-y-2 ${surfaceSubCard}`}>
                    <p className={`text-xs ${textPrimary}`}>
                      Docente: <strong>{loggedTeacher.name}</strong> (
                      {loggedTeacher.email}) · Curso:{" "}
                      <strong>{loggedTeacher.course}</strong>
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {loggedTeacher.status === "approved" ? (
                        <div className="flex items-center gap-2 rounded-lg bg-[#CCFBF1] text-[#115E59] px-3 py-1.5 text-xs font-bold">
                          <span>Código: {loggedTeacher.accessCode}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyTeacherCode(loggedTeacher.accessCode)
                            }
                            className="underline ml-1 cursor-pointer"
                          >
                            {copiedCode ? "¡Copiado!" : "Copiar"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAppView("admin")}
                          className="rounded-lg bg-[#FEF3C7] text-[#92400E] px-3 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          🕒 Pendiente · Ir a Admin para aprobar →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* List of all active documents and syllabus fragments */}
            <section className={`rounded-2xl border p-6 space-y-4 shadow-2xs ${surfaceCard}`}>
              <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textSecondary}`}>
                DOCUMENTOS Y FRAGMENTOS ACTIVOS PARA LA IA EN{" "}
                {currentSubject.name.toUpperCase()} (
                {activeSubjectSections.length + myTeacherContents.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeSubjectSections.map((sec) => {
                  const isUploaded = sec.id.startsWith("file-") || sec.id.startsWith("manual-") || sec.id.startsWith("kb-");
                  return (
                    <div
                      key={sec.id}
                      className={`rounded-xl border p-4 space-y-2 flex flex-col justify-between ${surfaceSubCard}`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                              sec.fileType === "PDF"
                                ? "bg-[#FEE2E2] text-[#991B1B]"
                                : sec.fileType === "CSV"
                                  ? "bg-[#DCFCE7] text-[#166534]"
                                  : "bg-[#CCFBF1] text-[#115E59]"
                            }`}
                          >
                            {sec.section}
                          </span>
                          {isUploaded && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteUploadedSection(sec.id)
                              }
                              className="text-xs font-bold text-[#EF4444] hover:underline cursor-pointer"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <h4 className={`text-sm font-bold ${textPrimary}`}>
                          {sec.title}
                        </h4>
                        <p className={`text-xs leading-relaxed line-clamp-4 whitespace-pre-wrap ${textSecondary}`}>
                          {sec.snippet}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {myTeacherContents.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 space-y-1.5 flex flex-col justify-between ${surfaceSubCard}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-block rounded-lg bg-[#EEF2FF] text-[#3730A3] px-2.5 py-0.5 text-xs font-bold">
                          {item.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteContent(item.id)}
                          className="text-xs font-bold text-[#EF4444] hover:underline cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                      <h4 className={`text-sm font-bold mt-1.5 ${textPrimary}`}>
                        {item.title}
                      </h4>
                      <p className={`text-xs mt-1 line-clamp-4 whitespace-pre-wrap ${textSecondary}`}>
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            3. VISTA DEL PROFESOR: MÉTRICAS COMPLETAS (STYLES.md §1 y §5)
           ===================================================================== */}
        {appView === "profesor" && profesorNav === "metricas" && (
          <div className="max-w-[1100px] mx-auto px-5 py-7 md:px-9 md:py-8 space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-[28px] leading-tight font-bold ${textPrimary}`}>
                  Métricas del curso
                </h1>
                <p className={`text-[14.5px] mt-0.5 ${textSecondary}`}>
                  Impacto del asistente IA y oportunidades de mejora en el
                  syllabus de {currentSubject.name}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className={`rounded-2xl border p-6 ${surfaceCard}`}>
                <p className={`text-xs font-bold ${textSecondary}`}>
                  Dudas resueltas por la IA
                </p>
                <p
                  className={`mt-2 text-3xl font-extrabold ${
                    darkMode ? "text-[#2DD4BF]" : "text-[#115E59]"
                  }`}
                >
                  [ 00 % ]
                </p>
                <p className={`mt-2 text-xs ${textSecondary}`}>
                  Cada ticket respondido con &ldquo;Añadir a la base de
                  conocimiento&rdquo; o archivo PDF/CSV cargado incrementa esta
                  tasa.
                </p>
              </div>

              <div className={`rounded-2xl border p-6 ${surfaceCard}`}>
                <p className={`text-xs font-bold ${textSecondary}`}>
                  Tiempo ahorrado esta semana
                </p>
                <p
                  className={`mt-2 text-3xl font-extrabold ${
                    darkMode ? "text-[#818CF8]" : "text-[#3730A3]"
                  }`}
                >
                  [ 0 h ]
                </p>
                <p className={`mt-2 text-xs ${textSecondary}`}>
                  Estimado a partir de preguntas repetidas agrupadas en un solo
                  ticket.
                </p>
              </div>

              <div className={`rounded-2xl border p-6 ${surfaceCard}`}>
                <p className={`text-xs font-bold ${textSecondary}`}>
                  Tema más confuso
                </p>
                <p
                  className={`mt-2 text-3xl font-extrabold ${
                    darkMode ? "text-[#FBBF24]" : "text-[#92400E]"
                  }`}
                >
                  [ tema ]
                </p>
                <p className={`mt-2 text-xs ${textSecondary}`}>
                  Detectado en las preguntas que requirieron escalamiento al
                  profesor.
                </p>
              </div>
            </div>

            <section className={`rounded-2xl border p-6 space-y-4 ${surfaceCard}`}>
              <h2 className={`text-base font-bold ${textPrimary}`}>
                Sugerencias para mejorar el syllabus según los tickets recibidos
              </h2>
              <div className="space-y-3">
                <div className="rounded-xl bg-[#FEF3C7] text-[#92400E] p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">
                      🕒 Política de uso de calculadoras en exámenes parciales
                    </p>
                    <p className="text-xs mt-1">
                      Varios estudiantes preguntaron si se permite calculadora
                      gráfica en el segundo parcial. Añadir una nota en{" "}
                      <strong>Syllabus · Sección 3.2</strong> evitará futuros
                      tickets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfesorNav("bandeja")}
                    className="min-h-[40px] shrink-0 rounded-xl bg-[#92400E] text-white px-3.5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Ver en bandeja
                  </button>
                </div>

                <div className="rounded-xl bg-[#DCFCE7] text-[#166534] p-4">
                  <p className="text-sm font-bold">
                    ✓ Formato de entrega del Taller 3 (Integrado a la base de
                    conocimiento)
                  </p>
                  <p className="text-xs mt-1">
                    La respuesta del profesor ya está disponible para la IA en
                    futuras preguntas similares.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            4. VISTA DEL ESTUDIANTE: CHAT PRIMERO + BORRADOR DE TICKET + TIMELINE
           ===================================================================== */}
        {appView === "estudiante" && (
          <div className="h-full flex flex-col">
            {/* Top Subject Selector Tabs */}
            <header className={`border-b px-4 py-3 md:px-7 ${surfaceCard}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  role="tablist"
                  aria-label="Selector de asignatura"
                  className="flex flex-wrap items-center gap-2"
                >
                  {SUBJECTS.map((subj) => {
                    const active = subj.id === selectedSubjectId;
                    return (
                      <button
                        key={subj.id}
                        role="tab"
                        aria-selected={active}
                        type="button"
                        onClick={() => setSelectedSubjectId(subj.id)}
                        className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2.5 transition-all border cursor-pointer ${
                          active
                            ? darkMode
                              ? "bg-[#312E81]/60 text-white border-current shadow-2xs"
                              : "bg-[#EEF2FF] text-[#1E293B] border-current shadow-2xs"
                            : `${textSecondary} border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800`
                        }`}
                        style={
                          active ? { borderColor: subj.accentHex } : undefined
                        }
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: subj.accentHex }}
                        />
                        <span>{subj.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodeModal((v) => !v)}
                    className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs font-bold cursor-pointer ${surfaceSubCard}`}
                  >
                    {connectedTeacher
                      ? `🔗 Código activo: ${connectedTeacher.accessCode}`
                      : "🔑 Conectar código de docente"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentSidebarOpen((o) => !o)}
                    className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs font-bold cursor-pointer ${surfaceSubCard}`}
                  >
                    {studentSidebarOpen
                      ? "Ocultar contexto"
                      : "📅 Ver syllabus y archivos"}
                  </button>
                </div>
              </div>

              {showCodeModal && (
                <form
                  onSubmit={handleConnectByCode}
                  className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-end gap-3"
                >
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${textPrimary}`}>
                      Código del curso (Neon Postgres)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: CALC-202"
                      value={studentCodeInput}
                      onChange={(e) =>
                        setStudentCodeInput(e.target.value.toUpperCase())
                      }
                      className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs font-mono uppercase ${inputSurface}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${textPrimary}`}>
                      Tu nombre
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs ${inputSurface}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${textPrimary}`}>
                      Tu correo
                    </label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs ${inputSurface}`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={connectingCode}
                    className="min-h-[44px] rounded-xl bg-[#4F46E5] text-white px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    {connectingCode ? "Verificando..." : "Conectar asignatura"}
                  </button>
                  {studentConnectError && (
                    <span className="text-xs font-bold text-[#991B1B] bg-[#FEE2E2] px-3 py-1.5 rounded-lg">
                      ⚠ {studentConnectError}
                    </span>
                  )}
                </form>
              )}
            </header>

            {/* Student Main Body: Center Chat + Collapsible Context Drawer */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <div className="flex-1 flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full">
                {/* Messages Stream */}
                <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-4">
                  {currentMessages.length === 0 ? (
                    <div className={`rounded-2xl border border-dashed p-10 text-center my-8 space-y-2 ${surfaceCard}`}>
                      <div
                        className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: currentSubject.accentHex }}
                      >
                        IA
                      </div>
                      <h2 className={`text-lg font-bold ${textPrimary}`}>
                        Pregúntame sobre el syllabus, fechas o evaluación
                      </h2>
                      <p className={`text-sm max-w-md mx-auto ${textSecondary}`}>
                        Analizo todos los archivos PDF, CSV y TXT cargados en{" "}
                        <strong>{currentSubject.name}</strong>. Si algo no está
                        en el material, te preparo un ticket para el profesor.
                      </p>
                    </div>
                  ) : (
                    currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === "student" ? "items-end" : "items-start"
                        }`}
                      >
                        {msg.sender !== "student" && (
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            {msg.sender === "bot" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CCFBF1] text-[#115E59] px-2.5 py-0.5 text-[11px] font-bold">
                                <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                                Asistente IA · {currentSubject.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] text-[#92400E] px-2.5 py-0.5 text-[11px] font-bold">
                                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                                Profesor · {currentSubject.teacherName}
                              </span>
                            )}

                            {msg.confidence && (
                              <span className={`text-[11px] font-semibold ${textSecondary}`}>
                                · {msg.confidence}
                              </span>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                            msg.sender === "student"
                              ? "bg-[#4F46E5] text-white font-medium"
                              : msg.sender === "professor"
                                ? "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40 font-medium"
                                : `border shadow-2xs ${surfaceCard}`
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          {msg.sender === "bot" && msg.answered && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                              {msg.sourceLabel && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSourceMsgId(
                                      expandedSourceMsgId === msg.id
                                        ? null
                                        : msg.id
                                    )
                                  }
                                  className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-[#CCFBF1] text-[#115E59] px-3 py-1 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                  <span>📄 {msg.sourceLabel}</span>
                                  <span className="underline ml-1">
                                    {expandedSourceMsgId === msg.id
                                      ? "Ocultar fuente"
                                      : "Ver fragmento"}
                                  </span>
                                </button>
                              )}

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, "up")}
                                  aria-label="Respuesta útil"
                                  className={`min-h-[36px] min-w-[36px] rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer ${
                                    msg.feedback === "up"
                                      ? "bg-[#DCFCE7] text-[#166534] border-[#22C55E]"
                                      : `border-slate-300 dark:border-slate-600 ${textSecondary}`
                                  }`}
                                >
                                  👍
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, "down")}
                                  aria-label="Respuesta poco útil"
                                  className={`min-h-[36px] min-w-[36px] rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer ${
                                    msg.feedback === "down"
                                      ? "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]"
                                      : `border-slate-300 dark:border-slate-600 ${textSecondary}`
                                  }`}
                                >
                                  👎
                                </button>
                              </div>
                            </div>
                          )}

                          {expandedSourceMsgId === msg.id &&
                            msg.sourceSnippet && (
                              <div className={`mt-2.5 rounded-xl border p-3 text-xs ${surfaceSubCard}`}>
                                <p className="font-bold text-[#14B8A6] mb-1">
                                  Fragmento original ({msg.sourceLabel}):
                                </p>
                                <p className="whitespace-pre-wrap">
                                  {msg.sourceSnippet}
                                </p>
                              </div>
                            )}

                          {msg.isTicketDraft && !msg.ticketSent && (
                            <div className={`mt-3.5 rounded-xl border p-4 space-y-3 ${surfaceSubCard}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-300">
                                  Borrador de ticket para el profesor
                                </span>
                                <span className={`text-[11px] font-semibold ${textSecondary}`}>
                                  Editable antes de enviar
                                </span>
                              </div>

                              <div>
                                <label className={`block text-xs font-bold mb-1 ${textPrimary}`}>
                                  Tu pregunta
                                </label>
                                <input
                                  type="text"
                                  value={msg.draftQuestion || ""}
                                  onChange={(e) =>
                                    handleUpdateDraftQuestion(
                                      msg.id,
                                      e.target.value
                                    )
                                  }
                                  className={`w-full min-h-[44px] rounded-xl border px-3 py-2 text-xs font-medium ${inputSurface}`}
                                />
                              </div>

                              <div>
                                <label className={`block text-xs font-bold mb-1 ${textPrimary}`}>
                                  Contexto de la conversación
                                </label>
                                <textarea
                                  rows={2}
                                  value={msg.draftContext || ""}
                                  onChange={(e) =>
                                    handleUpdateDraftContext(
                                      msg.id,
                                      e.target.value
                                    )
                                  }
                                  className={`w-full rounded-xl border p-2.5 text-xs ${inputSurface}`}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSendTicketToProfessor(msg)}
                                className="w-full min-h-[44px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs py-2.5 px-4 transition-colors cursor-pointer"
                              >
                                Enviar al profesor
                              </button>
                            </div>
                          )}

                          {msg.isTicketDraft && msg.ticketSent && (
                            <div className="mt-3 rounded-xl bg-[#DCFCE7] text-[#166534] p-3 text-xs font-bold space-y-1">
                              <p>
                                ✓ Ticket enviado al profesor ({msg.escalatedTo}
                                ).
                              </p>
                              <p className="font-normal">
                                Puedes seguir usando el chat mientras esperas.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {askingGemma && (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#CCFBF1] text-[#115E59] px-4 py-2.5 text-xs font-bold animate-pulse">
                      <span>Asistente IA analizando documentos…</span>
                    </div>
                  )}
                </div>

                {/* Seguimiento del Ticket */}
                {studentTickets.length > 0 && (
                  <div className={`mb-4 rounded-2xl border p-4 space-y-3 ${surfaceCard}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${textSecondary}`}>
                        Seguimiento de tus tickets ({studentTickets.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppView("profesor");
                          setProfesorNav("bandeja");
                        }}
                        className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Ver en bandeja del profesor →
                      </button>
                    </div>

                    {studentTickets.slice(0, 2).map((tk) => (
                      <div
                        key={tk.id}
                        className={`rounded-xl p-3.5 border space-y-2.5 ${surfaceSubCard}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={`text-xs font-bold ${textPrimary}`}>
                            {tk.question}
                          </p>
                          <span className={`text-[11px] ${textSecondary}`}>
                            {tk.createdAt}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-[#EEF2FF] text-[#3730A3] px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5">
                            <span>📤</span>
                            <span>1. Enviado</span>
                          </div>

                          <div
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${
                              tk.step === "en_revision" ||
                              tk.step === "respondido"
                                ? "bg-[#FEF3C7] text-[#92400E]"
                                : "bg-slate-200/70 dark:bg-slate-800 text-slate-400"
                            }`}
                          >
                            <span>🕒</span>
                            <span>2. En revisión</span>
                          </div>

                          <div
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${
                              tk.step === "respondido"
                                ? "bg-[#DCFCE7] text-[#166534]"
                                : "bg-slate-200/70 dark:bg-slate-800 text-slate-400"
                            }`}
                          >
                            <span>✓</span>
                            <span>3. Respondido</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    "¿Cuándo es el próximo parcial?",
                    "¿Qué entra en el examen?",
                    "¿Cómo se califica?",
                    "¿Se permite calculadora gráfica en el segundo parcial?",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => askQuestionInChat(chip)}
                      className={`min-h-[40px] rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        darkMode
                          ? "bg-[#312E81]/70 text-indigo-100 hover:bg-[#312E81]"
                          : "bg-[#EEF2FF] text-[#3730A3] hover:bg-indigo-100"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    askQuestionInChat(question);
                  }}
                  className="flex gap-2.5"
                >
                  <input
                    type="text"
                    required
                    placeholder={`Pregunta sobre el syllabus o los PDF/CSV/TXT de ${
                      connectedTeacher?.course || currentSubject.name
                    }...`}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className={`flex-1 min-h-[48px] rounded-2xl border px-4 py-3 text-sm focus:border-[#4F46E5] focus:outline-none ${inputSurface}`}
                  />
                  <button
                    type="submit"
                    disabled={askingGemma}
                    className="min-h-[48px] rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold px-6 py-3 text-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Preguntar
                  </button>
                </form>
              </div>

              {/* Collapsible Student Right Panel */}
              {studentSidebarOpen && (
                <aside
                  aria-label="Contexto de la asignatura"
                  className={`w-full lg:w-[350px] shrink-0 border-t lg:border-t-0 lg:border-l p-5 space-y-6 overflow-y-auto ${surfaceCard}`}
                >
                  <div className="space-y-2.5">
                    <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textSecondary}`}>
                      Calendario de entregas
                    </h3>
                    {currentSubject.deadlines.map((dl) => (
                      <div
                        key={dl.id}
                        className={`rounded-xl p-3 text-xs space-y-1 ${
                          dl.critical
                            ? "bg-[#FEE2E2] text-[#991B1B]"
                            : `border ${surfaceSubCard}`
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {dl.critical && <span>⚠ Crítico:</span>}
                          <span>{dl.title}</span>
                        </div>
                        <p className="opacity-90 font-medium">{dl.date}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-extrabold uppercase tracking-wider ${textSecondary}`}>
                        Syllabus y archivos analizados (
                        {activeSubjectSections.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setAppView("profesor");
                          setProfesorNav("conocimiento");
                        }}
                        className="text-[11px] font-bold text-[#4F46E5] dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        + Subir PDF/CSV
                      </button>
                    </div>
                    {activeSubjectSections.map((sec) => (
                      <div
                        key={sec.id}
                        className={`rounded-xl border p-3 space-y-1 ${surfaceSubCard}`}
                      >
                        <span className="inline-block rounded bg-[#CCFBF1] text-[#115E59] px-2 py-0.5 text-[11px] font-bold">
                          {sec.section}
                        </span>
                        <p className={`text-xs font-bold ${textPrimary}`}>
                          {sec.title}
                        </p>
                        <p className={`text-[11.5px] leading-relaxed line-clamp-3 ${textSecondary}`}>
                          {sec.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            5. VISTA ADMIN: APROBACIÓN DE DOCENTES Y REGISTRO RESEND
           ===================================================================== */}
        {appView === "admin" && (
          <div className="max-w-[1100px] mx-auto px-5 py-7 md:px-9 md:py-8 space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className={`text-[28px] leading-tight font-bold ${textPrimary}`}>
                  Administración de docentes y alertas
                </h1>
                <p className={`text-sm ${textSecondary}`}>
                  Aprueba solicitudes de acceso docente en Neon Postgres y
                  supervisa las notificaciones enviadas con Resend.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchAllData()}
                className={`min-h-[44px] rounded-xl border px-4 py-2 text-xs font-bold cursor-pointer ${surfaceCard}`}
              >
                {loadingData ? "Actualizando..." : "Refrescar datos"}
              </button>
            </header>

            <section className={`rounded-2xl border p-6 ${surfaceCard}`}>
              <h2 className={`text-base font-bold mb-4 ${textPrimary}`}>
                Solicitudes de docentes ({teachers.length})
              </h2>

              {teachers.length === 0 ? (
                <p className={`text-sm py-4 ${textSecondary}`}>
                  No hay docentes registrados todavía. Puedes registrar uno en{" "}
                  <strong>Base de conocimiento</strong>.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className={`border-b border-slate-200 dark:border-slate-700 text-xs font-extrabold uppercase ${textSecondary}`}>
                        <th className="p-3">Docente</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3">Asignatura</th>
                        <th className="p-3">Código</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-slate-200 dark:border-slate-700"
                        >
                          <td className={`p-3 font-bold ${textPrimary}`}>
                            {t.name}
                          </td>
                          <td className={`p-3 ${textPrimary}`}>{t.email}</td>
                          <td className={`p-3 ${textPrimary}`}>{t.course}</td>
                          <td className="p-3">
                            <code className="rounded-lg bg-[#EEF2FF] text-[#3730A3] px-2.5 py-1 font-mono text-xs font-bold">
                              {t.accessCode}
                            </code>
                          </td>
                          <td className="p-3">
                            {t.status === "pending" && (
                              <span className="rounded-full bg-[#FEF3C7] text-[#92400E] px-2.5 py-1 text-xs font-bold">
                                🕒 Pendiente
                              </span>
                            )}
                            {t.status === "approved" && (
                              <span className="rounded-full bg-[#DCFCE7] text-[#166534] px-2.5 py-1 text-xs font-bold">
                                ✓ Aceptado
                              </span>
                            )}
                            {t.status === "rejected" && (
                              <span className="rounded-full bg-[#FEE2E2] text-[#991B1B] px-2.5 py-1 text-xs font-bold">
                                ⚠ Rechazado
                              </span>
                            )}
                          </td>
                          <td className="p-3 space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTeacherStatus(t.id, "approved")
                              }
                              disabled={t.status === "approved"}
                              className="min-h-[38px] rounded-xl bg-[#22C55E] text-white px-3 py-1.5 text-xs font-bold disabled:opacity-40 cursor-pointer"
                            >
                              Aceptar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTeacherStatus(t.id, "rejected")
                              }
                              disabled={t.status === "rejected"}
                              className="min-h-[38px] rounded-xl bg-[#EF4444] text-white px-3 py-1.5 text-xs font-bold disabled:opacity-40 cursor-pointer"
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
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
