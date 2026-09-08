import nodemailer from "nodemailer";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      })
    );
  }
  return transporterPromise;
}

function brevoConfigurado(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

function extraerEmail(valor: string | undefined): string {
  if (!valor) return "";
  const m = valor.match(/<([^<>]+)>/);
  return m ? m[1].trim() : valor.trim();
}

function extraerNombre(valor: string | undefined): string {
  if (!valor) return "";
  const m = valor.match(/^([^<]+)</);
  return m ? m[1].trim() : "";
}

async function enviarConBrevo(to: string, subject: string, html: string) {
  const fromRaw = process.env.EMAIL_FROM || "";
  const senderEmail =
    extraerEmail(fromRaw) || process.env.EMAIL_USER || "noreply@bonosolidario.com";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY as string,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || extraerNombre(fromRaw) || "Bono Solidario",
        email: senderEmail
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(`Brevo error ${res.status}: ${texto.slice(0, 300)}`);
  }
}

export async function sendMail(to: string, subject: string, html: string) {
  if (brevoConfigurado()) {
    return enviarConBrevo(to, subject, html);
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    // Modo desarrollo sin credenciales: solo loguea
    console.log(`[EMAIL] Para: ${to}\nAsunto: ${subject}\n\n${html}`);
    return { skipped: true };
  }

  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  return transporter.sendMail({ from, to, subject, html });
}

export function mailTemplate(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <div style="background:#16a34a;color:#fff;padding:20px;text-align:center">
      <h1 style="margin:0;font-size:20px">Bono Solidario</h1>
    </div>
    <div style="padding:24px;color:#1e293b">
      <h2 style="color:#14532d">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="background:#f8fafc;padding:16px;font-size:12px;color:#64748b;text-align:center">
      © ${new Date().getFullYear()} Bono Solidario · Gracias por tu apoyo
    </div>
  </div>`;
}