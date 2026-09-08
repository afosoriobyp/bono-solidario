/**
 * Prueba de subida a Cloudflare R2.
 * Uso: node scripts/test-r2.js
 * Lee la configuración de .env y sube un archivo de prueba al bucket.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const archivo = process.argv[2] || path.join(__dirname, "..", "bono-solidario.png");
const carpeta = process.argv[3] || "bonos";

(async () => {
  const ok =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET;

  if (!ok) {
    console.error("ERROR: Faltan variables R2 en .env");
    process.exit(2);
  }

  if (!fs.existsSync(archivo)) {
    console.error("ERROR: El archivo no existe:", archivo);
    process.exit(2);
  }

  const cliente = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
  });

  const ext = path.extname(archivo) || ".png";
  const nombre = `test-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const key = `${carpeta}/${nombre}`;

  console.log("Subiendo:", key);
  await cliente.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: fs.readFileSync(archivo),
      ContentType: "image/png"
    })
  );
  console.log("✓ Subido a R2.");

  const urlBase = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  const url = `${urlBase}/${key}`;
  console.log("URL pública generada:", url);

  // Verificar acceso público de lectura
  try {
    const res = await fetch(url, { method: "HEAD" });
    console.log("GET pública → HTTP", res.status, res.ok ? "✓ accesible" : "✗ no accesible");
  } catch (e) {
    console.log("GET pública → error de red:", e.message);
  }

  // Limpiar el archivo de prueba
  await cliente.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
  );
  console.log("✓ Archivo de prueba eliminado del bucket.");
})()
  .catch((err) => {
    console.error("✘ Error:", err.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));