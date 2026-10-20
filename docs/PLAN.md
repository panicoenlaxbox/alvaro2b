# Plan de construcción

> **Histórico.** Plan de la construcción inicial, completado el 2026-10-20. No se actualiza: los cambios posteriores siguen el flujo de [`CLAUDE.md`](../CLAUDE.md) (sección *Changing the app*) y quedan registrados en las PR.

Fue la fuente de verdad del trabajo del agente durante la construcción. Cada hito era pequeño y verificable, y se marcaba al quedar en producción. Alcance: todo el [PRD](./PRD.md).

## Flujo de cada hito

1. Rama `feat/<hito>` desde `main`.
2. Tests de la lógica de dominio (Vitest, `pnpm test`, en `src/lib/domain/`, sin dependencias de Supabase) y de reglas de base de datos (pgTAP, `pnpm test:db`). CI los ejecuta en cada PR.
3. Migraciones versionadas en `supabase/migrations/`, con RLS y `GRANT` explícitos, probadas con `pnpm supabase db reset` en local.
4. Verificación en Chrome contra `http://localhost:3000` con datos ficticios (`supabase/seed.sql`).
5. PR, revisión propia, `pnpm supabase db push` a producción **antes** de integrar (las migraciones son aditivas), `get_advisors` y corrección de avisos, integración en `main`.
6. Prueba de humo en `https://alvaro2b.vercel.app` sin dejar datos.

## Hitos

- [x] **1. Base**: Next.js + pnpm + Supabase CLI, `.gitattributes`, `.env.example`, PWA, login con Google, lista de emails autorizados con el primer Admin desde `ADMIN_EMAIL`, `/privacy`, proyecto Vercel conectado a GitHub sin previews, variables de Production, cron diario de keep-alive, registro por email desactivado en Supabase, comprobación de producción.
- [x] **2. Backup semanal cifrado**: workflow de GitHub Actions con `supabase db dump` + `age` (ADR 0004) y sus Secrets.
- [x] **3. Members y Admin**: gestión de la lista de autorizados, Members, Guests (alta, conversión a Member conservando historial).
- [x] **4. Catalog**: Games, Expansions, Owner, Retired game, borrado solo sin Plays, carátula propia (Storage), Ratings con media y desglose.
- [x] **5. Sessions**: ciclo de vida (planificada, celebrada, cancelada, pendiente de cerrar), Attendees, RSVP, compartir por WhatsApp.
- [x] **6. Plays**: Participants, Expansions usadas, cronómetro, tres Play modes (Ranking desde Score con empates y "menor es mejor", cooperativo, por equipos).
- [x] **7. Exploración del Catalog**: filtros (jugadores, duración, complejidad, Play mode, Owner, no jugado desde, nunca jugado, Rating medio, "a mí me gusta"), ordenación, "sorpréndeme", filtros desde una Session planificada. Va después de Plays porque varios filtros dependen del historial.
- [x] **8. Polls**: Candidates, Suggestions, Approvals, Veto opcional, cierre por fecha o manual, desempate del creador, resultado.
- [x] **9. Photos**: bucket privado, compresión en el navegador y miniatura, Album y Session, etiquetado de Players y Play, URLs firmadas.
- [x] **10. Estadísticas**: grupo, Player y Game, filtrables por fechas.
- [x] **11. Exportación**: JSON para el Admin y descarga aparte de Photos.
- [x] **12. BGG**: búsqueda e importación, bloque BGG info con caché de 7 días, "Powered by BGG"; se activa sola cuando existe `BGG_TOKEN`.
- [x] **13. Cierre**: repaso del PRD, advisors limpios, README actualizado, resumen de pendientes del propietario.

## Decisiones de implementación

- **Next.js 16** (App Router, `src/`), Tailwind 4. La protección de rutas está en `src/proxy.ts` (el antiguo `middleware`).
- **Lista de autorizados en dos capas**: un trigger en `auth.users` rechaza el alta de cualquier email que no esté en `allowed_emails`, y todas las políticas RLS dependen de `is_member()`, no solo de `auth.uid()`.
- **Primer Admin**: `scripts/bootstrap-admin.mjs` lee `ADMIN_EMAIL` del entorno y lo inserta en `allowed_emails` como Admin. El email nunca está en el repositorio.
- **Sin `service_role` en Vercel**: todo pasa por RLS con la sesión del Member. El keep-alive actualiza con la clave pública la única fila de `keep_alive`, que no contiene datos del grupo.
- **Login de desarrollo solo en local**: en local, el proveedor de email sigue activo para entrar como Members ficticios del seed (Chrome automatizado no puede usar varias cuentas de Google). La ruta solo existe si `NODE_ENV !== 'production'` y Supabase apunta a `127.0.0.1`. En producción, el registro por email está desactivado.
- **Vocabulario de la interfaz**: el código usa los términos del glosario en inglés; la interfaz, siempre la misma traducción: Session → sesión, Play → partida, Game → juego, Expansion → expansión, Catalog → catálogo, Owner → dueño, Retired game → juego retirado, Rating → valoración (estrellas), Score → puntuación, Ranking → clasificación, Team → equipo, Play mode → modo (competitivo, cooperativo, por equipos), Member → miembro, Guest → invitado, Player → jugador, Admin → Admin, Attendee → asistente, Participant → participante, RSVP → "¿vienes?", Poll → votación, Candidate → candidato, Suggestion → sugerencia, Approval → "me apetece", Veto → veto, Photo → foto, Album → álbum.
- **Ranking guardado**: al guardar una Play se calcula el Ranking (`src/lib/domain/play.ts`) con el "menor es mejor" del Game en ese momento y se guarda en `participants.rank`. Si después cambia esa opción del Game, las Plays antiguas no se recalculan: es una foto del resultado.
- **Escritura atómica de Plays**: `public.save_play(jsonb)` (`security invoker`, así que aplica RLS) escribe la Play, sus Participants, Teams y Expansions en una transacción.

## Registro

- 2026-10-20: plan inicial.
- 2026-10-20: hito 1 en producción (PR #1). Keep-alive comprobado con `vercel crons run`. El registro por email lo desactivó el propietario: el token del agente no puede cambiar la configuración de Auth.
- 2026-10-20: hito 2. Secrets `SUPABASE_DB_URL` (pooler en modo sesión) y `AGE_RECIPIENT` en GitHub. Dump probado en local.
- 2026-10-20: hito 3. Tests de base de datos con pgTAP en `supabase/tests/` (`pnpm test:db`). Solo el Admin ve los emails autorizados.
- 2026-10-20: hito 4. Migración `strict_default_privileges`: las tablas nuevas no reciben permisos por defecto ni en local ni en producción, así local no oculta GRANTs olvidados (se detectó uno en el upsert de Ratings). CI en `.github/workflows/ci.yml`.
- 2026-10-20: hito 5. El estado de la Session lo gobierna un trigger (`private.session_lifecycle`), con "hoy" en `Europe/Madrid`. "Pendiente de cerrar" se calcula en `src/lib/domain/session.ts`. El recuento de Plays se completa en el hito 6.
- 2026-10-20: hito 6. Cronómetro: "Empezar" guarda la Play con `started_at`; "Terminar" fija `ended_at` y la duración, y lleva a editar el resultado. Las server actions ya no reciben redirecciones del proxy si caduca la sesión. Aviso "Leaked Password Protection" aceptado: no hay contraseñas (ver SETUP).
- 2026-10-20: hito 7. Sin migración: filtros, ordenación y "sorpréndeme" en `src/lib/domain/explore.ts`, sobre los datos del Catalog con su historial. Con `?session=` los filtros parten de los asistentes.
- 2026-10-20: hito 8. Un Poll por Session planificada. Votar, vetar y proponer solo mientras está abierto (RLS con `private.poll_is_open`). Resultado y desempate en `src/lib/domain/poll.ts`. La fecha límite se escribe en hora de Madrid.
- 2026-10-20: hito 9. Photos comprimidas en el navegador a WebP (lado largo 2000 px, objetivo 500 KB) más miniatura de 400 px, en `media/photos/`. Borrar una Photo borra sus ficheros. Borrar una Play solo quita su etiqueta de las Photos.
- 2026-10-20: hito 10. Sin migración: se carga el historial completo y se calcula en `src/lib/domain/stats.ts`. Las victorias cuentan todos los modos (puesto 1, equipo ganador o el grupo en cooperativo); el porcentaje y la némesis, solo competitivo. "La vergüenza de la estantería" no depende del rango de fechas.
- 2026-10-20: hito 11. `/api/export` (solo Admin) devuelve todas las tablas en JSON, paginando de 1000 en 1000 y con RLS. Las fotos se descargan en ZIP de 100 en 100, generados en el navegador con `fflate` a partir de URLs firmadas.
- 2026-10-20: hito 12. `src/lib/bgg/`: parseo del XML con tests y cliente de servidor con `fetch` en caché 7 días (`next.revalidate`). Sin `BGG_TOKEN` no aparece nada de BGG; si BGG falla, aviso y alta manual. Importa solo nuestros campos; el modo se deduce de las mecánicas (cooperativo, por equipos).
- 2026-10-20: hito 13. Repaso del PRD completo. Producción: 9 migraciones aplicadas y sincronizadas con local, advisors de seguridad limpios salvo el aviso aceptado de contraseñas filtradas, y en rendimiento solo "índice sin usar" (índices de claves foráneas, normal con la base casi vacía). Prueba de humo sin dejar datos: rutas públicas y PWA responden, `/dev-login` da 404, keep-alive y API protegidos. Lo pendiente del propietario está en `SETUP.md`.
