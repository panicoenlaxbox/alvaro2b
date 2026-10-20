# Tareas del propietario

Lo que solo puede hacer Sergio. Marca cada casilla al terminarla. El agente añade aquí lo que no puede resolver solo; el detalle de cuentas, entornos y secretos está en [`SETUP.md`](./SETUP.md).

## Pendientes

- [ ] **Token de BGG**, cuando BoardGameGeek apruebe la aplicación `alvaro2b`:
  1. Crea el token en https://boardgamegeek.com/applications (botón *Tokens* de la aplicación).
  2. Añádelo a `.claude/settings.local.json` como `BGG_TOKEN`, para el desarrollo local.
  3. Añádelo a Vercel, marcado como sensible: `vercel env add BGG_TOKEN production --sensitive`.
  4. **Vuelve a desplegar** (*Redeploy* del último despliegue de Production). Un despliegue ya hecho no ve las variables nuevas.
  5. Comprueba que en *Juegos → Añadir* aparece "Buscar en BoardGameGeek".
- [ ] **Invitar a los Members**: *Más → Admin: accesos → Autorizar un email*, y después el botón *WhatsApp* para mandarle el enlace. La aplicación no envía ningún email ([ADR 0005](./adr/0005-google-sign-in-with-allowlist.md)). Si esa persona ya jugaba como invitado, elígelo en "¿Ya jugaba como invitado?" para que conserve su historial.

## Opcionales

- [ ] **Aviso "Leaked Password Protection"** del advisor de Supabase: no aplica, porque no hay login con contraseña. Si quieres silenciarlo, actívalo en *Authentication* si tu plan lo permite.

## Recurrentes

- **Cada 90 días:** renueva `SUPABASE_ACCESS_TOKEN` y `VERCEL_TOKEN` en `.claude/settings.local.json`.
- **Si cambias la contraseña de la base de datos:** actualiza `SUPABASE_DB_PASSWORD` en `.claude/settings.local.json`.
- **Si llega un email de Supabase avisando de una pausa:** el keep-alive no funciona. Avisa al agente.

## Hechas

- [x] Desactivar el proveedor de email en Supabase (2026-10-20).
- [x] Confirmar el login con Google en producción (2026-10-20).
- [x] Descargar el logo oficial "Powered by BGG" (2026-10-20).
