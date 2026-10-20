# Tareas del propietario

Lo que solo puede hacer Sergio. Marca cada casilla al terminarla. El agente añade aquí lo que no puede resolver solo; el detalle de cuentas, entornos y secretos está en [`SETUP.md`](./SETUP.md).

## Pendientes

- [ ] **Token de BGG**, cuando BoardGameGeek apruebe la aplicación `alvaro2b`:
  1. Crea el token en https://boardgamegeek.com/applications (botón *Tokens* de la aplicación).
  2. Añádelo a `.claude/settings.local.json` como `BGG_TOKEN`, para el desarrollo local.
  3. Añádelo a Vercel, marcado como sensible: `vercel env add BGG_TOKEN production --sensitive`.
  4. **Vuelve a desplegar** (*Redeploy* del último despliegue de Production). Un despliegue ya hecho no ve las variables nuevas.
  5. Comprueba que en *Juegos → Añadir* aparece "Buscar en BoardGameGeek".
- [ ] **Comprobar que un backup se descifra** (una vez y, después, de vez en cuando):
  1. Descarga el último artefacto del workflow *Backup* en la pestaña *Actions* de GitHub.
  2. Ejecuta `age -d -i $HOME\alvaro2b-backup.agekey backup.tar.age | tar -t`. Debe listar `roles.sql`, `schema.sql` y `data.sql`.
- [ ] **Invitar a los Members**: *Más → Admin: accesos y datos → Autorizar un email*, y después el botón *WhatsApp* para mandarle el enlace. La aplicación no envía ningún email ([ADR 0005](./adr/0005-google-sign-in-with-allowlist.md)). Si esa persona ya jugaba como invitado, elígelo en "¿Ya jugaba como invitado?" para que conserve su historial.

## Opcionales

- [ ] **Logo oficial "Powered by BGG"**: el agente no puede descargarlo (BGG responde 403 a peticiones automáticas). Guarda el logo oficial como `public/powered-by-bgg.webp` y pide al agente que sustituya la insignia de texto.
- [ ] **Aviso "Leaked Password Protection"** del advisor de Supabase: no aplica, porque no hay login con contraseña. Si quieres silenciarlo, actívalo en *Authentication* si tu plan lo permite.

## Recurrentes

- **Cada 90 días:** renueva `SUPABASE_ACCESS_TOKEN` y `VERCEL_TOKEN` en `.claude/settings.local.json`. Ningún Secret de GitHub depende de ellos.
- **Si cambias la contraseña de la base de datos:** actualiza `SUPABASE_DB_PASSWORD` en `.claude/settings.local.json` y pide al agente que regenere el Secret `SUPABASE_DB_URL` de GitHub.
- **Si llega un email de Supabase avisando de una pausa:** el keep-alive no funciona. Avisa al agente.
- **Si llega un email de GitHub avisando de que va a desactivar el workflow de backup por inactividad:** reactívalo en la pestaña *Actions*.

## Hechas

- [x] Desactivar el proveedor de email en Supabase (2026-10-20).
- [x] Confirmar el login con Google en producción (2026-10-20).
