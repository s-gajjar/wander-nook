import nodemailer from "nodemailer";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

export type SendTransactionalEmailResult = {
  sent: boolean;
  providerId?: string;
  skippedReason?: string;
};

function env(name: string) {
  return (process.env[name] || "").trim();
}

function getFromEmail() {
  return env("MAIL_FROM") || env("RESEND_FROM_EMAIL") || "support@wondernook.in";
}

function hasSmtpConfig() {
  return Boolean(env("SMTP_HOST") && env("SMTP_PORT") && env("SMTP_USER") && env("SMTP_PASS"));
}

function hasResendConfig() {
  return Boolean(env("RESEND_API_KEY"));
}

async function sendUsingSmtp(input: SendTransactionalEmailInput): Promise<SendTransactionalEmailResult> {
  const transporter = nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port: Number(env("SMTP_PORT")),
    secure: env("SMTP_SECURE").toLowerCase() === "true" || Number(env("SMTP_PORT")) === 465,
    auth: {
      user: env("SMTP_USER"),
      pass: env("SMTP_PASS"),
    },
  });

  const info = await transporter.sendMail({
    from: getFromEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: (input.attachments || []).map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })),
  });

  return {
    sent: true,
    providerId: info.messageId,
  };
}

async function sendUsingResend(input: SendTransactionalEmailInput): Promise<SendTransactionalEmailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: (input.attachments || []).map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
        ...(attachment.contentType ? { content_type: attachment.contentType } : {}),
      })),
    }),
  });

  const body = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; name?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      body?.message || body?.name || `Failed to send email (HTTP ${response.status})`
    );
  }

  return {
    sent: true,
    providerId: body?.id,
  };
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<SendTransactionalEmailResult> {
  if (hasSmtpConfig()) {
    return sendUsingSmtp(input);
  }

  if (hasResendConfig()) {
    return sendUsingResend(input);
  }

  return {
    sent: false,
    skippedReason: "missing_email_provider_config",
  };
}
