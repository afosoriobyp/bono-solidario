# 🚨 ERROR: Multiple head revisions in Alembic

## Problema

```
ERROR [flask_migrate] Error: Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads
```

## ❌ Causa

**Alembic tiene múltiples "head revisions"** (puntas de ramas) en el historial de migraciones. Esto ocurre cuando:

1. Se crearon migraciones en paralelo sin sincronizar
2. Hay ramas divergentes en el árbol de migraciones
3. Se mezclaron migraciones de diferentes entornos (dev/prod)

## ✅ Solución (Ya Aplicada)

He actualizado `build.sh` para usar `flask db upgrade heads` (con 's' al final) que aplica todas las heads automáticamente.

### Cambio en build.sh:

```bash
# Antes:
flask db upgrade

# Después:
flask db upgrade heads
```

---

## 🔧 Solución Alternativa: Crear Migración de Merge

Si `flask db upgrade heads` no funciona, puedes crear una migración de "merge" que una todas las heads.

### Localmente (después de hacer pull):

```bash
# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Ver las heads actuales
flask db heads

# Crear migración de merge (une todas las heads)
flask db merge heads -m "Merge multiple migration heads"

# Aplicar la migración
flask db upgrade

# Hacer commit y push
git add migrations/versions/*
git commit -m "Merge: Unir múltiples heads de migraciones"
git push origin main
```

---

## 📋 Pasos para Aplicar la Corrección

### 1. Subir cambios a GitHub

```bash
git add build.sh
git commit -m "Fix: Usar 'flask db upgrade heads' para múltiples heads"
git push origin main
```

### 2. Redeploy en Render

Render detectará el push automáticamente, o:

1. Ve a tu Web Service
2. **"Manual Deploy"** → **"Deploy latest commit"**
3. Monitorea los logs

### 3. Verificar en logs

✅ **Correcto:**
```
🗄️  Ejecutando migraciones de base de datos...
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
Running upgrade ... -> ..., done
Running upgrade ... -> ..., done
✅ Build completado exitosamente
```

❌ **Incorrecto (si persiste):**
```
ERROR [flask_migrate] Error: Multiple head revisions are present
```

---

## 🔍 Diagnosticar el Problema (Localmente)

### Ver heads actuales:

```bash
flask db heads
```

**Ejemplo de salida con problema:**
```
9acefe68d374 (head)
zz_add_notification_status_error (head)
20260204_finalize_ticket_seller_fk (head)
```

Si ves múltiples `(head)`, necesitas merge.

### Ver historial de migraciones:

```bash
flask db history
```

### Ver estado actual de la base de datos:

```bash
flask db current
```

---

## 🛠️ Opción: Limpiar y Reorganizar Migraciones (Avanzado)

⚠️ **SOLO si tienes problemas persistentes y tu BD de producción está VACÍA:**

### 1. Backup de migraciones actuales

```bash
cp -r migrations migrations_backup
```

### 2. Eliminar archivos de versión

```bash
rm migrations/versions/*.py
```

### 3. Crear migración inicial única

```bash
flask db migrate -m "Initial migration"
```

### 4. Aplicar y subir

```bash
flask db upgrade
git add migrations/
git commit -m "Reset: Consolidar todas las migraciones en una inicial"
git push origin main
```

⚠️ **ADVERTENCIA:** Esto solo funciona si tu BD de producción NO tiene datos o puedes recrearla.

---

## 💡 Prevenir el Problema

### En desarrollo:

1. **Sincroniza siempre** antes de crear migraciones:
   ```bash
   git pull origin main
   flask db upgrade
   ```

2. **Una migración a la vez:**
   - Crea migración
   - Haz commit y push inmediatamente
   - Otros desarrolladores hacen pull antes de crear nuevas

3. **No edites migraciones ya aplicadas** en producción

### En equipo:

1. Usa una sola rama para migraciones (ej: `main`)
2. Coordina cambios de esquema
3. Revisa `flask db heads` antes de hacer push

---

## 🎯 ¿Qué Hace `flask db upgrade heads`?

- **Sin 's':** `flask db upgrade` → Aplica hasta una sola head (falla si hay múltiples)
- **Con 's':** `flask db upgrade heads` → Aplica TODAS las heads automáticamente

**Resultado:** Todas las ramas de migración se aplican, llevando la BD al estado más reciente.

---

## 🆘 Si Aún Persiste el Error

### 1. Verificar que Render use el nuevo build.sh

En logs de Render, busca:
```
flask db upgrade heads
```

Si ves solo `flask db upgrade` (sin 'heads'), Render aún usa el script anterior.

**Solución:**
1. Verifica que el commit esté en GitHub
2. Render → "Manual Deploy" → **"Clear build cache & deploy"**

### 2. Crear migración de merge manualmente

Si `heads` no funciona, crea merge localmente:

```bash
flask db merge heads -m "Merge migration branches"
git add migrations/versions/*.py
git commit -m "Merge: Resolver múltiples heads"
git push origin main
```

### 3. Contactar soporte si la BD está corrupta

Si ves errores como:
```
alembic_version table doesn't exist
```

Puede indicar que la tabla de versiones está corrupta. Contacta soporte de Render.

---

## ✅ Checklist Post-Fix

- [ ] Push de `build.sh` actualizado a GitHub
- [ ] Redeploy en Render
- [ ] Verificar en logs: "Running upgrade ... done" (múltiples líneas)
- [ ] Verificar en logs: "Build completado exitosamente"
- [ ] Probar acceso a la aplicación
- [ ] Verificar que datos se persistan correctamente

---

**Después de aplicar `flask db upgrade heads`, todas las migraciones deberían ejecutarse correctamente! 🚀**
