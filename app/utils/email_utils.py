from flask_mail import Message
from flask import current_app

def enviar_boleta_email(mail, destinatario, raffle_name, buyer_name, numeros, valor_total, fecha_caducidad=None, loteria=None, descripcion=None, imagen_url=None, responsable=None, telefono=None):
        # Calcular valor unitario
        valor_unitario = 0
        if numeros and len(numeros) > 0:
                try:
                        valor_unitario = int(valor_total) // len(numeros)
                except Exception:
                        valor_unitario = valor_total
        # Crear mensaje HTML visualmente más elegante
        html = f'''
        <div style="max-width:400px;margin:24px auto;padding:16px;border-radius:12px;border:1px solid #eee;box-shadow:0 2px 8px #0001;font-family:sans-serif;background:#fff;">
            {f'<div style="text-align:center;"><img src="{imagen_url}" alt="Imagen de la rifa" style="max-height:220px;border-radius:8px;box-shadow:0 2px 8px #0002;margin-bottom:16px;"></div>' if imagen_url else ''}
            <div style="text-align:center;">
                <h2 style="margin-bottom:12px;">{raffle_name}</h2>
            </div>
            <div style="margin:0 0 8px 0;text-align:center;">
                <p style="margin:0;"><strong>Valor de la rifa:</strong> ${valor_unitario}</p>
                {f'<p style="margin:0;"><strong>Fecha caducidad:</strong> {fecha_caducidad}</p>' if fecha_caducidad else ''}
                {f'<p style="margin:0;"><strong>Lotería:</strong> {loteria}</p>' if loteria else ''}
                {f'<p style="margin:0;">{descripcion}</p>' if descripcion else ''}
            </div>
            <hr style="margin:12px 0;">
            <div style="margin:0 0 8px 0;">
                <p style="margin:0;"><strong>Comprador:</strong> {buyer_name}</p>
                <p style="margin:0;"><strong>Números:</strong> {', '.join(numeros)}</p>
                <p style="margin:0;"><strong>Total pagado:</strong> ${valor_total}</p>
            </div>
            <hr style="margin:12px 0;">
            <div style="margin:0 0 8px 0;">
                {f'<p style="margin:0;"><strong>Responsable:</strong> {responsable}</p>' if responsable else ''}
                {f'<p style="margin:0;"><strong>Teléfono:</strong> {telefono}</p>' if telefono else ''}
            </div>
        </div>
        '''
        msg = Message('Tu compra de bono',
                                    sender=current_app.config['MAIL_USERNAME'],
                                    recipients=[destinatario])
        # Texto plano incluye responsable y teléfono si están disponibles
        plain = f"Hola {buyer_name},\nAdjuntamos el resumen de tu compra de bono(s) para la rifa '{raffle_name}'.\nNúmeros: {', '.join(numeros)}\nTotal pagado: ${valor_total}"
        if responsable:
            plain += f"\nResponsable: {responsable}"
        if telefono:
            plain += f"\nTeléfono: {telefono}"
        msg.body = plain
        msg.html = html
        return msg
