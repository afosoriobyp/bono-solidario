---
description: "Use when creating or reviewing Alembic migration files in this project. Covers safety checks, multiple heads resolution, and conventions for bono-solidario."
applyTo: "migrations/versions/**/*.py"
---
# Reglas para Migraciones Alembic — Bono Solidario

## ANTES de crear una nueva migración
1. Verificar el estado actual: `flask db heads`
2. Si hay más de un head, resolver primero con: `flask db merge heads -m "merge unir heads"`
3. Revisar las 13 migraciones existentes en `migrations/versions/` para evitar duplicados

## Estructura obligatoria en cada migración
```python
def upgrade():
    # cambios a aplicar
    pass

def downgrade():
    # SIEMPRE implementar — permite revertir la migración
    # Nunca dejar pass vacío a menos que sea absolutamente imposible revertir
    pass
```

## Reglas de seguridad para columnas
- **NO** eliminar una columna en el mismo commit que se elimina el código que la usa
- **NO** renombrar columnas directamente (puede causar pérdida de datos) — agregar nueva columna, migrar datos, luego eliminar la vieja
- **NO** cambiar tipos de columna con datos existentes sin una estrategia de conversión

## Operaciones seguras vs. peligrosas
| Operación | Segura | Requiere cuidado |
|---|---|---|
| `add_column` | ✅ | Solo si tiene `nullable=True` o `server_default` |
| `drop_column` | ⚠️ | Solo en paso separado después de desplegar código |
| `alter_column` | ⚠️ | Verificar compatibilidad con datos existentes |
| `create_table` | ✅ | Siempre seguro |
| `drop_table` | ⚠️ | Confirmar que no hay FKs que la referencien |

## Revisión del archivo generado automáticamente
Después de `flask db migrate`, SIEMPRE revisar el archivo generado:
- Verificar que `upgrade()` y `downgrade()` sean correctos
- Revisar que los tipos de columna coincidan con el modelo
- Confirmar que las FKs apunten a las tablas correctas (snake_case, ej: `'user.id'` no `'User.id'`)

## Errores frecuentes en este proyecto
- **Multiple heads**: Ocurre cuando dos migraciones tienen el mismo `down_revision`. Ver `ERROR_MULTIPLE_HEADS.md`
- **postgres:// vs postgresql://**: La URL se normaliza en `config.py`, no en las migraciones
- **SSL en Render**: No modificar la cadena de conexión en migraciones

## Nombres de archivos de migración
El prefijo numérico o hash es generado por Alembic. La descripción debe ser en español:
```
flask db migrate -m "agregar columna notas a ticket"
flask db migrate -m "crear tabla nueva_funcionalidad"
```

## Aplicar migración en producción (Render.com)
La migración se aplica automáticamente en `build.sh` con `flask db upgrade`.
En desarrollo: `flask db upgrade` en terminal con el venv activo.
