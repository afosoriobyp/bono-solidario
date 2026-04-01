---
name: add-route
description: "Workflow para agregar una nueva ruta (vista) a un blueprint de bono-solidario. Usar cuando: agregar funcionalidad nueva a admin, seller o buyer; implementar una página nueva; crear un endpoint; agregar un formulario. Sigue los patrones del proyecto: login_required, verificación de rol, try/except en DB, flash en español, tabs."
argument-hint: "Describe la ruta a crear: ej. 'agregar página de exportar reporte para admin'"
---
# Skill: Agregar Ruta a Blueprint

## Cuándo usar este skill
- Agregar una nueva página o endpoint a un blueprint existente
- Crear formularios de creación/edición
- Implementar endpoints de API interna (JSON)

## Procedimiento

### Paso 1 — Identificar el blueprint correcto
Determinar en qué blueprint va la ruta según el rol:
- **admin**: `app/blueprints/admin.py` — gestión completa del sistema
- **seller**: `app/blueprints/seller.py` — operaciones de venta
- **buyer**: `app/blueprints/buyer.py` — operaciones de compra

### Paso 2 — Buscar un patrón similar en el blueprint
Leer el blueprint destino para:
- Identificar rutas similares ya existentes
- Verificar el patrón de importaciones usado
- Encontrar la clase `Pagination` si se necesita listar datos

### Paso 3 — Implementar la ruta (plantilla)
```python
@{blueprint}_bp.route('/{nombre-ruta}', methods=['GET', 'POST'])
@login_required
def {nombre_funcion}():
	if current_user.role != '{rol}':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))

	if request.method == 'POST':
		# obtener datos del formulario
		campo = request.form.get('campo', '').strip()

		# validación básica
		if not campo:
			flash('El campo es obligatorio.', 'danger')
			return render_template('{blueprint}/{template}.html')

		try:
			obj = Modelo(campo=campo)
			db.session.add(obj)
			db.session.commit()
			flash('Operación realizada con éxito.', 'success')
			return redirect(url_for('{blueprint}.{vista_lista}'))
		except Exception as e:
			db.session.rollback()
			flash(f'Error al guardar: {str(e)}', 'danger')

	return render_template('{blueprint}/{template}.html')
```

### Paso 4 — Crear el template
Crear `app/templates/{blueprint}/{nombre}.html` que herede del layout:
```html
{% extends "{blueprint}/layout.html" %}
{% block content %}
<!-- contenido aquí -->
{% endblock %}
```

### Paso 5 — Verificar
- La ruta tiene `@login_required` y verificación de rol
- El `try/except` cubre la operación DB con `rollback()`
- Los mensajes flash están en español
- La indentación usa TABS
- Si hay cambios en DB, recordar crear migración

## Archivos de referencia
- Patrones completos en `app/blueprints/admin.py`
- Layouts en `app/templates/admin/layout.html`, `app/templates/seller/layout.html`, `app/templates/buyer/layout.html`
