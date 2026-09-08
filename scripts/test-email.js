/**
 * Script de prueba de envío de correo.
 * Uso: node scripts/test-email.js
 * Lee la configuración de .env.local y envía un correo de prueba.
 */

const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

function loadEnv() {
  const files = [".env", ".env.local"];
  for (const name of files) {
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

console.log("Configuración de correo actual:");
console.log("  EMAIL_HOST:", process.env.EMAIL_HOST || "(sin definir)");
console.log("  EMAIL_PORT:", process.env.EMAIL_PORT || "(sin definir)");
console.log("  EMAIL_USER:", process.env.EMAIL_USER || "(sin definir)");
console.log(
  "  EMAIL_PASSWORD:",
  process.env.EMAIL_PASSWORD
    ? process.env.EMAIL_PASSWORD.replace(/./g, "*")
    : "(sin definir)"
);
console.log("  EMAIL_FROM:", process.env.EMAIL_FROM || process.env.EMAIL_USER || "(sin definir)");
console.log("");

const esPlaceholder =
  !process.env.EMAIL_USER ||
  !process.env.EMAIL_PASSWORD ||
  process.env.EMAIL_USER === "tuemail@gmail.com" ||
  process.env.EMAIL_PASSWORD === "tu-password-de-aplicacion";

if (esPlaceholder) {
  console.log("ADVERTENCIA: Las credenciales son placeholders de ejemplo.");
  console.log("Actualiza EMAIL_USER y EMAIL_PASSWORD en .env.local con tu Gmail y su contraseña de aplicación.");
  process.exit(2);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

(async () => {
  try {
    await transporter.verify();
    console.log("Conexión SMTP verificada OK.");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: destino,
      subject: "Prueba - Bono Solidario",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <div style="background:#16a34a;color:#fff;padding:20px;text-align:center">
            <h1 style="margin:0;font-size:20px">Bono Solidario</h1>
          </div>
          <div style="padding:24px;color:#1e293b">
            <h2 style="color:#14532d">Correo de prueba</h2>
            <p>Este es un correo de prueba del sistema Bono Solidario.</p>
            <p>Enviado el ${new Date().toLocaleString("es-CO")}.</p>
          </div>
        </div>`
    });

    console.log(`✓ Correo enviado a ${destino}. messageId: ${info.messageId}`);
  } catch (err) {
    console.error("✘ Error:", err.message);
    process.exit(1);
  }
})();