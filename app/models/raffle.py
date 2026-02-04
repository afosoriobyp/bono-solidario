from app import db

class Raffle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    fecha_caducidad = db.Column(db.DateTime, nullable=True)
    loteria = db.Column(db.String(100), nullable=True)
    imagen = db.Column(db.String(255), nullable=True)
    responsable = db.Column(db.String(100), nullable=True)
    telefono = db.Column(db.String(50), nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=True)
    commission_pct = db.Column(db.Float, nullable=False)
    valor = db.Column(db.Float, nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    numeracion_boletas_disponibles = db.Column(db.String, nullable=True)  # Puede almacenar una lista o rango como texto
    # Relación con premios
    prizes = db.relationship('Prize', backref='raffle', lazy=True)
    # ...otros campos relevantes...

    def get_boletas_disponibles(self):
        """
        Devuelve una lista de boletas disponibles según el rango y los tickets vendidos.
        Ejemplo de numeracion_boletas_disponibles: '0000-9999', '000-999', '00-99'
        """
        from app.models.ticket import Ticket
        if not self.numeracion_boletas_disponibles:
            return []
        try:
            inicio, fin = self.numeracion_boletas_disponibles.split('-')
            inicio, fin = int(inicio), int(fin)
            longitud = len(str(self.numeracion_boletas_disponibles.split('-')[0]))
            todos = [str(num).zfill(longitud) for num in range(inicio, fin+1)]
        except Exception:
            return []
        vendidos = set([t.number for t in Ticket.query.filter_by(raffle_id=self.id, is_sold=True).all()])
        disponibles = [n for n in todos if n not in vendidos]
        return disponibles
