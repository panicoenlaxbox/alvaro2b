# Next.js + Supabase + Vercel Hobby, a coste cero

La aplicación es una PWA en Next.js (TypeScript) desplegada en Vercel Hobby, con Supabase como base de datos (Postgres), autenticación y almacenamiento de Photos. Lo elegimos porque cubre todo lo necesario con un solo proveedor gestionado y cuesta cero en los planes gratuitos, que es un requisito para un proyecto personal no comercial.

## Entornos

Solo hay dos entornos:

- **Local**: Supabase en Docker, con datos ficticios. Aquí se prueba todo antes de integrar en `main`.
- **Producción**: el proyecto Supabase `alvaro2b` y el despliegue de producción de Vercel, que se hace desde `main`.

No hay staging ni previews de Vercel. Una preview solo podría usar la base de datos de producción, con migraciones aún sin aplicar y con el riesgo de escribir datos reales. El entorno local hace el papel de staging.

## Consecuencias

- Vercel Hobby solo admite uso personal no comercial: nada de anuncios ni cobros.
- Límites del plan gratuito de Supabase que condicionan el diseño: 500 MB de base de datos, 1 GB de almacenamiento y sin transformación de imágenes. Por eso las Photos se comprimen en el navegador antes de subirlas.
- Supabase pausa el proyecto tras una semana sin actividad (ver [0004](./0004-supabase-keep-alive.md)).
- Toda la seguridad de los datos descansa en RLS, porque la clave `anon` es pública.
