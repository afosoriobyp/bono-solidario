---
name: add-migration
description: "Workflow para crear y aplicar una migración de base de datos en bono-solidario con Alembic/Flask-Migrate. Usar cuando: agregar columna a tabla existente, crear nueva tabla, eliminar columna, cambiar tipo de dato, agregar FK. Incluye verificación de heads, revisión del archivo generado y aplicación segura."
argument-hint: "Describe el cambio en la DB: ej. 'agregar columna notas a ticket' o 'crear tabla configuracion'"
---
# Skill: Crear y Aplicar Migración

## Cuándo usar este skill
- Agregar o eliminar columnas en modelos existentes
- Crear nuevas tablas (modelos)
- Agregar índices o restricciones
- Resolver conflictos de `Multiple head revisions`

## Procedimiento

### Paso 1 — Verificar estado actual
```bash
flask db heads
```
- Si aparece **un solo head**: continuar al paso 2
- Si aparece **más de un head**: ejecutar primero:
  ```bash
  flask db merge heads -m "merge unir heads de migraciones"
  flask db upgrade
  ```

### Paso 2 — Modificar el modelo en Python
Editar el archivo correspondiente en `app/models/`:
```python
# Ejemplo: agregar columna nullable (no requiere valor por defecto en registros existentes)
nueva_columna = db.Column(db.String(255), nullable=True)

# Ejemplo: agregar columna con valor por defecto
activo = db.Column(db.Boolean, nullable=False, default=True)
```
- Usar `nullable=True` o `server_default` para columnas en tablas con datos existentes
- **NO** usar `nullable=False` sin `default` en tablas con datos

### Paso 3 — Generar la migración
```bash
flask db migrate -m "descripcion del cambio en español"
```
El archivo se crea en `migrations/versions/`.

### Paso 4 — Revisar el archivo generado (OBLIGATORIO)
Abrir el archivo creado y verificar:
- [ ] `upgrade()` refleja el cambio esperado
- [ ] `downgrade()` está implementado (no es solo `pass`)
- [ ] Los nombres de tabla son correctos en snake_case
- [ ] Los tipos de columna coinciden con el modelo

```python
# CORRECTO — downgrade implementado
def downgrade():
    op.drop_column('ticket', 'nueva_columna')

# INCORRECTO — downgrade vacío
def downgrade():
    pass
```

### Paso 5 — Aplicar la migración
```bash
flask db upgrade
```

### Paso 6 — Verificar que no hay errores
```bash
flask db current  # debe mostrar el head de la nueva migración
```

## Errores comunes
- **`Can't locate revision`**: el `down_revision` no existe → revisar el archivo generado
- **`Multiple head revisions`**: ver `ERROR_MULTIPLE_HEADS.md`
- **`column X of relation Y already exists`**: la columna ya existe en DB, la migración está desincronizada

## Archivos de referencia
- `ERROR_MULTIPLE_HEADS.md` — procedimiento detallado para múltiples heads
- `migrations/versions/` — historial de 13+ migraciones existentes
- `config.py` — configuración de DB (no modificar aquí)
