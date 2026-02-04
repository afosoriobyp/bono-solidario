# 📦 Comandos para Subir a Git

## Opción A: Subir a GitHub (Recomendado)

### 1. Crear repositorio en GitHub
- Ve a: https://github.com/new
- Nombre: `bonos` (o el que prefieras)
- **NO** inicialices con README (ya lo tienes)
- Copia la URL del repositorio

### 2. Comandos en tu terminal local

```powershell
# Activar entorno virtual (si no lo está)
& D:\Python\bonos\venv\Scripts\Activate.ps1

# Ver estado actual
git status

# Agregar todos los archivos
git add .

# Ver qué se va a incluir
git status

# Commit inicial
git commit -m "Preparar aplicación para despliegue en Render con PostgreSQL"

# Conectar con GitHub (reemplaza con TU URL)
git remote add origin https://github.com/tu-usuario/bonos.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

---

## Opción B: Subir a GitLab

### 1. Crear repositorio en GitLab
- Ve a: https://gitlab.com/projects/new
- Nombre: `bonos`
- **NO** inicialices con README

### 2. Comandos en tu terminal local

```powershell
# Activar entorno virtual
& D:\Python\bonos\venv\Scripts\Activate.ps1

# Agregar archivos
git add .

# Commit
git commit -m "Preparar aplicación para despliegue en Render con PostgreSQL"

# Conectar con GitLab (reemplaza con TU URL)
git remote add origin https://gitlab.com/tu-usuario/bonos.git

# Subir
git branch -M main
git push -u origin main
```

---

## Opción C: Subir a Bitbucket

### 1. Crear repositorio en Bitbucket
- Ve a: https://bitbucket.org/repo/create
- Nombre: `bonos`

### 2. Comandos en tu terminal local

```powershell
# Activar entorno virtual
& D:\Python\bonos\venv\Scripts\Activate.ps1

# Agregar archivos
git add .

# Commit
git commit -m "Preparar aplicación para despliegue en Render con PostgreSQL"

# Conectar con Bitbucket (reemplaza con TU URL)
git remote add origin https://bitbucket.org/tu-usuario/bonos.git

# Subir
git branch -M main
git push -u origin main
```

---

## ⚠️ IMPORTANTE: Verificar archivos

### Antes de hacer push, verifica:

```powershell
# Ver archivos que se van a subir
git status

# Asegurarte que .env NO esté en la lista (debe estar ignorado)
# Si ves .env en la lista, ejecuta:
git rm --cached .env
git commit -m "Remover .env del repositorio"
```

### Archivos que SÍ deben subirse:
- ✅ `requirements.txt`
- ✅ `config.py`
- ✅ `build.sh`
- ✅ `render.yaml`
- ✅ `.env.example` (plantilla sin credenciales)
- ✅ `DEPLOY_RENDER.md`
- ✅ `README.md`
- ✅ `CHECKLIST_DEPLOY.md`
- ✅ `app/` (toda la carpeta)
- ✅ `migrations/` (toda la carpeta)

### Archivos que NO deben subirse:
- ❌ `.env` (contiene credenciales sensibles)
- ❌ `bonos.db` (base de datos local)
- ❌ `venv/` (entorno virtual)
- ❌ `__pycache__/` (archivos compilados)
- ❌ `instance/` (archivos de instancia local)

---

## 🔐 Configurar Autenticación (si es necesario)

### GitHub con token personal:

```powershell
# Generar token en: https://github.com/settings/tokens
# Permisos necesarios: repo (todos)

# Al hacer push, usa:
# Usuario: tu-usuario
# Password: tu-token-personal (NO tu contraseña)
```

### Configurar Git global (primera vez):

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@gmail.com"
```

---

## 📝 Comandos útiles post-push

### Ver remote configurado
```powershell
git remote -v
```

### Ver historial de commits
```powershell
git log --oneline
```

### Ver diferencias antes de commit
```powershell
git diff
```

### Ver archivos ignorados
```powershell
Get-Content .gitignore
```

---

## ✅ Verificar que funcionó

1. Ve a tu repositorio en GitHub/GitLab/Bitbucket
2. Deberías ver todos los archivos
3. Verifica que `.env` NO esté visible
4. Verifica que `DEPLOY_RENDER.md` esté visible

---

## 🚀 Siguiente paso

Una vez subido el código, ve a [CHECKLIST_DEPLOY.md](CHECKLIST_DEPLOY.md) para continuar con el despliegue en Render.
