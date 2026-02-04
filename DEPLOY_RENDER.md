# 🚀 Guía de Despliegue en Render

## 📋 Resumen de Preparación Completada

Tu aplicación Flask ya está lista para producción con:
- ✅ PostgreSQL configurado (reemplaza SQLite)
- ✅ Gunicorn + Eventlet para WebSockets
- ✅ Migraciones automáticas en build
- ✅ Variables de entorno seguras
- ✅ Pool de conexiones optimizado

---

## 💰 Análisis de Costos en Render

### Plan Gratuito (Free Tier)
**✅ RECOMENDADO PARA INICIAR**

#### Web Service (Free)
- **Costo:** $0/mes
- **Recursos:** 512 MB RAM, 0.1 CPU compartida
- **Limitaciones:**
  - Se suspende después de 15 minutos de inactividad
  - Tiempo de arranque en frío: ~30-60 segundos
  - 750 horas/mes (suficiente para uso continuo)
  - Ancho de banda: 100 GB/mes

#### PostgreSQL (Free)
- **Costo:** $0/mes
- **Recursos:** 
  - 256 MB RAM
  - 1 GB de almacenamiento
  - Hasta 97 horas de uso/mes (≈4 días)
  - **IMPORTANTE:** Se suspende automáticamente después de 90 días de inactividad
  - **LÍMITE CRÍTICO:** El plan gratuito de PostgreSQL es muy limitado en horas

**⚠️ ADVERTENCIA DEL PLAN GRATUITO:**
- La base de datos gratuita tiene solo 97 horas/mes, lo que es **INSUFICIENTE** para uso continuo
- Después de 90 días sin actividad, se elimina automáticamente
- No hay backups automáticos

### Planes de Pago

#### Web Service Starter ($7/mes)
- 512 MB RAM, 0.5 CPU
- Sin suspensión automática
- Sin tiempo de arranque en frío
- 100 GB ancho de banda

#### PostgreSQL Starter ($7/mes)
- **⭐ RECOMENDADO PARA PRODUCCIÓN**
- 256 MB RAM
- 1 GB de almacenamiento
- **Conexiones activas 24/7**
- Backups diarios automáticos (7 días de retención)
- Point-in-time recovery
- Alta disponibilidad

#### Costo Total Recomendado para Producción
- Web Service Starter: $7/mes
- PostgreSQL Starter: $7/mes
- **TOTAL: $14/mes** (aproximadamente $168/año)

---

## 🎯 Mi Recomendación

### Para Desarrollo/Pruebas (1-2 semanas)
✅ **Plan Gratuito:** Usa el Free Tier para probar y validar
- Acepta los 30-60 segundos de arranque en frío
- Monitorea el uso de horas de PostgreSQL (97 horas/mes)
- Úsalo solo para demos o pruebas breves

### Para Producción Real
✅ **Plan Mixto ($7/mes):**
- Web Service: **Free** (si puedes tolerar el arranque en frío)
- PostgreSQL: **Starter $7/mes** (ESENCIAL para datos confiables)

✅ **Plan Completo ($14/mes):**
- Web Service Starter: $7/mes
- PostgreSQL Starter: $7/mes
- Mejor experiencia de usuario (sin tiempos de espera)

---

## 📝 Pasos para Desplegar en Render

### 1️⃣ Preparar Repositorio Git

```bash
# Inicializar Git (si no lo has hecho)
git init

# Agregar archivos
git add .
git commit -m "Preparar aplicación para despliegue en Render"

# Subir a GitHub/GitLab/Bitbucket
git remote add origin https://github.com/tu-usuario/bonos.git
git branch -M main
git push -u origin main
```

### 2️⃣ Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Regístrate con GitHub, GitLab o correo
3. Verifica tu email

### 3️⃣ Crear Base de Datos PostgreSQL

1. En el Dashboard de Render, haz clic en **"New +"** → **"PostgreSQL"**
2. Configura:
   - **Name:** `bonos-db`
   - **Database:** `bonos`
   - **Region:** Oregon (recomendado, es más barato)
   - **Plan:** Elige **Free** para pruebas o **Starter ($7/mes)** para producción
3. Haz clic en **"Create Database"**
4. **GUARDA** la URL de conexión que aparece (Internal Database URL)

### 4️⃣ Crear Web Service

1. Haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio Git
3. Configura:
   - **Name:** `bonos-app`
   - **Region:** Oregon
   - **Branch:** `main`
   - **Root Directory:** (dejar vacío)
   - **Runtime:** Python 3
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app`
   - **Plan:** Free o Starter

### 5️⃣ Configurar Variables de Entorno

**🚨 PASO CRÍTICO - OBLIGATORIO:**

En la sección **"Environment"** del Web Service, añade TODAS estas variables:

```
FLASK_APP=run.py
FLASK_DEBUG=False
SECRET_KEY=<genera-una-clave-secreta-fuerte>
DATABASE_URL=<pega-la-URL-interna-de-tu-PostgreSQL>
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=bonos.perpetuosocorro@gmail.com
MAIL_PASSWORD=qdlu vicv fhgd eqrm
MAIL_DEFAULT_SENDER=bonos.perpetuosocorro@gmail.com
```

**⚠️ MUY IMPORTANTE - `DATABASE_URL`:**

1. Ve a tu PostgreSQL Database en Render
2. Busca la sección **"Connections"**
3. **COPIA la "Internal Database URL"** (NO la External)
4. Pégala en `DATABASE_URL` (sin comillas, sin espacios)

Ejemplo de URL válida:
```
postgresql://bonos_user:abc123@dpg-xxxx.oregon-postgres.render.com/bonos_db
```

**❌ Si no configuras `DATABASE_URL`, obtendrás error:**
```
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL
```
👉 Ver [ERROR_DATABASE_URL.md](ERROR_DATABASE_URL.md) para solución detallada.

**⚠️ IMPORTANTE:** 
- Para `SECRET_KEY`, genera una clave segura:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- Para `DATABASE_URL`, copia la **Internal Database URL** de tu PostgreSQL de Render

### 6️⃣ Desplegar

1. Haz clic en **"Create Web Service"**
2. Render automáticamente:
   - Clonará tu repositorio
   - Instalará dependencias
   - Ejecutará `build.sh` (migraciones)
   - Iniciará la aplicación

3. Monitorea los logs en tiempo real
4. Una vez completado, verás: **"Your service is live 🎉"**

### 7️⃣ Acceder a tu Aplicación

Tu app estará disponible en:
```
https://bonos-app.onrender.com
```

---

## 🔧 Comandos Útiles Post-Despliegue

### Ver logs en tiempo real
En el dashboard de Render → Logs

### Ejecutar migraciones manualmente
En el dashboard → Shell (si tienes plan de pago)
```bash
flask db upgrade
```

### Crear datos de prueba en producción
```bash
# Ejecutar desde shell de Render
python create_test_users.py
python create_test_data.py
```

### Verificar base de datos
```bash
# Conectar a PostgreSQL desde local
psql -h <host-de-render> -U <usuario> -d bonos
```

---

## 🛡️ Seguridad en Producción

### ✅ Configuración Recomendada en Gmail

Para usar Gmail en producción de forma segura:

1. Activa **verificación en 2 pasos** en tu cuenta de Gmail
2. Genera una **contraseña de aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Genera una contraseña para "Correo"
   - Usa esa contraseña en `MAIL_PASSWORD`

### ✅ Cambiar SECRET_KEY

**NUNCA uses la misma SECRET_KEY de desarrollo en producción**

Genera una nueva:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### ✅ Backups de Base de Datos

#### Plan Free:
- **NO tiene backups automáticos**
- Exporta manualmente cada semana:
  ```bash
  pg_dump -h <host> -U <usuario> -d bonos > backup_$(date +%F).sql
  ```

#### Plan Starter ($7/mes):
- Backups diarios automáticos (7 días)
- Point-in-time recovery

---

## 🚨 Solución de Problemas Comunes

### ❌ Error: "Could not parse SQLAlchemy URL" (MÁS COMÚN)

```
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

**Causa:** La variable `DATABASE_URL` NO está configurada o está vacía.

**Solución:**
1. Ve a tu PostgreSQL Database en Render Dashboard
2. Copia la **Internal Database URL** de la sección "Connections"
3. Ve a tu Web Service → Environment
4. Agrega/edita la variable `DATABASE_URL` con la URL copiada
5. Guarda y espera el redeploy automático

👉 **Ver guía completa:** [ERROR_DATABASE_URL.md](ERROR_DATABASE_URL.md)

---

### ❌ Error: "psycopg2 undefined symbol _PyInterpreterState_Get"

```
ImportError: undefined symbol: _PyInterpreterState_Get
```

**Causa:** Incompatibilidad de `psycopg2` con Python 3.13.

**Solución (Ya aplicada en el repo):**
1. Archivos `.python-version` y `runtime.txt` creados para forzar Python 3.11
2. Sube cambios a GitHub
3. En Render: **Manual Deploy** → **Clear build cache & deploy**
4. Verifica en logs: "Using Python version 3.11.0"

👉 **Ver guía completa:** [ERROR_PSYCOPG2_PYTHON.md](ERROR_PSYCOPG2_PYTHON.md)

---

### ❌ Error: "SSL connection has been closed unexpectedly"

```
psycopg2.OperationalError: SSL connection has been closed unexpectedly
```

**Causa:** PostgreSQL en Render requiere SSL pero no está configurado en la URL.

**Solución (Ya aplicada en config.py):**
1. El código ahora agrega automáticamente `?sslmode=require` a URLs de Render
2. Sube cambios a GitHub
3. Redeploy automático en Render
4. Verifica en logs que las migraciones se ejecuten

**Solución Manual (si es necesario):**
- Agrega `?sslmode=require` al final de `DATABASE_URL` en Render Environment

👉 **Ver guía completa:** [ERROR_SSL_POSTGRES.md](ERROR_SSL_POSTGRES.md)

---

### Error: "Application failed to start"
- Verifica logs en Render
- Comprueba que `DATABASE_URL` esté configurado
- Revisa que todas las variables de entorno estén presentes

### Error: "No module named 'psycopg2'"
- Asegúrate de que `psycopg2-binary` esté en `requirements.txt`
- Fuerza un nuevo build en Render

### Error: "relation does not exist"
- Las migraciones no se ejecutaron
- Ejecuta manualmente: `flask db upgrade`

### WebSockets no funcionan
- Verifica que uses `eventlet` en el start command
- Asegúrate de que el frontend use WSS (no WS) en producción

### La app se suspende (Free Tier)
- Es normal, se reactiva en 30-60 segundos
- Para evitarlo, actualiza a plan Starter

---

## 📊 Monitoreo

### Métricas en Render Dashboard
- CPU Usage
- Memory Usage
- Request Count
- Response Time

### Alertas Recomendadas
- Error rate > 5%
- Response time > 2s
- Memory usage > 80%

---

## 🎓 Próximos Pasos

1. ✅ Desplegar en Free Tier para probar
2. ✅ Validar funcionalidad completa
3. ✅ Configurar dominio personalizado (si lo tienes)
4. ✅ Migrar a plan Starter cuando tengas usuarios reales
5. ✅ Configurar monitoreo y alertas
6. ✅ Implementar backups regulares

---

## 📞 Soporte

- Documentación Render: https://render.com/docs
- Comunidad Render: https://community.render.com
- Documentación Flask: https://flask.palletsprojects.com

---

**🎉 ¡Tu aplicación está lista para producción!**

¿Preguntas? Revisa los logs en Render o consulta la documentación oficial.
