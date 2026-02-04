from app import app, mail
from flask_mail import Message
from app.utils.email_utils import enviar_boleta_email

with app.app_context():
    destinatario = 'bonos.perpetuosocorro@gmail.com'
    raffle_name = 'Rifa de Prueba'
    buyer_name = 'Comprador Test'
    numeros = ['0001', '0002', '0003']
    valor_total = 30000
    msg = enviar_boleta_email(mail, destinatario, raffle_name, buyer_name, numeros, valor_total)
    mail.send(msg)
    print('Correo de prueba enviado a', destinatario)
