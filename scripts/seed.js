/**
 * Script de seed: crea datos de prueba para la aplicación Bono Solidario.
 *
 * Uso:
 *   1. Configura tu conexión en .env.local (MONGODB_URI) o en la variable de entorno.
 *   2. Ejecuta: npm run seed
 *
 * Crea:
 *   - Usuarios: admin, vendedor y un cliente.
 *   - Bonos solidarios de ejemplo.
 *   - Una venta de prueba.
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Carga manual de .env.local si no está en el entorno
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  }
}
loadEnv();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bonos-solidarios";

// ─── Esquemas ───────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  password: String,
  rol: { type: String, enum: ["admin", "vendedor", "usuario"], default: "usuario" },
  telefono: String,
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now }
});

const BonoSchema = new mongoose.Schema(
  {
    titulo: String,
    descripcion: String,
    valor: Number,
    fechaEmision: Date,
    fechaVencimiento: Date,
    imagen: String,
    estado: { type: String, enum: ["activo", "inactivo", "agotado"], default: "activo" },
    stock: { type: Number, default: null },
    vendidoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fechaCreacion: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const VentaSchema = new mongoose.Schema(
  {
    ordenId: { type: String, unique: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bonos: [
      {
        bonoId: { type: mongoose.Schema.Types.ObjectId, ref: "Bono" },
        titulo: String,
        cantidad: Number,
        precioUnitario: Number
      }
    ],
    total: Number,
    estado: { type: String, enum: ["pendiente", "pagado", "cancelado"], default: "pendiente" },
    metodoPago: { type: String, enum: ["transferencia", "tarjeta", "efectivo"] },
    fechaVenta: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Bono = mongoose.models.Bono || mongoose.model("Bono", BonoSchema);
const Venta = mongoose.models.Venta || mongoose.model("Venta", VentaSchema);

// ─── Datos de prueba ────────────────────────────────────────────
const bonosSeed = [
  {
    titulo: "Bono Solidario Navidad",
    descripcion:
      "Apoya la campaña navideña para entregar regalos a niños en situación vulnerable. Cada bono contribuye a una sonrisa más.",
    valor: 50000,
    fechaEmision: new Date("2026-01-15"),
    fechaVencimiento: new Date("2026-12-15"),
    imagen: "",
    estado: "activo",
    stock: 500
  },
  {
    titulo: "Bono Educación para Todos",
    descripcion:
      "Financia útiles escolares y becas para estudiantes de bajos recursos en zonas rurales.",
    valor: 100000,
    fechaEmision: new Date("2026-02-01"),
    fechaVencimiento: new Date("2026-11-30"),
    imagen: "",
    estado: "activo",
    stock: null
  },
  {
    titulo: "Bono Salud Comunitaria",
    descripcion:
      "Contribuye a la compra de medicamentos y equipos médicos para centros de salud comunitarios.",
    valor: 75000,
    fechaEmision: new Date("2026-03-10"),
    fechaVencimiento: null,
    imagen: "",
    estado: "activo",
    stock: 200
  },
  {
    titulo: "Bono Alimentación Solidaria",
    descripcion:
      "Apoya la entrega de mercados a familias en situación de emergencia alimentaria.",
    valor: 40000,
    fechaEmision: new Date("2026-04-01"),
    fechaVencimiento: new Date("2026-09-30"),
    imagen: "",
    estado: "activo",
    stock: 1000
  },
  {
    titulo: "Bono Emprendimiento Rural",
    descripcion:
      "Fomenta proyectos de emprendimiento para mujeres cabeza de familia en comunidades rurales.",
    valor: 200000,
    fechaEmision: new Date("2026-05-05"),
    fechaVencimiento: null,
    imagen: "",
    estado: "activo",
    stock: 100
  },
  {
    titulo: "Bono Edición Aniversario",
    descripcion:
      "Bono conmemorativo del aniversario de la fundación. Edición limitada para coleccionistas.",
    valor: 150000,
    fechaEmision: new Date("2026-06-01"),
    fechaVencimiento: null,
    imagen: "",
    estado: "agotado",
    stock: 0
  }
];

async function run() {
  console.log(`Conectando a ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log("Conectado.");

  // Limpiar colecciones (solo datos de seed)
  await Promise.all([User.deleteMany({}), Bono.deleteMany({}), Venta.deleteMany({})]);

  // Usuarios
  const admin = await User.create({
    nombre: "Administrador",
    email: "admin@bonosolidario.com",
    password: await bcrypt.hash("admin123", 10),
    rol: "admin"
  });

  const vendedor = await User.create({
    nombre: "Vendedor Demo",
    email: "vendedor@bonosolidario.com",
    password: await bcrypt.hash("vendedor123", 10),
    rol: "vendedor"
  });

  const cliente = await User.create({
    nombre: "Cliente Demo",
    email: "cliente@bonosolidario.com",
    password: await bcrypt.hash("cliente123", 10),
    rol: "usuario",
    telefono: "+57 300 000 0000"
  });

  console.log("Usuarios creados:");
  console.log("  admin@bonosolidario.com / admin123  (admin)");
  console.log("  vendedor@bonosolidario.com / vendedor123  (vendedor)");
  console.log("  cliente@bonosolidario.com / cliente123  (usuario)");

  // Bonos
  const bonos = [];
  for (const b of bonosSeed) {
    const bono = await Bono.create({
      ...b,
      vendidoPor: b.estado === "agotado" ? vendedor._id : vendedor._id
    });
    bonos.push(bono);
  }
  console.log(`Bonos creados: ${bonos.length}`);

  // Venta de prueba
  const venta = await Venta.create({
    ordenId: `BS-SEED-${Date.now().toString(36).toUpperCase()}`,
    usuario: cliente._id,
    bonos: [
      {
        bonoId: bonos[0]._id,
        titulo: bonos[0].titulo,
        cantidad: 2,
        precioUnitario: bonos[0].valor
      },
      {
        bonoId: bonos[3]._id,
        titulo: bonos[3].titulo,
        cantidad: 1,
        precioUnitario: bonos[3].valor
      }
    ],
    total: bonos[0].valor * 2 + bonos[3].valor,
    estado: "pagado",
    metodoPago: "transferencia"
  });
  console.log(`Venta de prueba creada: ${venta.ordenId}`);

  await mongoose.disconnect();
  console.log("\nSeed completado. ¡Listo para usar!");
}

run().catch(async (err) => {
  console.error("Error en el seed:", err);
  await mongoose.disconnect();
  process.exit(1);
});