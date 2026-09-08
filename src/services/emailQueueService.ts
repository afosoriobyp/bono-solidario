import { connectDB } from "@/lib/db";
import EmailQueue, { IEmailQueue } from "@/models/EmailQueue";
import { sendMail } from "@/lib/email";

export type EmailEncolado = {
  para: string;
  asunto: string;
  html: string;
  tipo?: "transaccional" | "masivo";
};

function inicioDeHoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function encolarEmail(datos: EmailEncolado): Promise<void> {
  await connectDB();
  await EmailQueue.create({
    para: datos.para,
    asunto: datos.asunto,
    html: datos.html,
    tipo: datos.tipo || "transaccional"
  });
}

export async function encolarEmails(datos: EmailEncolado[]): Promise<number> {
  if (datos.length === 0) return 0;
  await connectDB();
  const docs = datos.map((d) => ({
    para: d.para,
    asunto: d.asunto,
    html: d.html,
    tipo: d.tipo || "transaccional"
  }));
  const creados = await EmailQueue.insertMany(docs);
  return creados.length;
}

function backoff(intentos: number): Date {
  const minutos = Math.min(Math.pow(2, intentos) * 60, 60 * 60); // 1,2,4...máx 60min
  return new Date(Date.now() + minutos * 1000);
}

export async function statsCola() {
  await connectDB();
  const [pendientes, enviados, errores, fallidos, enviadosHoy] = await Promise.all([
    EmailQueue.countDocuments({ estado: "pendiente" }),
    EmailQueue.countDocuments({ estado: "enviado" }),
    EmailQueue.countDocuments({ estado: "error" }),
    EmailQueue.countDocuments({ estado: "fallido" }),
    EmailQueue.countDocuments({ estado: "enviado", fechaEnvio: { $gte: inicioDeHoy() } })
  ]);

  const limiteDiario = Number(process.env.BREVO_DAILY_LIMIT) || 300;

  return { pendientes, enviados, errores, fallidos, enviadosHoy, limiteDiario };
}

async function enviarUno(doc: IEmailQueue): Promise<void> {
  await sendMail(doc.para, doc.asunto, doc.html);
}

/**
 * Procesa un lote de correos pendientes con concurrencia limitada.
 * Respeta el límite diario configurado y aplica reintentos con backoff.
 */
export async function procesarCola(limite = 20): Promise<{
  procesados: number;
  enviados: number;
  errores: number;
}> {
  await connectDB();

  const limiteDiario = Number(process.env.BREVO_DAILY_LIMIT) || 300;
  const enviadosHoy = await EmailQueue.countDocuments({
    estado: "enviado",
    fechaEnvio: { $gte: inicioDeHoy() }
  });
  const disponiblesHoy = Math.max(0, limiteDiario - enviadosHoy);
  if (disponiblesHoy <= 0) return { procesados: 0, enviados: 0, errores: 0 };

  const ahora = new Date();
  const batch = Math.min(limite, disponiblesHoy);

  const tareas: IEmailQueue[] = [];
  for (let i = 0; i < batch; i++) {
    const tarea = await EmailQueue.findOneAndUpdate(
      {
        estado: { $in: ["pendiente", "error"] },
        proximaIntento: { $lte: ahora },
        bloqueadoHasta: { $lte: ahora },
        intentos: { $lt: 3 }
      },
      {
        $set: { bloqueadoHasta: new Date(Date.now() + 5 * 60 * 1000) }
      },
      { sort: { fechaCreacion: 1 }, new: true }
    );
    if (!tarea) break;
    tareas.push(tarea);
  }

  let procesados = 0;
  let enviados = 0;
  let errores = 0;

  // Concurrencia limitada (máx 5 a la vez)
  for (let i = 0; i < tareas.length; i += 5) {
    const lote = tareas.slice(i, i + 5);
    await Promise.all(
      lote.map(async (tarea) => {
        procesados++;
        try {
          await enviarUno(tarea);
          await EmailQueue.updateOne(
            { _id: tarea._id },
            { $set: { estado: "enviado", fechaEnvio: new Date(), error: null, bloqueadoHasta: new Date(0) } }
          );
          enviados++;
        } catch (err) {
          const mensaje = err instanceof Error ? err.message : "Error de envío";
          const nuevosIntentos = (tarea.intentos || 0) + 1;
          const fallido = nuevosIntentos >= (tarea.maxIntentos || 3);
          await EmailQueue.updateOne(
            { _id: tarea._id },
            {
              $set: {
                estado: fallido ? "fallido" : "error",
                intentos: nuevosIntentos,
                error: mensaje,
                proximaIntento: fallido ? new Date(0) : backoff(nuevosIntentos),
                bloqueadoHasta: new Date(0)
              }
            }
          );
          errores++;
        }
      })
    );
  }

  return { procesados, enviados, errores };
}

export type { IEmailQueue };