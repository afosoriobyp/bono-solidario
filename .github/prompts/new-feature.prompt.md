---
description: "Implementar nueva funcionalidad en bono-solidario siguiendo los patrones del proyecto. Usar para crear features completas: ruta + template + lógica de negocio."
argument-hint: "Describe la funcionalidad: ej. 'exportar reporte de ventas a CSV para admin'"
agent: agent
tools: [read, edit, search, execute]
---
Implementa la siguiente funcionalidad nueva en el proyecto **Bono Solidario**:

**Funcionalidad solicitada**: $FUNCIONALIDAD

## Contexto del proyecto (resumen)
- Flask 3.0 + SQLAlchemy + Flask-Login + PostgreSQL
- Roles: `admin` → `/admin`, `seller` → `/seller`, `buyer` → `/buyer`
- Indentación: TABS. Mensajes: español. Templates heredan de `layout.html`
- Patrón de control de acceso: `@login_required` + `if current_user.role != '{rol}'`
- Patrón DB: `try / db.session.commit() + flash('...', 'success') / except: rollback + flash('...', 'danger')`

## Pasos a seguir

1. **Identifica el blueprint correcto** según el rol (admin/seller/buyer)
2. **Lee el blueprint** para encontrar patrones similares ya implementados
3. **Implementa la ruta** en el blueprint con el patrón de control de acceso y try/except
4. **Crea el template** en `app/templates/{blueprint}/` heredando de `layout.html`
5. **Si hay cambios en la DB**, indica el comando de migración necesario
6. **Verifica** que el código usa tabs y mensajes en español

## Restricciones
- NO agregar funcionalidades extra que no fueron pedidas
- NO cambiar código existente que no esté relacionado con la nueva funcionalidad
- NO crear helpers o abstracciones innecesarias
- Seguir EXACTAMENTE los patrones de `app/blueprints/admin.py` como referencia
