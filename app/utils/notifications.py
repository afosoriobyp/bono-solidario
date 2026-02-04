# Ejemplo de función para enviar notificaciones push


from pywebpush import webpush, WebPushException

# Configuración de llaves y claims VAPID para pywebpush
VAPID_SUBJECT = "mailto:bonos.perpetuosocorro@gmail.com"
VAPID_PUBLIC_KEY = "BKIYwBqTPrbGpynmAB7xpogOZB_YpvR8clGorKly1s54Yo9VifbDCb-UKH54Qr6OznrFTMWR5rujGOELCE_K4Y"
VAPID_PRIVATE_KEY = "63BN0JaA4pXO-PWT2-cFjxy0fRzBtQIPelmR3KJ0ZPs"

def send_push_notification(subscription_info, message):
    try:
        webpush(
            subscription_info=subscription_info,
            data=message,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_SUBJECT},
        )
    except WebPushException as ex:
        print("Error enviando notificación push:", repr(ex))
