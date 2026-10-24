import { neon } from "@neondatabase/serverless";

export type TeacherStatus = "pending" | "approved" | "rejected";

export type ContentCategory =
  | "Plataformas"
  | "Tareas"
  | "Notas"
  | "Información general";

export type EscalationStatus = "urgent" | "pending" | "resolved";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  course: string;
  accessCode: string;
  status: TeacherStatus;
  createdAt: string;
}

export interface CourseContent {
  id: string;
  teacherId: string;
  teacherEmail: string;
  teacherName: string;
  category: ContentCategory;
  title: string;
  content: string;
  createdAt: string;
}

export interface EscalationRecord {
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
  status?: EscalationStatus;
  teacherAnswer?: string;
  addedToKb?: boolean;
  createdAt: string;
}

export interface DatabaseSnapshot {
  teachers: Teacher[];
  contents: CourseContent[];
  escalations: EscalationRecord[];
}

function getPooledSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está configurada en el entorno (.env).");
  }
  return neon(url);
}

function getDirectSql() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL_UNPOOLED / DATABASE_URL no está configurada en el entorno (.env)."
    );
  }
  return neon(url);
}

let schemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;
  const sql = getDirectSql();

  await sql`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      course TEXT NOT NULL,
      access_code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS course_contents (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      teacher_email TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS escalations (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      teacher_name TEXT NOT NULL,
      teacher_email TEXT NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      question TEXT NOT NULL,
      email_sent BOOLEAN NOT NULL DEFAULT FALSE,
      email_id TEXT,
      email_error TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      teacher_answer TEXT,
      added_to_kb BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE escalations
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS teacher_answer TEXT,
    ADD COLUMN IF NOT EXISTS added_to_kb BOOLEAN NOT NULL DEFAULT FALSE
  `;

  schemaInitialized = true;
}

function mapTeacherRow(row: Record<string, unknown>): Teacher {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    course: String(row.course),
    accessCode: String(row.access_code),
    status: String(row.status) as TeacherStatus,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

function mapContentRow(row: Record<string, unknown>): CourseContent {
  return {
    id: String(row.id),
    teacherId: String(row.teacher_id),
    teacherEmail: String(row.teacher_email),
    teacherName: String(row.teacher_name),
    category: String(row.category) as ContentCategory,
    title: String(row.title),
    content: String(row.content),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

function mapEscalationRow(row: Record<string, unknown>): EscalationRecord {
  const rawStatus = row.status ? String(row.status) : "pending";
  const validStatus: EscalationStatus =
    rawStatus === "urgent" || rawStatus === "resolved" ? rawStatus : "pending";

  return {
    id: String(row.id),
    teacherId: String(row.teacher_id),
    teacherName: String(row.teacher_name),
    teacherEmail: String(row.teacher_email),
    studentName: String(row.student_name),
    studentEmail: String(row.student_email),
    question: String(row.question),
    emailSent: Boolean(row.email_sent),
    emailId: row.email_id ? String(row.email_id) : undefined,
    emailError: row.email_error ? String(row.email_error) : undefined,
    status: validStatus,
    teacherAnswer: row.teacher_answer ? String(row.teacher_answer) : undefined,
    addedToKb: Boolean(row.added_to_kb),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

function generateAccessCode(courseOrName: string): string {
  const prefix =
    courseOrName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 4) || "CURSO";

  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

export async function getDb(): Promise<DatabaseSnapshot> {
  await ensureSchema();
  const sql = getPooledSql();

  const [teacherRows, contentRows, escalationRows] = await Promise.all([
    sql`SELECT * FROM teachers ORDER BY created_at DESC`,
    sql`SELECT * FROM course_contents ORDER BY created_at DESC`,
    sql`SELECT * FROM escalations ORDER BY created_at DESC`,
  ]);

  return {
    teachers: teacherRows.map(mapTeacherRow),
    contents: contentRows.map(mapContentRow),
    escalations: escalationRows.map(mapEscalationRow),
  };
}

export async function loginOrRequestTeacher(params: {
  email: string;
  name?: string;
  course?: string;
  customCode?: string;
}): Promise<Teacher> {
  await ensureSchema();
  const sql = getPooledSql();
  const normalizedEmail = params.email.trim().toLowerCase();

  const existingRows = await sql`
    SELECT * FROM teachers WHERE LOWER(email) = ${normalizedEmail} LIMIT 1
  `;

  if (existingRows.length > 0) {
    const current = mapTeacherRow(existingRows[0]);
    const nextName = params.name?.trim() || current.name;
    const nextCourse = params.course?.trim() || current.course;
    let nextCode = current.accessCode;

    if (params.customCode?.trim()) {
      const candidate = params.customCode.trim().toUpperCase();
      const conflict = await sql`
        SELECT id FROM teachers WHERE UPPER(access_code) = ${candidate} AND id <> ${current.id} LIMIT 1
      `;
      if (conflict.length === 0) {
        nextCode = candidate;
      }
    }

    const updatedRows = await sql`
      UPDATE teachers
      SET name = ${nextName}, course = ${nextCourse}, access_code = ${nextCode}
      WHERE id = ${current.id}
      RETURNING *
    `;
    return mapTeacherRow(updatedRows[0]);
  }

  const courseName = params.course?.trim() || "Cálculo II";
  const teacherName = params.name?.trim() || normalizedEmail.split("@")[0];
  let accessCode =
    params.customCode?.trim().toUpperCase() || generateAccessCode(courseName);

  const codeCheck = await sql`
    SELECT id FROM teachers WHERE UPPER(access_code) = ${accessCode} LIMIT 1
  `;
  if (codeCheck.length > 0) {
    accessCode = generateAccessCode(courseName);
  }

  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const insertedRows = await sql`
    INSERT INTO teachers (id, name, email, course, access_code, status)
    VALUES (${id}, ${teacherName}, ${normalizedEmail}, ${courseName}, ${accessCode}, 'pending')
    RETURNING *
  `;

  return mapTeacherRow(insertedRows[0]);
}

export async function updateTeacherStatus(
  teacherId: string,
  status: TeacherStatus,
  accessCode?: string
): Promise<Teacher | null> {
  await ensureSchema();
  const sql = getPooledSql();

  if (accessCode?.trim()) {
    const cleanCode = accessCode.trim().toUpperCase();
    const duplicate = await sql`
      SELECT id FROM teachers WHERE UPPER(access_code) = ${cleanCode} AND id <> ${teacherId} LIMIT 1
    `;
    if (duplicate.length > 0) {
      throw new Error("Ese código ya está siendo usado por otro docente.");
    }

    const rows = await sql`
      UPDATE teachers
      SET status = ${status}, access_code = ${cleanCode}
      WHERE id = ${teacherId}
      RETURNING *
    `;
    return rows.length > 0 ? mapTeacherRow(rows[0]) : null;
  }

  const rows = await sql`
    UPDATE teachers
    SET status = ${status}
    WHERE id = ${teacherId}
    RETURNING *
  `;
  return rows.length > 0 ? mapTeacherRow(rows[0]) : null;
}

export async function getTeacherById(
  teacherId: string
): Promise<Teacher | null> {
  await ensureSchema();
  const sql = getPooledSql();
  const rows = await sql`SELECT * FROM teachers WHERE id = ${teacherId} LIMIT 1`;
  return rows.length > 0 ? mapTeacherRow(rows[0]) : null;
}

export async function getTeacherByCode(
  accessCode: string
): Promise<Teacher | null> {
  await ensureSchema();
  const sql = getPooledSql();
  const clean = accessCode.trim().toUpperCase();
  if (!clean) return null;
  const rows = await sql`
    SELECT * FROM teachers WHERE UPPER(access_code) = ${clean} LIMIT 1
  `;
  return rows.length > 0 ? mapTeacherRow(rows[0]) : null;
}

export async function addCourseContent(params: {
  teacherId: string;
  category: ContentCategory;
  title: string;
  content: string;
}): Promise<CourseContent> {
  await ensureSchema();
  const sql = getPooledSql();

  const teacher = await getTeacherById(params.teacherId);
  if (!teacher) {
    throw new Error("Docente no encontrado.");
  }
  if (teacher.status !== "approved") {
    throw new Error(
      "El docente aún no ha sido aceptado por el Administrador."
    );
  }

  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const rows = await sql`
    INSERT INTO course_contents (id, teacher_id, teacher_email, teacher_name, category, title, content)
    VALUES (
      ${id},
      ${teacher.id},
      ${teacher.email},
      ${teacher.name},
      ${params.category},
      ${params.title.trim()},
      ${params.content.trim()}
    )
    RETURNING *
  `;

  return mapContentRow(rows[0]);
}

export async function deleteCourseContent(
  contentId: string,
  teacherId?: string
): Promise<boolean> {
  await ensureSchema();
  const sql = getPooledSql();

  const rows = teacherId
    ? await sql`
        DELETE FROM course_contents
        WHERE id = ${contentId} AND teacher_id = ${teacherId}
        RETURNING id
      `
    : await sql`
        DELETE FROM course_contents
        WHERE id = ${contentId}
        RETURNING id
      `;

  return rows.length > 0;
}

export async function getContentsByTeacher(
  teacherId?: string
): Promise<CourseContent[]> {
  await ensureSchema();
  const sql = getPooledSql();

  const rows = teacherId
    ? await sql`
        SELECT * FROM course_contents
        WHERE teacher_id = ${teacherId}
        ORDER BY created_at DESC
      `
    : await sql`
        SELECT * FROM course_contents
        ORDER BY created_at DESC
      `;

  return rows.map(mapContentRow);
}

export async function addEscalationRecord(
  record: Omit<EscalationRecord, "id" | "createdAt">
): Promise<EscalationRecord> {
  await ensureSchema();
  const sql = getPooledSql();

  const isUrgent = /parcial|examen|entrega|hoy|mañana|urgente|calificaci|nota/i.test(
    record.question
  );
  const status: EscalationStatus = record.status || (isUrgent ? "urgent" : "pending");

  const id = `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const rows = await sql`
    INSERT INTO escalations (
      id, teacher_id, teacher_name, teacher_email, student_name, student_email, question, email_sent, email_id, email_error, status, teacher_answer, added_to_kb
    )
    VALUES (
      ${id},
      ${record.teacherId},
      ${record.teacherName},
      ${record.teacherEmail},
      ${record.studentName},
      ${record.studentEmail},
      ${record.question},
      ${record.emailSent},
      ${record.emailId ?? null},
      ${record.emailError ?? null},
      ${status},
      ${record.teacherAnswer ?? null},
      ${Boolean(record.addedToKb)}
    )
    RETURNING *
  `;

  return mapEscalationRow(rows[0]);
}

export async function resolveEscalationRecords(params: {
  escalationIds: string[];
  teacherId?: string;
  question: string;
  answer: string;
  addToKb: boolean;
}): Promise<{ updatedCount: number; kbContent?: CourseContent }> {
  await ensureSchema();
  const sql = getPooledSql();

  let updatedCount = 0;
  for (const escId of params.escalationIds) {
    const rows = await sql`
      UPDATE escalations
      SET status = 'resolved',
          teacher_answer = ${params.answer.trim()},
          added_to_kb = ${params.addToKb}
      WHERE id = ${escId}
      RETURNING id
    `;
    updatedCount += rows.length;
  }

  let kbContent: CourseContent | undefined;
  if (params.addToKb && params.teacherId) {
    const teacher = await getTeacherById(params.teacherId);
    if (teacher && teacher.status === "approved") {
      kbContent = await addCourseContent({
        teacherId: teacher.id,
        category: "Información general",
        title: `Respuesta docente: ${params.question.slice(0, 80)}`,
        content: `Pregunta frecuente de estudiantes: ${params.question}\nRespuesta oficial del profesor (${teacher.name}): ${params.answer.trim()}`,
      });
    }
  }

  return { updatedCount, kbContent };
}
