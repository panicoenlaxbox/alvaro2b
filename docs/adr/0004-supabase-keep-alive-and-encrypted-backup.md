# Keep-alive de Supabase y backup cifrado en un repositorio público

El plan gratuito de Supabase pausa el proyecto tras una semana sin actividad, no se reactiva solo (hay que restaurarlo a mano desde el panel) y no incluye backups. Como el grupo puede pasar semanas sin quedar, un cron diario de Vercel llama a un endpoint que hace una consulta real a la base de datos. Además, un workflow semanal de GitHub Actions ejecuta `supabase db dump`, lo cifra con `age` y lo guarda como artefacto. El cifrado es obligatorio porque el repositorio es público y los artefactos son descargables.

## Consideradas

- **Aceptar la pausa**: descartado. La aplicación estaría caída justo cuando alguien fuera a abrir un Poll.
- **Plan Pro de Supabase (~25 $/mes)**: descartado por coste.
- **Keep-alive con GitHub Actions**: descartado. GitHub desactiva los workflows programados si el repositorio pasa 60 días sin actividad, justo cuando el keep-alive es más necesario. El cron de Vercel no tiene ese problema.
- **Dump sin cifrar en un repositorio privado**: descartado porque el repositorio es público.

## Consecuencias

- Las claves del dump (conexión a la base de datos y clave pública de `age`) van en los Secrets de GitHub. La clave privada de `age` se guarda fuera del repositorio.
- El backup no incluye las Photos. El Admin tiene además una exportación manual en JSON y una descarga aparte de las Photos.
- El workflow semanal de backup sí vive en GitHub Actions, así que se desactiva tras 60 días sin actividad en el repositorio. GitHub avisa por email antes, y basta con reactivarlo. Perder un backup es menos grave que una pausa.
- Supabase avisa por email una semana antes de pausar. Si llega ese aviso, el keep-alive no está funcionando.
