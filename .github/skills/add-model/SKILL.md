---
name: add-model
description: "Workflow para crear un nuevo modelo SQLAlchemy en bono-solidario. Usar cuando: agregar entidad nueva al sistema, crear tabla nueva, modelar una relación que no existe. Incluye registro en __init__.py, relaciones con modelos existentes y creación de migración."
argument-hint: "Describe el modelo a crear: ej. 'modelo Configuracion con campos clave y valor' o 'modelo Cupon relacionado con Raffle'"
---
# Skill: Agregar Nuevo Modelo SQLAlchemy

## Cuándo usar este skill
- Crear una entidad nueva en la base de datos
- Agregar una tabla que no existe en el sistema
- Modelar una relación nueva entre entidades existentes

## Modelos existentes
Antes de crear uno nuevo, verificar que no existe ya en:
- `app/models/user.py` — User (auth, roles)
- `app/models/raffle.py` — Raffle (sorteos)
- `app/models/ticket.py` — Ticket (boletas)
- `app/models/buyer.py` — Buyer (compradores)
- `app/models/seller.py` — Seller (vendedores)
- `app/models/commission.py` — Commission
- `app/models/notification.py` — Notification
- `app/models/prize.py` — Prize

## Procedimiento

### Paso 1 — Crear el archivo del modelo
Crear `app/models/{nombre}.py`:
```python
from app import db

class NombreModelo(db.Model):
    __tablename__ = 'nombre_tabla'  # snake_case, obligatorio

    id = db.Column(db.Integer, primary_key=True)
    # campos...

    def __init__(self, campo1, campo2):
        self.campo1 = campo1
        self.campo2 = campo2
```

### Paso 2 — Registrar en `app/models/__init__.py`
Agregar la importación al final de las existentes:
```python
from .nombre import NombreModelo
```

### Paso 3 — Definir relaciones con modelos existentes (si aplica)
Si el nuevo modelo se relaciona con uno existente, actualizar **ambos lados**:

```python
# En el nuevo modelo (lado "muchos"):
raffle_id = db.Column(db.Integer, db.ForeignKey('raffle.id'), nullable=False)

# En Raffle (lado "uno") — si se quiere acceso inverso:
nuevos = db.relationship('NombreModelo', backref='raffle', lazy=True)
```

Patrón de FK usando tabla, no clase:
```python
db.ForeignKey('user.id')     # ✅ nombre de tabla
db.ForeignKey('User.id')     # ❌ nombre de clase — ERROR
```

### Paso 4 — Crear la migración
Usar el skill `/add-migration` o ejecutar directamente:
```bash
flask db migrate -m "crear modelo NombreModelo"
flask db upgrade
```

### Paso 5 — Verificar
- [ ] El archivo está en `app/models/`
- [ ] Importado en `app/models/__init__.py`
- [ ] Migración creada y aplicada
- [ ] Si se relaciona con otros modelos, ambos lados actualizados
- [ ] `__tablename__` definido explícitamente

## Plantilla completa de modelo
```python
from app import db

class NombreModelo(db.Model):
    __tablename__ = 'nombre_tabla'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(128), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    activo = db.Column(db.Boolean, nullable=False, default=True)
    creado_en = db.Column(db.DateTime, nullable=True)

    # FK ejemplo
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffle.id'), nullable=False)

    def __init__(self, nombre, raffle_id, descripcion=None):
        self.nombre = nombre
        self.raffle_id = raffle_id
        self.descripcion = descripcion
```

## Archivos de referencia
- `app/models/buyer.py` — ejemplo de modelo con FK opcional a User y relación a Ticket
- `app/models/raffle.py` — ejemplo de modelo con método de negocio (`get_boletas_disponibles`)
- `app/models/__init__.py` — lista de importaciones existentes
