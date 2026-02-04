# 🚨 ERROR: psycopg2 undefined symbol _PyInterpreterState_Get

## Problema

```
ImportError: /opt/render/project/src/.venv/lib/python3.13/site-packages/psycopg2/_psycopg.cpython-313-x86_64-linux-gnu.so: undefined symbol: _PyInterpreterState_Get
```

## ❌ Causa

**Incompatibilidad de `psycopg2` con Python 3.13.** Render está usando Python 3.13 que tiene problemas de compatibilidad con `psycopg2-binary==2.9.9`.

## ✅ Solución

He corregido el problema agregando archivos para forzar Python 3.11:

### Archivos Creados:

1. **`.python-version`** - Especifica Python 3.11.0
2. **`runtime.txt`** - Alternativa para especificar versión de Python
3. **`requirements.txt`** - Actualizado con Werkzeug

### Cambios en Render:

Si los archivos anteriores no son suficientes, configura manualmente:

1. Ve a tu **Web Service** en Render
2. Ve a **"Environment"**
3. Busca o agrega la variable:
   ```
   PYTHON_VERSION=3.11.0
   ```
4. Guarda y fuerza un **Clear build cache & deploy**

---

## 🔧 Opción Alternativa: Actualizar psycopg2

Si prefieres mantener Python 3.13, puedes intentar con la versión más reciente de psycopg (v3):

### Cambiar en `requirements.txt`:

```diff
- psycopg2-binary==2.9.9
+ psycopg[binary]==3.1.18
```

**⚠️ Advertencia:** psycopg3 tiene una API diferente y puede requerir cambios en el código.

---

## 🎯 Solución Recomendada (Ya Aplicada)

**Usar Python 3.11** es la opción más segura y sin cambios en código:

1. ✅ `.python-version` creado
2. ✅ `runtime.txt` creado  
3. ✅ `requirements.txt` actualizado con Werkzeug
4. ✅ `render.yaml` ya especifica PYTHON_VERSION=3.11.0

---

## 📋 Pasos para Aplicar la Corrección

### 1. Subir cambios a GitHub

```bash
git add .
git commit -m "Fix: Forzar Python 3.11 para compatibilidad con psycopg2"
git push origin main
```

### 2. Limpiar caché en Render

En tu Web Service:
1. Ve a **"Manual Deploy"**
2. Haz clic en **"Clear build cache & deploy"**
3. Espera que termine el build

### 3. Verificar en logs

Deberías ver:
```
==> Using Python version 3.11.0
==> Installing dependencies
==> Successfully installed psycopg2-binary-2.9.9
```

---

## 🔍 Cómo Verificar que Funcionó

### En los logs de Render, busca:

✅ **Correcto:**
```
Using Python version 3.11.0
Installing dependencies...
Successfully installed psycopg2-binary-2.9.9
🗄️  Ejecutando migraciones de base de datos...
Running upgrade ... -> ..., done
✅ Build completado exitosamente
```

❌ **Incorrecto (si sigue usando Python 3.13):**
```
Using Python version 3.13.4
ImportError: undefined symbol: _PyInterpreterState_Get
```

---

## 💡 ¿Por qué Python 3.11?

- **Estabilidad:** Python 3.11 es LTS y tiene mejor soporte en herramientas
- **Compatibilidad:** `psycopg2-binary` está completamente probado con 3.11
- **Sin cambios:** No requiere modificar código de la aplicación
- **Render recomendado:** Render usa 3.11 como versión estable por defecto

---

## 🆘 Si Aún No Funciona

### Opción 1: Forzar manualmente en Render

1. Web Service → **Settings** → **Environment**
2. Agregar/Editar:
   ```
   PYTHON_VERSION=3.11.0
   ```
3. **Manual Deploy** → **Clear build cache & deploy**

### Opción 2: Verificar render.yaml

Asegúrate que `render.yaml` tiene:
```yaml
envVars:
  - key: PYTHON_VERSION
    value: 3.11.0
```

### Opción 3: Contactar soporte Render

Si persiste, puede haber un problema con la detección de versión. Abre un ticket indicando:
- "Render está ignorando PYTHON_VERSION y usando 3.13"
- Menciona que tienes `.python-version` y `runtime.txt`

---

## 📦 Archivos Actualizados

- ✅ `.python-version` (nuevo)
- ✅ `runtime.txt` (nuevo)
- ✅ `requirements.txt` (añadido Werkzeug)
- ✅ `render.yaml` (ya tenía PYTHON_VERSION)

---

**Después de hacer push y limpiar caché en Render, tu app debería arrancar correctamente! 🚀**
