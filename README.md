# Bono Solidario 💚

Aplicación web completa para la **gestión y venta de bonos solidarios**, construida con **Next.js 14 (App Router)**, **MongoDB + Mongoose**, **NextAuth.js** y **Tailwind CSS**.

## ✨ Funcionalidades

- **Vista pública**: listado de bonos con filtros y búsqueda, detalle de cada bono.
- **Carrito de compras**: sidebar, cantidades, resumen y proceso de pago con upload de comprobante.
- **Autenticación y roles**: `admin`, `vendedor` y `usuario` con protección de rutas.
- **Dashboard Admin**: KPIs, gráficos (ventas por mes, bonos más vendidos, método de pago), CRUD de bonos, ventas, usuarios y envío de notificaciones.
- **Dashboard Vendedor**: indicadores personales, gestión de sus propios bonos y sus ventas.
- **Perfil de usuario**: historial de compras y notificaciones.
- **Notificaciones por correo** (Nodemailer): confirmación de compra al usuario, nueva venta al admin y venta de bono al vendedor.
- **Pagos**: transferencia bancaria (con datos configurables y comprobante), tarjeta (placeholder para pasarela futura) y efectivo.

## 🧰 Stack

| Capa        | Tecnología                                    |
|-------------|-----------------------------------------------|
| Frontend    | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend     | API Routes de Next.js                          |
| Base de datos | MongoDB + Mongoose                             |
| Autenticación | NextAuth.js (JWT + Credentials)                |
| Validación  | Zod                                           |
| Correos     | Nodemailer                                    |
| Iconos      | Lucide React                                  |

## 📁 Estructura

```
src/
├── app/
│   ├── (público) → page.tsx, bonos/, carrito/
│   ├── login/ register/ perfil/
│   ├── admin/        → resumen, bonos, ventas, reportes, usuarios, notificaciones
│   ├── vendedor/     → resumen, bonos, ventas
│   └── api/          → auth, bonos, ventas, carrito, reportes, upload, notificaciones, config
├── components/       → ui, bonos, carrito, dashboard, layout, perfil, providers
├── lib/              → db, auth, email, api, session
├── models/           → User, Bono, Venta, Carrito, Notification
├── services/         → bonoService, ventaService, notificacionService
├── utils/            → constants, helpers, validations
└── middleware.ts     → protección de rutas por rol
```

## 🚀 Instalación

Requisitos: **Node.js 18+** y **MongoDB** local o remoto.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear variables de entorno
cp .env.example .env.local
# Edita .env.local con tus datos (MONGODB_URI, secretos, credenciales SMTP)

# 3. Cargar datos de prueba (opcional)
npm run seed

# 4. Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 🔑 Usuarios de prueba (seed)

El script `npm run seed` crea 3 usuarios demo con **contraseñas aleatorias generadas en cada ejecución**:

| Rol        | Email                      |
|------------|----------------------------|
| Admin      | admin@bonosolidario.com    |
| Vendedor   | vendedor@bonosolidario.com |
| Usuario    | cliente@bonosolidario.com  |

Al ejecutarlo, las contraseñas se imprimen **una sola vez** en la consola (guárdalas). Nunca se incluyen en el código ni en el repositorio. Si necesitas restablecerlas, vuelve a ejecutar `npm run seed` (esto **borra y recrea** bonos, ventas y usuarios demo).

## ⚙️ Variables de entorno

Ver `.env.example`:

- `MONGODB_URI` — conexión a MongoDB.
- `NEXTAUTH_SECRET` — secreto de NextAuth (generar con `openssl rand -base64 32`).
- `NEXTAUTH_URL` — URL base de la app.
- `EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASSWORD / EMAIL_FROM` — credenciales SMTP (Gmail usa contraseña de aplicación).
- `ADMIN_EMAIL` — destinatario de avisos de nuevas ventas.
- `BANCO_NOMBRE / BANCO_CUENTA / BANCO_TIPO_CUENTA / BANCO_TITULAR` — datos bancarios mostrados en transferencias.
- `R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL` — Cloudflare R2 (ver abajo).
- `BREVO_API_KEY / BREVO_SENDER_NAME / BREVO_DAILY_LIMIT` — Brevo para correos (ver abajo).
- `CRON_SECRET` — protege el endpoint `/api/cron/emails` de Vercel Cron.

> Sin credenciales SMTP la app funciona en modo desarrollo: los correos se muestran en la consola.

## 📧 Cola de correos y envío masivo (Brevo)

Todos los correos (confirmación de compra, aviso al admin, aviso al vendedor y **envío masivo** del panel admin) pasan por una **cola en MongoDB** (`EmailQueue`). Esto evita congestionar la app: las requests solo encolan y un **worker** despacha en segundo plano con **concurrencia limitada (5)** y respetando el **límite diario** (`BREVO_DAILY_LIMIT`, default 300). Los correos con error se **reintentan** hasta 3 veces con backoff.

### Proveedor
- Con `BREVO_API_KEY` definido, se envía vía **Brevo API** (`https://api.brevo.com/v3/smtp/email`).
- Sin esa variable, se usa el SMTP de Gmail configurado (útil en desarrollo).
- **Brevo free**: 300 correos/día. Para producción verifica tu dominio en el panel de Brevo (DNS) y usa un `sender` verificado.

### Procesamiento en Vercel
- **`vercel.json`** define un cron diario (`0 6 * * *`) → `GET /api/cron/emails`, protegido con `Authorization: Bearer <CRON_SECRET>` (y `x-vercel-cron`).
- Tras cada compra se encolan los correos y se procesa un lote pequeño **de forma síncrona** para que los transaccionales salgan de inmediato (seguro en serverless).
- En el panel **Admin → Notificaciones** puedes ver las stats de la cola (pendientes/enviados/errores) y pulsar "Procesar cola ahora".

> **Vercel Hobby**: los cron solo pueden ejecutarse **una vez al día**. Con eso y los envíos inmediatos de cada compra, la app funciona correctamente. Para procesar la cola masiva más veces al día hay dos opciones:
> - **Pro**: cambiar el cron en `vercel.json` a `*/1 * * * *` (por minuto).
> - **Hobby + trigger externo**: un **Cloudflare Worker** (gratis) que llame cada 5 min a `https://tu-app.vercel.app/api/cron/emails` con header `Authorization: Bearer <CRON_SECRET>`.
>
> En desarrollo, ejecuta `npm run dev` y llama al endpoint con ese header para forzar el procesamiento.

## ☁️ Cloudflare R2 (storage de imágenes)

Las imágenes de bonos y los comprobantes de pago se suben a un bucket de **Cloudflare R2** (10 GB gratis, sin costo por descargas). Si no se configuran las variables R2, la app usa un **fallback local** en `/public/uploads` (solo desarrollo).

### Pasos en Cloudflare

1. **Crear bucket** en R2: panel → *R2* → *Create bucket* (nombre: ej. `bono-solidario`).
2. **Habilitar acceso público**: en el bucket → *Settings* → *Public access* → *Allow access* → guarda la URL tipo `https://pub-xxxx.r2.dev`.
3. **Crear API token**: *R2* → *Manage R2 API Tokens* → *Create API token*, permisos de **Object Read & Write** únicamente sobre ese bucket.
4. Completar en `.env`:

```env
R2_ACCOUNT_ID=tu-account-id-de-cloudflare
R2_ACCESS_KEY_ID=access-key
R2_SECRET_ACCESS_KEY=secret-key
R2_BUCKET=nombre-del-bucket
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

La escritura solo ocurre a través de la API autenticada (`/api/upload`); el bucket se mantiene con lectura pública.

## 🚀 Despliegue en Vercel

### 1. Repositorio
```bash
git init
git add .
git commit -m "Initial commit"
# crea un repo en GitHub y súbelo
git remote add origin https://github.com/TU_USUARIO/bono-solidario.git
git push -u origin main
```

### 2. Importar en Vercel
Ve a [vercel.com/new](https://vercel.com/new), importa el repo (framework: **Next.js**). El build es automático.

### 3. Variables de entorno en Vercel (Settings → Environment Variables)
Copia los valores de tu `.env` local (¡no subas `.env` al repo!, ya está en `.gitignore`):

| Variable | Notas |
|---|---|
| `MONGODB_URI` | URI de Atlas con la BD (`…/bonos-solidarios?appName=…`) |
| `NEXTAUTH_SECRET` | Genera uno con `openssl rand -base64 32` (o el de tu `.env`) |
| `NEXTAUTH_URL` | La URL de producción, ej. `https://bono-solidario.vercel.app` |
| `CRON_SECRET` | Genera uno nuevo con `openssl rand -base64 32` |
| `BREVO_API_KEY` | Tu API key de Brevo |
| `BREVO_SENDER_NAME` | Nombre del remitente |
| `BREVO_DAILY_LIMIT` | `300` (límite del plan free) |
| `EMAIL_USER` / `EMAIL_FROM` | Email verificado como sender (ver Brevo abajo) |
| `ADMIN_EMAIL` | Avisos de nuevas ventas |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` | Cloudflare R2 |
| `BANCO_*` | Datos bancarios para transferencias |

### 4. Configuraciones de terceros
- **MongoDB Atlas**: en *Network Access* agrega `0.0.0.0/0` (permite todas las IPs, necesario porque Vercel usa IPs variables).
- **Brevo**: verifica tu dominio como **sender** (Settings → Senders → añade y verifica tu dominio con el registro DNS) y usa ese dominio en `EMAIL_FROM`. En *Security → Authorized IPs* deja la restricción de IPs **desactivada** (API keys: Deactivated) para que Vercel pueda enviar.
- **Cloudflare R2**: bucket con acceso público (`r2.dev`) habilitado; las keys solo en el servidor.

### 5. Cron de correos
El `vercel.json` ya define el cron diario. En Vercel se activa automáticamente en el primer deploy de producción. Recuerda las limitaciones **Hobby** (1 vez/día) descritas arriba.

### 6. Verificación post-deploy
1. Abre la URL de producción y haz login con un usuario admin.
2. Crea/edita un bono y **sube una imagen** (debe quedar en R2).
3. Compra un bono y verifica el correo de confirmación (Brevo).
4. Envía una notificación masiva desde el admin y revisa las stats de la cola.

## 🧪 Scripts

```bash
npm run dev     # desarrollo
npm run build   # build de producción
npm start       # servidor de producción
npm run lint    # lint
npm run seed    # datos de prueba
```

## 🔒 Seguridad

- Contraseñas hasheadas con `bcryptjs`.
- Validación con Zod en frontend y backend.
- Protección de rutas por rol (`src/middleware.ts`) y verificación en cada API.
- Subida de comprobantes validada (tipos y tamaño máx. 5MB) vía `/api/upload` (R2 en producción, local en desarrollo).
- Variables de entorno para todos los secretos; `.env*` y `/public/uploads` en `.gitignore`.

## 🧩 Extensión futura

La estructura de `ventaService.crearVenta` y el modelo `Venta` están preparados para integrar una pasarela de pago (Stripe/PayPal): basta agregar el proveedor en el paso de pago y guardar el `paymentIntent`/`id` de la transacción.

## 📄 Licencia

Proyecto de uso libre con fines solidarios.