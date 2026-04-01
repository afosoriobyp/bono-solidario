---
description: "Use when creating or editing Flask blueprint routes in this project. Covers access control, DB error handling, flash messages, and conventions for bono-solidario."
applyTo: "app/blueprints/**/*.py"
---
# Reglas para Blueprints Flask — Bono Solidario

## Control de acceso (OBLIGATORIO en cada ruta)
Cada ruta debe verificar el rol **después** de `@login_required`:
```python
@admin_bp.route('/ruta')
@login_required
def vista():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	# lógica de la vista...
```

Roles válidos por blueprint:
| Blueprint | Variable | Rol requerido |
|---|---|---|
| `admin_bp` | `admin_bp = Blueprint('admin', ...)` | `'admin'` |
| `seller_bp` | `seller_bp = Blueprint('seller', ...)` | `'seller'` |
| `buyer_bp` | `buyer_bp = Blueprint('buyer', ...)` | `'buyer'` |

## Operaciones de base de datos (OBLIGATORIO con try/except)
```python
try:
	db.session.add(obj)
	db.session.commit()
	flash('Operación exitosa.', 'success')
except Exception as e:
	db.session.rollback()
	flash(f'Error: {str(e)}', 'danger')
```

## Mensajes flash — categorías permitidas
```python
flash('Mensaje de éxito.', 'success')
flash('Advertencia.', 'warning')
flash('Error ocurrido.', 'danger')
flash('Información adicional.', 'info')
```
- Siempre en **español**
- Terminar con punto final

## Paginación manual (seguir el patrón de admin.py)
```python
page = request.args.get('page', 1, type=int)
PER_PAGE = 10
items = query.order_by(Model.id.desc()).offset((page-1)*PER_PAGE).limit(PER_PAGE).all()
total = query.count()

class Pagination:
	def __init__(self, items, page, per_page, total):
		self.items = items
		self.page = page
		self.per_page = per_page
		self.total = total
		self.pages = (total // per_page) + (1 if total % per_page else 0)
		self.has_prev = page > 1
		self.has_next = page < self.pages
		self.prev_num = page - 1
		self.next_num = page + 1
```

## Importaciones estándar por blueprint
```python
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app import db
from app.models.user import User
from app.models.raffle import Raffle
# Importar solo los modelos que se necesiten en este blueprint
```

## Indentación y estilo
- Usar **TABS** (no espacios)
- Variables y comentarios en **español**
- Nombres de funciones de vista en español (ej: `def crear_rifa():`)
- Nombres de rutas URL en español (ej: `/sorteos/crear`)

## Templates
- Los templates van en `app/templates/<blueprint>/`
- Heredan de `app/templates/<blueprint>/layout.html`
- Usar `render_template('<blueprint>/nombre.html', **vars)`

## Validación de formularios
- Validar en `request.method == 'POST'`
- Usar `request.form.get('campo', '').strip()` para strings
- Redirigir con `redirect(url_for('blueprint.vista'))` después de POST exitoso (PRG pattern)
