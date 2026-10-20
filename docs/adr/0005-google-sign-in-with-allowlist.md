# Login solo con Google y lista de emails autorizados

Los Members inician sesión exclusivamente con su cuenta de Google. El Admin añade a la lista de autorizados el email de cada nuevo Member y le pasa el enlace de la aplicación (por WhatsApp). Cualquier cuenta que no esté en la lista se rechaza. Así la aplicación no envía ningún email: el SMTP por defecto de Supabase solo envía a los miembros del equipo de la organización, con un máximo de 2 por hora, y cualquier proveedor de email exige un dominio verificado, lo que rompería el coste cero.

## Consideradas

- **Enlace mágico, o email y contraseña, con Resend**: descartado. Obliga a comprar un dominio y a configurar DNS.
- **Invitaciones por email de Supabase (`inviteUserByEmail`)**: descartado por el mismo motivo.

## Consecuencias

- Todo Member necesita una cuenta de Google.
- Hay un cliente OAuth en Google Cloud con las URLs de callback de local y producción.
- Si algún día se añade un dominio propio, se podría incorporar el enlace mágico sin cambiar el modelo de Members.
