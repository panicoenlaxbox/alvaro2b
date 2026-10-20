# Puesta en marcha: tareas del propietario

Esta es la lista de lo que tiene que hacer Sergio (cuenta de GitHub `panicoenlaxbox`) **una sola vez y a mano** antes de que el agente pueda construir y desplegar la aplicación sin intervención. Todo lo que no aparece aquí lo hace el agente.

Al final de cada paso queda apuntado qué valor produce y dónde se guarda. **Ningún valor de esta lista se escribe en el repositorio**, que es público.

## Estado

Solo valores no secretos. Los secretos viven en el gestor de contraseñas del propietario y en las variables de entorno del paso 8.

| Paso | Estado | Datos |
|---|---|---|
| 1. Herramientas | ✅ | Vercel CLI 64.7.0, age 1.3.2, Docker 29.8.2 |
| 2. GitHub | ✅ | Repositorio `panicoenlaxbox/alvaro2b` (público). `gh` usa `GH_TOKEN` desde `.claude/settings.local.json` (ignorado por git) |
| 3. Supabase | ✅ | Proyecto `alvaro2b`, ref `wrpqbelrdownbdbqplio`. Data API activa, tablas nuevas no expuestas automáticamente, RLS automática, sin integración con GitHub. Token `alvaro2b-agent` (90 días). URL Configuration hecha |
| 4. Google | ✅ | Proyecto de Google Cloud `alvaro2b`, app publicada (In production), sin logo. Cliente OAuth `alvaro2b-web`. Proveedor Google activado en Supabase |
| 5. Vercel | ✅ | Cuenta Hobby (email y contraseña) con GitHub `panicoenlaxbox` conectado en Login Connections. Vercel GitHub App con acceso solo a `alvaro2b`. Token `alvaro2b-agent` (90 días), scope "Sergio" |
| 6. BGG (opcional) | ⏳ Solicitud enviada, pendiente de aprobación | Aplicación `alvaro2b`, no comercial, código público. Cuando la aprueben: crear el token y definir `BGG_TOKEN` |
| 7. Clave age | ✅ | Clave pública `age1za7r7s2amjq4r4rvfgj7pr99rjfaknq0gmw7x4qpu3ye7vuv544qxszdre`. La clave privada está en el gestor de contraseñas y en `$HOME\alvaro2b-backup.agekey` |
| 8. Secretos locales | ✅ | En `.claude/settings.local.json` (ignorado): `GH_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VERCEL_TOKEN`, `AGE_RECIPIENT`, `ADMIN_EMAIL`. Falta `BGG_TOKEN` |
| 9. Claude Code | ✅ | MCP `supabase` conectado (solo lectura). Vercel CLI como `panicoenlaxbox-9567`, equipo `sergio-1c62`. `gh` como `panicoenlaxbox` |

### Estado del trabajo del agente

Lo que queda por hacer del propietario está en [`TASKS.md`](./TASKS.md).

| Tarea | Estado | Notas |
|---|---|---|
| Proveedor de email desactivado en Supabase | ✅ Hecho por el propietario | El token del agente no tiene `project_admin_write`, necesario para cambiar la configuración de Auth por la Management API. Además, un trigger rechaza cualquier alta que no venga de Google |
| Primer Admin | ✅ | Insertado desde `ADMIN_EMAIL` con `scripts/bootstrap-admin.mjs` |
| Login con Google en producción | ✅ Confirmado por el propietario | Primer acceso real del Admin con Google |
| `BGG_TOKEN` | ⏳ Pendiente de BGG | La integración ya está desplegada y se activa sola con el token (buscador en *Añadir juego* y bloque *BGG info*). Probada contra BGG con un token falso: responde 401 y la app sigue en modo manual. Cuando exista: añadirlo a Vercel (`vercel env add BGG_TOKEN production`, marcado como sensible) y **volver a desplegar** (por ejemplo, *Redeploy* del último despliegue). Las variables nuevas no llegan a un despliegue ya hecho |
| Proyecto de Vercel | ✅ | `alvaro2b` en `sergio-1c62`, conectado a GitHub. Solo despliega `main` (`vercel.json`). Variables de Production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `CRON_SECRET` |
| Backup semanal | ✅ | `.github/workflows/backup.yml`, domingos a las 03:23 UTC. Secrets `SUPABASE_DB_URL` y `AGE_RECIPIENT`. Primera ejecución manual correcta (artefacto `alvaro2b-backup-1`). Al renovar la contraseña de la base de datos hay que actualizar `SUPABASE_DB_URL` |
| Keep-alive | ✅ | Cron diario de Vercel a las 06:17 UTC. Se puede comprobar en la tabla `keep_alive` |
| Aviso del advisor "Leaked Password Protection" | ℹ️ Aceptado | No aplica: no hay login con contraseña (solo Google). El token del agente no puede cambiar la configuración de Auth. Opcional: activarlo en *Authentication* si el plan lo permite; no cambia nada en la práctica |
| Logo "Powered by BGG" | ℹ️ Provisional | El agente no puede descargar los logos oficiales (BGG responde 403 a peticiones automáticas). Se muestra una insignia de texto con enlace a BGG. Opcional: descargar el logo oficial de BGG y guardarlo como `public/powered-by-bgg.webp` para que el agente lo use |
| Pooler de Supabase | ℹ️ | `aws-0-eu-west-1.pooler.supabase.com`, modo sesión en el puerto 5432 (lo usan el backup y el script del Admin) |

## Entornos

| Entorno | Base de datos | Aplicación |
|---|---|---|
| Local | Supabase en Docker (`supabase start`), con datos ficticios | `pnpm dev` en `http://localhost:3000` |
| Producción | Proyecto Supabase `alvaro2b` | `https://alvaro2b.vercel.app`, desplegado desde `main` |

No hay staging ni previews de Vercel (ver [ADR 0001](./adr/0001-nextjs-supabase-vercel-zero-cost.md)).

## 1. Instalar herramientas

Ya instaladas: Node 24, pnpm, Docker Desktop, Git y GitHub CLI. Faltan estas:

```powershell
winget install FiloSottile.age   # cifrado de backups
npm i -g vercel                  # Vercel CLI
```

La CLI de Supabase **no** se instala globalmente. Va como dependencia de desarrollo del proyecto (`pnpm add -D supabase`, que se ejecuta con `pnpm supabase ...`), así que llega con `pnpm install`. La añade el agente.

Comprobación, en una terminal nueva y con Docker Desktop arrancado: `vercel --version`, `age --version` y `docker info`.

## 2. GitHub

1. Añade tu cuenta personal a `gh`, con permiso para workflows. La cuenta del trabajo sigue disponible.
   ```powershell
   gh auth login --hostname github.com --git-protocol https --web --scopes workflow
   gh auth switch --user panicoenlaxbox
   gh auth status   # la cuenta activa debe ser panicoenlaxbox
   ```
2. Crea el repositorio **vacío y público** `panicoenlaxbox/alvaro2b`, sin README, licencia ni `.gitignore`. El agente subirá el historial local.
3. ✅ Hecho: el email de autor de los commits (`panicoenlaxbox@gmail.com`) está configurado solo en este repositorio (`git config --local user.email`). Vercel Hobby solo despliega commits cuyo autor sea el dueño de la cuenta.

**Produce:** la sesión de `gh`.

## 3. Supabase

1. Regístrate en https://supabase.com con **"Continue with GitHub"** (`panicoenlaxbox`) y elige el plan Free.
2. Crea el proyecto `alvaro2b` en la región de la UE más cercana (por ejemplo `eu-west-3`, París). Genera una contraseña de base de datos fuerte y guárdala en tu gestor de contraseñas. En **Security**:
   - Enable Data API: ✅ marcada.
   - Automatically expose new tables: ⬜ **desmarcada**. Las migraciones dan los permisos explícitamente.
   - Enable automatic RLS: ✅ marcada.
   - GitHub (optional): **no conectar**. Las migraciones se aplican con la CLI.
3. Apunta el **project ref**: está en la URL `https://supabase.com/dashboard/project/<ref>`.
4. Crea un **token personal limitado** en *Account → Access Tokens*:
   - proyecto: solo `alvaro2b`;
   - caducidad: 90 días (habrá que renovarlo);
   - resource access: **Project**, con solo el proyecto `alvaro2b`;
   - permisos: **todos en `Read`**, salvo **Migrations** y **Auth Config**, que van en `Read-write`. El mínimo imprescindible sería Read en Project Settings, Advisors, Logs, Database, API Keys y API Key Secrets. Se eligió "todo Read" por sencillez: el permiso de lectura más delicado, API Key Secrets, ya era necesario de todos modos.
5. En *Authentication → URL Configuration*:
   - Site URL: `https://alvaro2b.vercel.app`
   - Redirect URLs: `https://alvaro2b.vercel.app/**`
6. La **Callback URL** para Google es `https://wrpqbelrdownbdbqplio.supabase.co/auth/v1/callback`. Hace falta en el paso 4.

**Produce:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` y `SUPABASE_DB_PASSWORD`.

## 4. Google (login de los Members)

1. En https://console.cloud.google.com crea un proyecto `alvaro2b`.
2. En *Google Auth Platform → Branding*:
   - App name `alvaro2b` y tu gmail como support y developer contact.
   - **Sin logo**: un logo obliga a verificar la app.
   - Home page `https://alvaro2b.vercel.app`.
   - Privacy policy `https://alvaro2b.vercel.app/privacy` (la crea el agente).
   - Authorized domain `alvaro2b.vercel.app`. No `vercel.app`, que es un dominio compartido.
3. En *Audience*: tipo **External**, y después **Publish app**, para que entre cualquier cuenta de Google. Con los permisos básicos (`openid`, `email`, `profile`) no hace falta verificación. Quién entra de verdad lo decide la lista de emails autorizados de la aplicación.
4. En *Data Access*: añade los permisos `openid`, `.../auth/userinfo.email` y `.../auth/userinfo.profile`.
5. En *Clients → Create client*, de tipo **Web application**:
   - Authorized JavaScript origins: `http://localhost:3000` y `https://alvaro2b.vercel.app`.
   - Authorized redirect URIs: la Callback URL del paso 3.6 y `http://127.0.0.1:54321/auth/v1/callback` (Supabase local).
6. En Supabase, en *Authentication → Providers → Google*: pega el Client ID y el Client Secret, y activa el proveedor.

**Produce:** `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. Hacen falta también en local, para el login con Supabase en Docker.

## 5. Vercel

1. Regístrate en https://vercel.com con el plan Hobby. Si te registras con email y contraseña, conecta después GitHub (`panicoenlaxbox`) en *Account Settings → Authentication → Login Connections*. Vercel Hobby solo despliega commits cuyo autor sea la cuenta de GitHub conectada, y el email de los commits (`panicoenlaxbox@gmail.com`) debe estar verificado en esa cuenta de GitHub. No importes ningún proyecto: lo crea el agente.
2. Instala la **Vercel GitHub App** en tu cuenta, con acceso al repositorio `alvaro2b` (en *Account Settings → Git → GitHub*, o al importar).
3. Crea un **token** en *Account Settings → Tokens*, con el alcance más reducido que permita tu cuenta personal y caducidad de 90 días.

**Produce:** `VERCEL_TOKEN`.

El agente crea el proyecto `alvaro2b` en Vercel, lo conecta al repositorio, desactiva las previews (solo despliega `main`) y configura las variables de Production. Si `alvaro2b.vercel.app` está ocupado, te propondrá una alternativa y habrá que actualizar las URLs de los pasos 3.5 y 4.5.

## 6. BoardGameGeek (opcional, no bloquea)

1. En https://boardgamegeek.com/applications registra la aplicación como **no comercial**. La aprobación puede tardar una semana o más.
2. Cuando la aprueben, crea un token.

**Produce:** `BGG_TOKEN`. Mientras no exista, la aplicación funciona con alta manual de Games.

## 7. Clave de cifrado de backups

```powershell
age-keygen -o "$HOME\alvaro2b-backup.agekey"
```

- La línea `# public key: age1...` es el **destinatario** público.
- El archivo es la **clave privada**. Guárdalo en tu gestor de contraseñas y fuera de cualquier repositorio. Sin ella, los backups no se pueden descifrar.

**Produce:** `AGE_RECIPIENT`, que es la clave pública.

## 8. Secretos locales en `.claude/settings.local.json`

Los secretos **no** van en variables de entorno de usuario ni de sistema. Van en el bloque `env` de `.claude/settings.local.json`, que está ignorado por git y solo afecta a este proyecto. Claude Code los inyecta en cada sesión de este repositorio: las CLI (`gh`, `supabase`, `vercel`) los reciben y no interfieren con las cuentas del trabajo. Desde ahí, el agente los copia a Vercel y a los Secrets de GitHub.

Ejecútalo en tu propia PowerShell, en la raíz del repositorio. Conserva el `GH_TOKEN` del paso 2 y pide los secretos con la entrada enmascarada, para que no queden en el historial:

```powershell
$f = '.claude\settings.local.json'
$s = Get-Content $f -Raw | ConvertFrom-Json -AsHashtable
$s.env.SUPABASE_PROJECT_REF = 'wrpqbelrdownbdbqplio'
$s.env.AGE_RECIPIENT        = 'age1za7r7s2amjq4r4rvfgj7pr99rjfaknq0gmw7x4qpu3ye7vuv544qxszdre'
$s.env.ADMIN_EMAIL          = 'panicoenlaxbox@gmail.com'  # la cuenta de Google del Admin
'SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','VERCEL_TOKEN' | ForEach-Object {
  $s.env[$_] = Read-Host -Prompt $_ -MaskInput
}
$s | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 $f
```

`BGG_TOKEN` se añade igual cuando BGG apruebe la solicitud. Al renovar un token, basta con editar su valor en ese archivo. Reinicia Claude Code para que cargue los cambios.

## 9. Claude Code

1. Aprueba los archivos que deja preparados el agente:
   - `.mcp.json`. Contiene el servidor MCP `supabase`, limitado al proyecto y en **solo lectura**. No tiene secretos, porque usa `${SUPABASE_ACCESS_TOKEN}`. Los cambios de esquema se hacen con migraciones a través de la CLI, nunca por el MCP.
   - `.claude/settings.json`. Contiene los comandos permitidos y prohibidos para el trabajo autónomo.
2. Abre `claude` en el repositorio, acepta el servidor MCP del proyecto cuando te lo pida y comprueba con `/mcp` que aparece conectado.
3. Lanza el goal en modo `auto`, el modo por defecto: `claude --permission-mode auto`.

## Qué hace el agente después (sin intervención)

- Añade el remoto (`https://panicoenlaxbox@github.com/panicoenlaxbox/alvaro2b.git`, con el usuario en la URL para que git use la cuenta personal) y sube el historial.
- Crea el proyecto en Vercel, lo conecta a GitHub, desactiva las previews y define las variables de Production.
- Configura el cron diario de keep-alive en Vercel.
- Define los Secrets de GitHub Actions para el backup semanal cifrado.
- Construye la aplicación con migraciones versionadas: las prueba en local y después las aplica en producción.
- Trabaja en ramas, con una PR por funcionalidad que prueba en local con Chrome y luego integra en `main`.

## Líneas rojas del agente

- Nunca `git push --force` a `main`. En las ramas de trabajo solo se reescribe la historia con `--force-with-lease`.
- Nunca borrar el proyecto de Supabase o de Vercel, ni tablas con datos de producción.
- Nunca tocar la facturación ni cambiar de plan.
- Nunca escribir secretos ni datos reales en el repositorio.
- En producción, solo pruebas de humo, sin dejar datos falsos.

## Mantenimiento recurrente del propietario

Las tareas pendientes, opcionales y recurrentes del propietario están en [`TASKS.md`](./TASKS.md).
