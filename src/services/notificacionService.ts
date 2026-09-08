import { mailTemplate } from "@/lib/email";
import { encolarEmail } from "@/services/emailQueueService";

export type DatosVentaNotificacion = {
  ordenId: string;
  nombreUsuario: string;
  emailUsuario: string;
  items: { titulo: string; cantidad: number; precioUnitario: number }[];
  total: number;
  fechaVenta: Date;
  metodoPago?: string;
  estado: string;
  comprobanteUrl?: string;
};

const METODO_LABEL: Record<string, string> = {
  transferencia: "Transferencia bancaria",
  tarjeta: "Tarjeta de crédito/débito",
  efectivo: "Efectivo"
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(value);
}

function renderItems(items: DatosVentaNotificacion["items"]): string {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0">${i.titulo}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${i.cantidad}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${formatCurrency(i.precioUnitario)}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${formatCurrency(i.precioUnitario * i.cantidad)}</td>
        </tr>`
    )
    .join("");
}

function renderTable(items: DatosVentaNotificacion["items"], total: number): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;text-align:left">Bono</th>
          <th style="padding:8px">Cant.</th>
          <th style="padding:8px;text-align:right">P. Unitario</th>
          <th style="padding:8px;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${renderItems(items)}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:8px;text-align:right;font-weight:bold">Total</td>
          <td style="padding:8px;text-align:right;font-weight:bold">${formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>`;
}

export async function notificarCompraExitosa(data: DatosVentaNotificacion) {
  const body = `
    <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
    <p>¡Gracias por tu compra! Hemos recibido tu orden <strong>${data.ordenId}</strong> con el siguiente detalle:</p>
    ${renderTable(data.items, data.total)}
    <p><strong>Método de pago:</strong> ${METODO_LABEL[data.metodoPago || ""] || data.metodoPago || "-"}</p>
    <p><strong>Estado:</strong> ${data.estado.toUpperCase()}</p>
    <p>Una vez verifiquemos el pago, tu orden quedará confirmada. Si tienes dudas escríbenos a
    <a href="mailto:${process.env.ADMIN_EMAIL || "soporte@bonosolidario.com"}">${process.env.ADMIN_EMAIL || "soporte@bonosolidario.com"}</a>.</p>`;

  return encolarEmail({
    para: data.emailUsuario,
    asunto: `Confirmación de compra - Bono Solidario ${data.ordenId}`,
    html: mailTemplate("Compra registrada", body)
  });
}

export async function notificarNuevaVentaAdmin(data: DatosVentaNotificacion) {
  const admin = process.env.ADMIN_EMAIL;
  if (!admin) return { skipped: true };

  const body = `
    <p>Se ha registrado una nueva venta en la plataforma.</p>
    <p><strong>Cliente:</strong> ${data.nombreUsuario} (${data.emailUsuario})</p>
    <p><strong>Orden:</strong> ${data.ordenId}</p>
    <p><strong>Fecha:</strong> ${new Date(data.fechaVenta).toLocaleString("es-CO")}</p>
    ${renderTable(data.items, data.total)}
    <p><strong>Método de pago:</strong> ${METODO_LABEL[data.metodoPago || ""] || data.metodoPago || "-"}</p>
    <p><strong>Estado:</strong> ${data.estado.toUpperCase()}</p>
    ${data.comprobanteUrl ? `<p><a href="${data.comprobanteUrl}">Ver comprobante de pago</a></p>` : ""}
    <p><a href="${process.env.NEXTAUTH_URL}/admin/ventas">Ver detalle en el dashboard</a></p>`;

  return encolarEmail({
    para: admin,
    asunto: `Nueva venta registrada - Orden ${data.ordenId}`,
    html: mailTemplate("Nueva venta registrada", body)
  });
}

export async function notificarVentaVendedor(
  data: DatosVentaNotificacion,
  vendedorEmail: string,
  tituloBono: string
) {
  if (!vendedorEmail) return { skipped: true };

  const body = `
    <p>Se ha vendido un bono de tu autoría.</p>
    <p><strong>Bono:</strong> ${tituloBono}</p>
    <p><strong>Cliente:</strong> ${data.nombreUsuario} (${data.emailUsuario})</p>
    <p><strong>Orden:</strong> ${data.ordenId}</p>
    <p><strong>Valor de la venta:</strong> ${formatCurrency(data.total)}</p>
    <p><strong>Estado:</strong> ${data.estado.toUpperCase()}</p>`;

  return encolarEmail({
    para: vendedorEmail,
    asunto: `Nueva venta de tu bono - ${tituloBono}`,
    html: mailTemplate("Venta de tu bono", body)
  });
}