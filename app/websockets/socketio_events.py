from app import socketio

@socketio.on('notify_winner')
def handle_notify_winner(data):
    # data: {'user_id': ..., 'message': ...}
    # Aquí lógica para notificar al ganador en tiempo real
    socketio.emit('winner_notification', data)
