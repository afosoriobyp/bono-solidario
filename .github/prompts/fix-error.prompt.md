---
description: "Diagnosticar y corregir un error en bono-solidario. Usar cuando hay un stack trace, excepción de Flask/SQLAlchemy, error de migración, comportamiento inesperado o error 500."
argument-hint: "Pega el stack trace o describe el error: ej. 'sqlalchemy.exc.OperationalError al acceder a /admin/users'"
agent: agent
tools: [read, search]
---
Analiza y corrige el siguiente error del proyecto **Bono Solidario**:

**Error reportado**:
```
$ERROR
```

## Tu proceso de análisis

1. **Identifica el tipo de error** — ¿Es un ImportError, SQLAlchemy error, Jinja2, routing, migración?
2. **Ubica la causa en el código** — lee el archivo mencionado en el stack trace
3. **Consulta los archivos de error conocidos** si aplica:
   - `ERROR_MULTIPLE_HEADS.md` — conflictos de migración
   - `ERROR_DATABASE_URL.md` — problemas de URL de PostgreSQL
   - `ERROR_SSL_POSTGRES.md` — SSL en Render
   - `ERROR_PSYCOPG2_PYTHON.md` — adaptador psycopg2
4. **Explica la causa raíz** en español y de forma clara
5. **Propón la corrección mínima** — solo el cambio necesario, sin refactorizar

## Formato de respuesta requerido
1. **Tipo de error**: [categoría]
2. **Archivo y línea**: [ruta exacta, línea N]
3. **Causa raíz**: [explicación en español]
4. **Corrección**: [código exacto antes → después]
5. **Prevención futura**: [qué tener en cuenta]

## Restricciones
- Solo proponer corrección mínima, no refactorizar
- No modificar más de lo necesario para resolver el error
- Verificar que la corrección sigue las convenciones del proyecto (tabs, español)
