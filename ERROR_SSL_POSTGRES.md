# 🚨 ERROR: SSL connection has been closed unexpectedly

## Problema

```
psycopg2.OperationalError: connection to server at "dpg-xxxx.oregon-postgres.render.com" (IP), port 5432 failed: SSL connection has been closed unexpectedly

sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection to server failed: SSL connection has been closed unexpectedly
```

## ❌ Causa

**PostgreSQL en Render requiere SSL** pero la URL de conexión no incluye los parámetros SSL necesarios.

## ✅ Solución (Ya Aplicada)

He actualizado `config.py` para agregar automáticamente `sslmode=require` a las conexiones de Render.

### Cambios en config.py:

```python
# Agregar parámetros SSL si no están presentes (requerido por Render PostgreSQL)
if 'sslmode' not in database_url and 'render.com' in database_url:
    separator = '&' if '?' in database_url else '?'
    database_url = f"{database_url}{separator}sslmode=require"
```

---

## 🔧 Solución Manual (Si es Necesario)

### Opción 1: Modificar DATABASE_URL en Render

Si la solución automática no funciona, agrega `?sslmode=require` manualmente:

1. Ve a tu Web Service en Render
2. Ve a **"Environment"**
3. Edita la variable `DATABASE_URL`
4. Agrega al final: `?sslmode=require`

**Antes:**
```
postgresql://usuario:password@dpg-xxxx.oregon-postgres.render.com/bonos_db
```

**Después:**
```
postgresql://usuario:password@dpg-xxxx.oregon-postgres.render.com/bonos_db?sslmode=require
```

### Opción 2: Verificar que uses Internal Database URL

Asegúrate de usar la **Internal Database URL** (no External):

1. Dashboard Render → PostgreSQL Database
2. Sección **"Connections"**
3. Copia **"Internal Database URL"** (contiene `.render.com`)
4. Pégala en la variable `DATABASE_URL` de tu Web Service

---

## 🎯 Pasos para Aplicar la Corrección

### 1. Subir cambios a GitHub

Los cambios ya están commiteados. Solo haz push:

```bash
git push origin main
```

### 2. Redeploy en Render

Render detectará el push automáticamente, pero para asegurar:

1. Ve a tu Web Service
2. **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Monitorea los logs

### 3. Verificar en logs

Deberías ver:

✅ **Correcto:**
```
🗄️  Ejecutando migraciones de base de datos...
INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
Running upgrade ... -> ..., done
✅ Build completado exitosamente
```

❌ **Incorrecto (si aún falla SSL):**
```
SSL connection has been closed unexpectedly
```

---

## 🔍 Verificación Adicional

### Revisar la URL en logs (temporal):

Puedes agregar logging temporal a `config.py` para verificar:

```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Después de configurar database_url:
logger.info(f"DATABASE_URL configurada: {database_url[:50]}...")
```

Deberías ver en logs:
```
DATABASE_URL configurada: postgresql://user:pass@dpg-xxx.render.com/db?sslmode=require...
```

---

## 💡 Alternativas de sslmode

Si `sslmode=require` no funciona, prueba otros valores:

### sslmode=prefer (intenta SSL, fallback sin SSL)
```
postgresql://...?sslmode=prefer
```

### sslmode=verify-ca (verifica certificado CA)
```
postgresql://...?sslmode=verify-ca
```

### sslmode=verify-full (verificación completa SSL)
```
postgresql://...?sslmode=verify-full
```

**Recomendado para Render:** `sslmode=require` (ya aplicado automáticamente)

---

## 🆘 Si Aún No Funciona

### 1. Verificar estado de PostgreSQL

1. Dashboard Render → PostgreSQL Database
2. Estado debe ser: **"Available"** (verde)
3. Si está en "Creating" o "Suspended", espera a que esté disponible

### 2. Verificar conectividad desde Render

El problema podría ser de red dentro de Render:

- Verifica que Web Service y PostgreSQL estén en la **misma región** (Oregon)
- Usa **Internal Database URL** (no External) para mejor conectividad

### 3. Revisar plan de PostgreSQL

El plan **Free** de PostgreSQL:
- Solo 97 horas/mes
- Puede estar suspendido si se agotaron las horas

Verifica:
1. PostgreSQL Database → "Metrics"
2. Revisa horas consumidas
3. Si está al límite, considera upgrade a Starter ($7/mes)

### 4. Probar conexión manual

Desde local (usando External Database URL):

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://user:pass@dpg-xxx-external.render.com/db?sslmode=require"
python -c "from sqlalchemy import create_engine; engine = create_engine('$env:DATABASE_URL'); conn = engine.connect(); print('✅ Conexión exitosa'); conn.close()"
```

---

## 📋 Resumen de Cambios

### Archivos Modificados:

- ✅ `config.py` - Agrega automáticamente `sslmode=require` para Render
- ✅ `SQLALCHEMY_ENGINE_OPTIONS` - Optimizado pool de conexiones

### Comportamiento:

1. Detecta si la URL contiene `render.com`
2. Verifica si ya tiene `sslmode`
3. Si no lo tiene, agrega `?sslmode=require` automáticamente
4. Funciona con Internal y External URLs

---

## 🎓 ¿Por Qué SSL?

PostgreSQL en Render (y la mayoría de servicios cloud):
- **Requiere SSL** para todas las conexiones por seguridad
- Protege datos en tránsito
- Previene man-in-the-middle attacks
- Es un requisito estándar de PCI-DSS y HIPAA

---

## ✅ Checklist Post-Fix

- [ ] Push de cambios a GitHub
- [ ] Clear build cache & deploy en Render
- [ ] Verificar en logs: "Context impl PostgreSQLImpl"
- [ ] Verificar en logs: "Running upgrade ... done"
- [ ] Verificar en logs: "Your service is live 🎉"
- [ ] Probar acceso a la aplicación

---

**Una vez aplicados los cambios, las migraciones deberían ejecutarse correctamente! 🚀**
