/**
 * Prueba de envío de correo con Brevo.
 * Uso: node scripts/test-brevo.js [destino]
 * Lee la configuración de .env (BREVO_API_KEY) y envía un correo de prueba.
 */

const fs = require("fs");
const path = require("path");

function loadEnv() {
  for (const name of [".env", ".env.local"]) {
    const envPath = path.join(__dirname, "..", name);
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
      }
    }
  }
}
loadEnv();

const destino = process.argv[2] || "lajova666@gmail.com";

(async () => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("ERROR: BREVO_API_KEY no está definida en .env");
    process.exit(2);
  }

  const fromRaw = process.env.EMAIL_FROM || "";
  const extraerEmail = (v) => {
    const m = (v || "").match(/<([^<>]+)>/);
    return m ? m[1].trim() : (v || "").trim();
  };
  const extraerNombre = (v) => {
    const m = (v || "").match(/^([^<]+)</);
    return m ? m[1].trim() : "";
  };
  const senderEmail = extraerEmail(fromRaw) || process.env.EMAIL_USER;
  const senderName = process.env.BREVO_SENDER_NAME || extraerNombre(fromRaw) || "Bono Solidario";

  if (!senderEmail) {
    console.error("ERROR: Falta EMAIL_FROM o EMAIL_USER para el sender de Brevo.");
    process.exit(2);
  }

  console.log("Enviando vía Brevo →", destino, "(sender:", `${senderName} <${senderEmail}>` + ")");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: destino }],
      subject: "Prueba - Bono Solidario (Brevo)",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <div style="background:#16a34a;color:#fff;padding:20px;text-align:center">
            <h1 style="margin:0;font-size:20px">Bono Solidario</h1>
          </div>
          <div style="padding:24px;color:#1e293b">
            <h2 style="color:#14532d">Correo de prueba (Brevo)</h2>
            <p>Este es un correo de prueba enviado a través de la API de Brevo.</p>
            <p>Enviado el ${new Date().toLocaleString("es-CO")}.</p>
          </div>
        </div>`
    })
  });

  const texto = await res.text().catch(() => "");
  if (res.ok) {
    let data = null;
    try {
      data = JSON.parse(texto);
    } catch {}
    console.log("✓ Correo enviado. messageId:", data?.messageId || "n/d");
  } else {
    console.error("✘ Brevo error", res.status, ":", texto.slice(0, 500));
    process.exit(1);
  }
})();