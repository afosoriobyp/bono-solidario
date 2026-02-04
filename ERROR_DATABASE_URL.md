# 🚨 ERROR: Could not parse SQLAlchemy URL

## Problema

```
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

## ❌ Causa

La variable de entorno `DATABASE_URL` **NO está configurada** en tu Web Service de Render.

## ✅ Solución: Configurar DATABASE_URL en Render

### Paso 1: Obtener la URL de tu PostgreSQL

1. Ve a tu **Dashboard de Render**: https://dashboard.render.com
2. Haz clic en tu base de datos PostgreSQL (`bonos-db`)
3. En la página de la base de datos, busca la sección **"Connections"**
4. **COPIA** la **Internal Database URL** (no la External)
   
   Ejemplo:
   ```
   postgresql://bonos_user:abc123xyz@dpg-xxxxxxx.oregon-postgres.render.com/bonos_db
   ```

### Paso 2: Configurar en Web Service

1. Ve a tu **Web Service** (`bonos-app`)
2. Ve a la pestaña **"Environment"**
3. Busca la variable `DATABASE_URL`:
   
   **Si NO existe:**
   - Haz clic en **"Add Environment Variable"**
   - Key: `DATABASE_URL`
   - Value: `<pega-la-URL-interna-que-copiaste>`
   - Haz clic en **"Save Changes"**

   **Si ya existe pero está vacía:**
   - Haz clic en el ícono de editar (lápiz)
   - Pega la URL interna de tu PostgreSQL
   - Haz clic en **"Save Changes"**

### Paso 3: Redeploy

Render automáticamente redeployará tu aplicación. Si no:
- Ve a la pestaña **"Manual Deploy"**
- Haz clic en **"Deploy latest commit"**

---

## 🔍 Verificar Configuración

### Variables de entorno REQUERIDAS:

```
FLASK_APP=run.py
FLASK_DEBUG=False
SECRET_KEY=<tu-secret-key-generada>
DATABASE_URL=postgresql://usuario:password@host.render.com/database
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=bonos.perpetuosocorro@gmail.com
MAIL_PASSWORD=<tu-password-de-aplicacion-gmail>
MAIL_DEFAULT_SENDER=bonos.perpetuosocorro@gmail.com
```

### ⚠️ IMPORTANTE:

1. **Usa Internal Database URL**, NO External (para mejor rendimiento y seguridad)
2. La URL debe empezar con `postgresql://` o `postgres://` (el código lo convierte automáticamente)
3. **NO pongas comillas** alrededor de la URL en Render
4. Verifica que no haya espacios al inicio o final de la URL

---

## 🎥 Guía Visual

### Dónde encontrar Internal Database URL:

```
Render Dashboard
  └─ PostgreSQL Database (bonos-db)
      └─ Connections
          ├─ External Database URL (❌ NO usar)
          └─ Internal Database URL (✅ USAR ESTA)
```

### Dónde configurar DATABASE_URL:

```
Render Dashboard
  └─ Web Service (bonos-app)
      └─ Environment (pestaña)
          └─ Environment Variables
              └─ Add/Edit: DATABASE_URL
```

---

## 🧪 Probar Localmente (Opcional)

Si quieres probar la conexión a PostgreSQL de Render desde local:

```bash
# Usar External Database URL para conectar desde fuera de Render
$env:DATABASE_URL="postgresql://usuario:password@host-external.render.com/database"
python run.py
```

---

## 📞 Aún no funciona?

### Verifica los logs:

1. Ve a tu Web Service en Render
2. Ve a la pestaña **"Logs"**
3. Busca líneas que digan:
   ```
   SQLALCHEMY_DATABASE_URI: postgresql://...
   ```

### Si ves `sqlite:///bonos.db` en los logs:

❌ La variable `DATABASE_URL` NO está llegando a tu aplicación
✅ Repite los pasos anteriores y asegúrate de hacer clic en **"Save Changes"**

### Si los logs dicen "Could not connect to database":

- Verifica que copiaste la URL completa (sin espacios)
- Verifica que la base de datos PostgreSQL esté en estado "Available" (no "Creating" o "Suspended")
- Espera 1-2 minutos y vuelve a intentar

---

## 💡 Consejo Pro

Después de configurar `DATABASE_URL`, verifica en los logs de Render que aparezca:

```
INFO in __init__: Using database: postgresql://...
```

Si no aparece, agrega logging temporal a `config.py`:

```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Config:
    # ... tu código ...
    logger.info(f"DATABASE_URL configured: {database_url is not None}")
    logger.info(f"SQLALCHEMY_DATABASE_URI: {SQLALCHEMY_DATABASE_URI[:20]}...")
```

---

**Una vez configurado correctamente, tu aplicación iniciará sin errores! 🎉**
