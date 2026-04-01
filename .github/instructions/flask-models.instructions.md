---
description: "Use when creating or editing SQLAlchemy models in this project. Covers naming conventions, FK patterns, relationships, and how models connect in the bono-solidario raffle system."
applyTo: "app/models/**/*.py"
---
# Reglas para Modelos SQLAlchemy — Bono Solidario

## Estructura obligatoria
- Heredar de `db.Model` (importar `db` desde `app`)
- Definir siempre `__tablename__` explícito en snake_case (ej: `__tablename__ = 'commission'`)
- Clave primaria: `id = db.Column(db.Integer, primary_key=True)`

## Foreign Keys y relaciones
- FKs usan el nombre de tabla, NO el nombre del modelo: `db.ForeignKey('user.id')` (no `'User.id'`)
- Relaciones opcionales deben tener `nullable=True`
- Para evitar importaciones circulares, usar strings en `db.relationship('ModelName', ...)`
- El modelo `Seller` NO tiene `db.relationship` hacia `Ticket` — la FK existe en DB pero sin backref en el ORM

## Patrones de relación establecidos
```python
# 1:N — Raffle → Prizes (ya existente, seguir este patrón)
prizes = db.relationship('Prize', backref='raffle', lazy=True)

# 1:1 opcional — User ↔ Buyer (ya existente, seguir este patrón)
user = db.relationship('User', backref=db.backref('buyer_profile', uselist=False))

# 1:N con FK opcional — Buyer → Tickets (ya existente)
tickets = db.relationship('Ticket', backref='buyer_obj', lazy=True)
```

## Campos con valor por defecto
```python
is_active = db.Column(db.Boolean, default=False)
estado = db.Column(db.String(20), default='activo')
payment_method = db.Column(db.String(20), nullable=False, default='Virtual')
```

## Reglas de importación en modelos
```python
from app import db
# NO importar otros modelos en el nivel del módulo para evitar dependencias circulares
# Si necesitas referenciar otro modelo en un método, importar dentro del método:
def get_boletas_disponibles(self):
    from app.models.ticket import Ticket  # importación local
    ...
```

## Registro de modelos
- Al crear un modelo nuevo, agregarlo inmediatamente en `app/models/__init__.py`
- Formato: `from .nombre_archivo import NombreClase`
- Luego crear la migración con `flask db migrate -m "agregar modelo NombreClase"`

## Campos de texto con longitud controlada
| Tipo de dato | Longitud sugerida |
|---|---|
| email | `String(120)` |
| username | `String(64)` |
| password_hash | `String(256)` |
| nombre | `String(128)` |
| identificacion | `String(32)` |
| telefono | `String(32)` |
| role | `String(20)` |
| estado | `String(20)` |
