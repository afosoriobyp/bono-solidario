# 🎫 Sistema de Gestión de Bonos - Rifas

Aplicación web para gestión de rifas, boletas y usuarios, desarrollada con Flask usando arquitectura modular (Blueprints), migraciones con Flask-Migrate y notificaciones en tiempo real con Flask-SocketIO y pywebpush.

## 🚀 Características Principales

- ✅ **Gestión de Rifas**: Creación y administración de rifas con premios
- ✅ **Venta de Boletas**: Sistema de venta para vendedores y compradores
- ✅ **Gestión de Vendedores**: CRUD completo con validaciones y export CSV
- ✅ **Dashboard Administrativo**: Estadísticas y reportes en tiempo real
- ✅ **Notificaciones**: Sistema de notificaciones por email y push
- ✅ **WebSockets**: Actualizaciones en tiempo real con SocketIO
- ✅ **Responsive**: Interfaz adaptable a dispositivos móviles

## 📋 Requisitos

- Python 3.11+
- PostgreSQL (para producción) o SQLite (para desarrollo)
- Cuenta de Gmail para envío de correos

## 🛠️ Instalación Local

### 1. Clonar repositorio y crear entorno virtual

```bash
git clone <url-del-repositorio>
cd bonos
python -m venv venv
```

### 2. Activar entorno virtual

**Windows:**
```powershell
.\venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Gmail y SECRET_KEY.

### 5. Inicializar base de datos
```bash
flask db upgrade
```

### 6. Crear datos de prueba (opcional)

```bash
python create_test_users.py
python create_test_data.py
```

### 7. Ejecutar aplicación

```bash
python run.py
```

La aplicación estará disponible en: `http://localhost:5000`

## 🌐 Despliegue en Producción (Render)

Para desplegar en Render con PostgreSQL, consulta la **guía completa**:

👉 **[DEPLOY_RENDER.md](DEPLOY_RENDER.md)**

**Costo estimado:** $0-$14/mes
- Plan Free: $0/mes (con limitaciones)
- Plan Starter: $7/mes (Web) + $7/mes (PostgreSQL)

## 📁 Estructura del Proyecto

```
bonos/
├── app/
│   ├── blueprints/       # Rutas (admin, auth, buyer, seller)
│   ├── models/           # Modelos SQLAlchemy
│   ├── static/           # CSS, JS, imágenes
│   ├── templates/        # Plantillas Jinja2
│   ├── utils/            # Utilidades (notificaciones)
│   └── websockets/       # Eventos SocketIO
├── migrations/           # Migraciones Alembic
├── config.py             # Configuración de la aplicación
├── run.py                # Punto de entrada
├── requirements.txt      # Dependencias Python
├── build.sh              # Script de build para Render
├── render.yaml           # Configuración de Render
└── .env                  # Variables de entorno (no en Git)
```

## 🔐 Configuración de Email (Gmail)

1. Activa **verificación en 2 pasos** en tu cuenta de Gmail
2. Genera una **contraseña de aplicación**: https://myaccount.google.com/apppasswords
3. Usa esa contraseña en `MAIL_PASSWORD` del archivo `.env`

## 📊 Base de Datos

- **Desarrollo:** SQLite (archivo local `bonos.db`)
- **Producción:** PostgreSQL en Render

### Migraciones

```bash
# Aplicar migraciones
flask db upgrade

# Crear nueva migración
flask db migrate -m "descripción"

# Revertir migración
flask db downgrade
```

## 👥 Roles de Usuario

- **Administrador**: Gestión completa de rifas, vendedores, compradores
- **Vendedor**: Venta de boletas y visualización de comisiones
- **Comprador**: Compra de boletas e historial

## 🛡️ Seguridad

- ✅ Autenticación con Flask-Login
- ✅ Contraseñas hasheadas
- ✅ Variables de entorno para datos sensibles
- ✅ Pool de conexiones optimizado para PostgreSQL

## 📝 Tecnologías

- **Backend:** Flask 3.0, SQLAlchemy, Alembic
- **Frontend:** Bootstrap 5, JavaScript, SocketIO
- **Base de datos:** PostgreSQL / SQLite
- **Email:** Flask-Mail, Gmail SMTP
- **Push:** pywebpush
- **WebSockets:** Flask-SocketIO, eventlet
- **Deploy:** Render, Gunicorn

---

**Desarrollado con ❤️ para la gestión eficiente de rifas**
