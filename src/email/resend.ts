import { Resend } from "resend";

export interface SendTeacherEscalationParams {
  teacherEmail: string;
  teacherName: string;
  courseName: string;
  studentName: string;
  studentEmail: string;
  question: string;
}

export interface SendTeacherEscalationResult {
  sent: boolean;
  emailId?: string;
  error?: string;
}

function buildHtmlBody(params: SendTeacherEscalationParams, sandboxNote?: string) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5;">
      ${
        sandboxNote
          ? `<p style="background: #fef3c7; padding: 8px 12px; border-radius: 4px; font-size: 13px;">${sandboxNote}</p>`
          : ""
      }
      <h2>Nueva consulta estudiantil sin respuesta en el Chatbot (Gemma 4)</h2>
      <p>Hola <strong>${params.teacherName}</strong> (${params.teacherEmail}),</p>
      <p>El chatbot de <strong>Gemma 4</strong> no encontró información suficiente en los contenidos cargados de <em>${params.courseName}</em> para responder la siguiente consulta:</p>
      <hr />
      <p><strong>Estudiante:</strong> ${params.studentName} (${params.studentEmail})</p>
      <p><strong>Pregunta:</strong></p>
      <blockquote style="background: #f4f4f5; padding: 12px; border-left: 4px solid #18181b;">
        ${params.question}
      </blockquote>
      <hr />
      <p><small>Puedes responder directamente a este correo para contestarle a ${params.studentEmail}.</small></p>
    </div>
  `;
}

export async function sendEscalationEmailToTeacher(
  params: SendTeacherEscalationParams
): Promise<SendTeacherEscalationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const toEmail = params.teacherEmail || process.env.PROFESSOR_EMAIL;

  if (!toEmail) {
    return {
      sent: false,
      error: "No se encontró el correo del docente destinatario.",
    };
  }

  if (!apiKey || apiKey === "re_xxxxxxxxxxxx") {
    return {
      sent: false,
      error:
        "RESEND_API_KEY no configurada en .env (consulta registrada en el panel del docente).",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: params.studentEmail,
      subject: `Nueva consulta de ${params.studentName} (${params.courseName})`,
      html: buildHtmlBody(params),
    });

    if (error) {
      // If Resend is in sandbox mode (unverified domain), it tells us which email is allowed:
      // e.g. "You can only send testing emails to your own email address (user@gmail.com)..."
      const match = error.message?.match(/\(([^)]+@[^)]+)\)/);
      const allowedSandboxEmail = match?.[1];

      if (
        allowedSandboxEmail &&
        allowedSandboxEmail.toLowerCase() !== toEmail.toLowerCase()
      ) {
        const retry = await resend.emails.send({
          from: fromEmail,
          to: allowedSandboxEmail,
          replyTo: params.studentEmail,
          subject: `[Para: ${toEmail}] Nueva consulta de ${params.studentName} (${params.courseName})`,
          html: buildHtmlBody(
            params,
            `Modo de prueba Resend activo: correo redirigido a ${allowedSandboxEmail} (destinatario docente original: ${toEmail}).`
          ),
        });

        if (!retry.error) {
          return {
            sent: true,
            emailId: retry.data?.id,
          };
        }
      }

      return {
        sent: false,
        error: error.message,
      };
    }

    return {
      sent: true,
      emailId: data?.id,
    };
  } catch (err) {
    return {
      sent: false,
      error:
        err instanceof Error
          ? err.message
          : "Error enviando correo con Resend",
    };
  }
}
