# ✅ Checklist de Despliegue - Render

## 🎯 Archivos Creados/Actualizados

- ✅ `requirements.txt` - Dependencias actualizadas (PostgreSQL, Gunicorn, eventlet)
- ✅ `config.py` - Soporte para PostgreSQL y pool de conexiones
- ✅ `build.sh` - Script de inicialización para Render
- ✅ `render.yaml` - Configuración completa del servicio
- ✅ `.env.example` - Plantilla de variables de entorno
- ✅ `.gitignore` - Actualizado (mantiene migraciones, excluye .env)
- ✅ `DEPLOY_RENDER.md` - Guía completa de despliegue y costos
- ✅ `README.md` - Documentación actualizada del proyecto

## 📋 Comandos para Desplegar

### 1. Inicializar y subir a Git

```bash
# Inicializar Git (ya hecho)
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Preparar aplicación para despliegue en Render con PostgreSQL"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/bonos.git
git branch -M main
git push -u origin main
```

### 2. Configurar en Render

1. Crear cuenta en https://render.com
2. Crear PostgreSQL Database:
   - Name: `bonos-db`
   - Plan: **Starter $7/mes** (recomendado) o Free (solo pruebas)
   
3. Crear Web Service:
   - Conectar repo de GitHub
   - Build Command: `./build.sh`
   - Start Command: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app`
   - Plan: Free o Starter $7/mes

4. Variables de entorno (copiar desde .env):
   
   **🚨 CRÍTICO - Debes configurar `DATABASE_URL`:**
   
   1. Ve a tu PostgreSQL en Render Dashboard
   2. Sección "Connections" → Copia **Internal Database URL**
   3. Pégala en la variable `DATABASE_URL` (sin comillas)
   
   ```
   FLASK_APP=run.py
   FLASK_DEBUG=False
   SECRET_KEY=6120fd6bbd66e4bd898d20a31e6c142517ab69a9a3a2a01f9852696f3025ee22
   DATABASE_URL=postgresql://usuario:password@dpg-xxxx.oregon-postgres.render.com/bonos_db
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=bonos.perpetuosocorro@gmail.com
   MAIL_PASSWORD=<password-de-aplicacion-gmail>
   MAIL_DEFAULT_SENDER=bonos.perpetuosocorro@gmail.com
   ```
   
   **❌ Si DATABASE_URL está vacía o no existe:**
   ```
   Error: Could not parse SQLAlchemy URL from given URL string
   ```
   👉 Ver [ERROR_DATABASE_URL.md](ERROR_DATABASE_URL.md) para solución

5. Deploy automático

## 🔑 Generar SECRET_KEY Nueva

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## 💰 Resumen de Costos

| Plan | Web Service | PostgreSQL | Total/mes |
|------|-------------|------------|-----------|
| **Free (pruebas)** | $0 | $0 | **$0** |
| **Producción mínima** | $0 | $7 | **$7** |
| **Producción completa** | $7 | $7 | **$14** |

### ⚠️ Limitaciones Plan Free:
- Web: Se suspende tras 15 min inactividad (30-60s arranque)
- PostgreSQL: Solo 97 horas/mes (~4 días) ❌ INSUFICIENTE para producción
- PostgreSQL: Se borra automáticamente tras 90 días sin uso

### ✅ Recomendación:
- **Para pruebas (1-2 semanas):** Plan Free
- **Para producción:** PostgreSQL Starter ($7/mes) es ESENCIAL
- **Para mejor UX:** Web + PostgreSQL Starter ($14/mes)

## 📚 Documentación Completa

Consulta `DEPLOY_RENDER.md` para:
- Instrucciones paso a paso con capturas
- Configuración detallada de variables de entorno
- Solución de problemas comunes
- Configuración de Gmail para producción
- Monitoreo y alertas
- Backups y seguridad

## 🚀 Próximos Pasos

1. ✅ Sube código a GitHub
2. ✅ Crea cuenta en Render
3. ✅ Crea PostgreSQL Database
4. ✅ Crea Web Service
5. ✅ Configura variables de entorno
6. ✅ Deploy automático
7. ✅ Verifica que la app funcione
8. ✅ Crea datos de prueba si es necesario

## 🆘 Si algo falla

### ❌ Error más común: "Could not parse SQLAlchemy URL"

**Síntoma:**
```
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

**Solución Rápida:**
1. Dashboard Render → PostgreSQL Database → "Connections"
2. Copiar **Internal Database URL**
3. Web Service → "Environment" → Editar `DATABASE_URL`
4. Pegar URL (sin comillas, sin espacios)
5. "Save Changes" → Redeploy automático

👉 **Guía detallada:** [ERROR_DATABASE_URL.md](ERROR_DATABASE_URL.md)

---

### ❌ Error: "psycopg2 undefined symbol _PyInterpreterState_Get"

**Síntoma:**
```
ImportError: undefined symbol: _PyInterpreterState_Get
```

**Solución Rápida:**
1. Archivos `.python-version` y `runtime.txt` ya creados en el repo
2. Hacer push: `git push origin main`
3. Render → "Manual Deploy" → **"Clear build cache & deploy"**
4. Verificar logs: debe decir "Using Python version 3.11.0"

👉 **Guía detallada:** [ERROR_PSYCOPG2_PYTHON.md](ERROR_PSYCOPG2_PYTHON.md)

---

### ❌ Error: "SSL connection has been closed unexpectedly"

**Síntoma:**
```
psycopg2.OperationalError: SSL connection has been closed unexpectedly
```

**Solución Rápida:**
1. `config.py` ya actualizado para agregar SSL automáticamente
2. Hacer push: `git push origin main`
3. Redeploy automático en Render
4. Verificar logs: migraciones deben ejecutarse correctamente

**Solución Manual (si persiste):**
- Agregar `?sslmode=require` al final de `DATABASE_URL` en Render Environment

👉 **Guía detallada:** [ERROR_SSL_POSTGRES.md](ERROR_SSL_POSTGRES.md)

---

### Otros problemas:

1. Revisa logs en Render Dashboard
2. Verifica que `DATABASE_URL` esté configurado
3. Confirma que todas las variables de entorno estén presentes
4. Consulta sección "Solución de Problemas" en `DEPLOY_RENDER.md`

---

**¡Tu aplicación está 100% lista para producción! 🎉**
