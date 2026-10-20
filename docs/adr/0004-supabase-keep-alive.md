# Keep-alive de Supabase

El plan gratuito de Supabase pausa el proyecto tras una semana sin actividad, y no se reactiva solo: hay que restaurarlo a mano desde el panel. Como el grupo puede pasar semanas sin quedar, un cron diario de Vercel llama a un endpoint que hace una consulta real a la base de datos.

## Consideradas

- **Aceptar la pausa**: descartado. La aplicación estaría caída justo cuando alguien fuera a abrir un Poll.
- **Plan Pro de Supabase (~25 $/mes)**: descartado por coste.
- **Keep-alive con GitHub Actions**: descartado. GitHub desactiva los workflows programados si el repositorio pasa 60 días sin actividad, justo cuando el keep-alive es más necesario. El cron de Vercel no tiene ese problema.

## Consecuencias

- Supabase avisa por email una semana antes de pausar. Si llega ese aviso, el keep-alive no está funcionando.
