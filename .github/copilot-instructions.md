# Bono Solidario — Instrucciones de Proyecto

## Propósito del Sistema
Sistema de gestión de rifas solidarias. Permite administrar sorteos, vender boletas (por vendedores o compradores directos), asignar premios y enviar notificaciones. Desplegado en Render.com.

## Roles de usuario
| Rol | Acceso | Blueprint | Prefijo URL |
|-----|--------|-----------|-------------|
| `admin` | Gestión completa | `admin_bp` | `/admin` |
| `seller` | Venta de boletas y comisiones | `seller_bp` | `/seller` |
| `buyer` | Compra directa y reportes propios | `buyer_bp` | `/buyer` |

## Modelos y relaciones clave
```
User (tabla: user) — login y auth. Campos: id, username, email, password_hash, role, is_active
  └─ buyer_profile → Buyer (1:1 opcional)

Buyer (tabla: buyer) — datos del comprador (puede existir sin User)
  └─ tickets → Ticket[] (1:N)

Seller (tabla: seller) — vendedor (separado de User.role='seller')
  └─ NO tiene relación directa a Ticket en el ORM (FK existe en DB pero sin backref)

Raffle (tabla: raffle) — sorteo
  ├─ prizes → Prize[] (1:N)
  └─ tickets → via Ticket.raffle_id

Ticket (tabla: ticket)
  ├─ raffle_id → Raffle.id
  ├─ seller_id → User.id (el usuario vendedor)
  ├─ buyer_id  → User.id (opcional, si el comprador tiene cuenta)
  └─ buyer_data_id → Buyer.id (datos del comprador, puede ser sin cuenta)

Commission (tabla: commission) — seller_id, amount, paid (bool)
Notification (tabla: notification) — buyer_id, raffle_id, message, status, error
Prize (tabla: prize) — raffle_id, ticket_id (ganador)
```

## Patrones de código obligatorios

### Control de acceso (en todo blueprint)
```python
@blueprint.route('/ruta')
@login_required
def vista():
    if current_user.role != 'admin':   # ajustar rol según blueprint
        flash('Acceso denegado', 'danger')
        return redirect(url_for('auth.login'))
```

### Operaciones de base de datos
```python
try:
    db.session.add(obj)
    db.session.commit()
    flash('Operación exitosa.', 'success')
except Exception as e:
    db.session.rollback()
    flash(f'Error: {str(e)}', 'danger')
```

### Importaciones en blueprints
```python
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app import db
from app.models.user import User
from app.models.raffle import Raffle
# Importar solo los modelos necesarios
```

### Numeración de boletas
- Rango almacenado en `Raffle.numeracion_boletas_disponibles` como string `"0000-9999"`
- Usar `raffle.get_boletas_disponibles()` para obtener boletas no vendidas
- Boletas vendidas tienen `Ticket.is_sold = True`

### Métodos de pago
`Ticket.payment_method` acepta: `'Virtual'`, `'Efectivo'`, `'Cuotas'`

## Convenciones de código
- **Indentación**: TABS (no espacios)
- **Mensajes flash**: siempre en español
- **Idioma**: variables y comentarios en español; nombres de rutas en español
- **Templates**: en `app/templates/<blueprint>/`, heredan de `app/templates/<blueprint>/layout.html`
- **Paginación**: implementar manualmente con clase `Pagination` local (ver `admin.py`)

## Stack tecnológico
- Flask 3.0 + Flask-SQLAlchemy + Flask-Login + Flask-Migrate (Alembic)
- Flask-SocketIO 5.3.6 + eventlet (para notificaciones en tiempo real)
- Flask-Mail (Gmail SMTP) + pywebpush (Web Push con VAPID)
- PostgreSQL (producción) / SQLite (desarrollo) — `DATABASE_URL` en `.env`
- Gunicorn + eventlet en Render.com con `NullPool` (conexión por request)
- `psycopg2-binary` como adaptador PostgreSQL

## Configuración y variables de entorno
Archivo `.env` requerido:
```
SECRET_KEY=...
DATABASE_URL=postgresql://...
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_DEFAULT_SENDER=...
SOCKETIO_MESSAGE_QUEUE=...  # opcional
```
`DATABASE_URL` que empiece con `postgres://` se normaliza automáticamente a `postgresql://` en `config.py`.

## Comandos de desarrollo
```bash
# Activar entorno virtual
venv\Scripts\Activate.ps1

# Migraciones
flask db migrate -m "descripcion"
flask db upgrade
flask db heads        # verificar si hay múltiples heads
flask db merge heads  # resolver múltiples heads

# Ejecutar localmente
python run.py
```

## Archivos de referencia
- `app/blueprints/admin.py` — blueprint más completo, usar como referencia de patrones
- `app/models/__init__.py` — importar aquí todo modelo nuevo
- `migrations/versions/` — 13 migraciones existentes (revisar antes de crear una nueva)
- `ERROR_MULTIPLE_HEADS.md` — procedimiento para resolver conflictos de migraciones
- `config.py` — configuración de DB, mail, SSL y SocketIO
