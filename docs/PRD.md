# PRD: gestor de quedadas de juegos de mesa

## Visión

Somos un grupo de amigos que queda de vez en cuando para jugar a juegos de mesa. Siempre nos cuesta decidir a qué jugar, y después no queda registro de lo que hemos jugado. Esta aplicación web privada sirve para:

- explorar nuestro Catalog para elegir juego;
- abrir un Poll días antes de la quedada;
- registrar cada Session y sus Plays: quién jugó, quién ganó, cuánto duró y notas;
- guardar Photos del grupo;
- consultar el historial y las estadísticas.

El vocabulario está definido en [`GLOSSARY.md`](../GLOSSARY.md) y las decisiones de arquitectura en [`docs/adr/`](./adr/).

## Principios

- **Un único grupo privado.** No es un producto multi-grupo. Toda la aplicación exige login. La única excepción es la página pública de privacidad (`/privacy`), que Google exige para el login con Google. Explica qué datos se guardan y para qué.
- **Primero el móvil.** Gran parte del uso es en mitad de la quedada: PWA instalable.
- **Coste cero.** Planes gratuitos de Vercel y Supabase (ver [ADR 0001](./adr/0001-nextjs-supabase-vercel-zero-cost.md)).
- **BGG es opcional.** La aplicación funciona por completo sin BoardGameGeek (ver [ADR 0002](./adr/0002-bgg-as-consulted-source.md)).
- **Interfaz solo en español**, sin capa de i18n.
- **Registrar debe ser rápido.** Los campos son opcionales siempre que se pueda.

## Alcance

Este documento describe lo que hace la aplicación hoy. Todas sus funcionalidades están en producción, y se actualiza en la misma PR que cualquier cambio de comportamiento.

**Fuera de alcance:** notificaciones (push o email), rating de nivel tipo ELO, varios grupos, traducciones y páginas públicas.

## Personas y permisos

- **Member**: persona con cuenta.
  - Inicia sesión solo con Google, y únicamente si su email está en la lista de autorizados que gestiona el Admin (ver [ADR 0005](./adr/0005-google-sign-in-with-allowlist.md)).
  - No hay registro público y la aplicación no envía emails: el Admin pasa el enlace por WhatsApp.
  - El email del primer Admin se configura como variable de entorno, nunca en el repositorio.
- **Admin**: un Member que gestiona las invitaciones, los Members y los Guests, todo desde la pantalla Admin.
  - Es el único que añade Guests y cambia el nombre de cualquier jugador.
  - Puede desactivar a un Guest: deja de aparecer al elegir jugadores, conserva su historial y se puede reactivar. Solo puede eliminar a un Guest sin historial.
  - Puede revocar una invitación que aún no se ha usado.
  - Puede desactivar a un Member: deja de poder entrar y de aparecer al elegir jugadores, conserva su historial y se puede reactivar.
  - Puede eliminar a un Member sin historial (no ha jugado, asistido ni creado nada), junto con su cuenta.
  - No puede hacerlo consigo mismo ni con otro Admin: antes hay que quitarle el rol.
- **Guest**: persona sin cuenta que participa en Sessions y Plays.
  - No vota en los Polls ni da Ratings.
  - Puede convertirse en Member enlazando una cuenta, y conserva su historial.
- **Permisos**:
  - Cualquier Member puede crear y editar todo: Sessions, Plays, Games, Polls y Photos.
  - Solo el autor o el Admin pueden eliminar.

## Funcionalidades

### 1. Catalog

- **Game**. Campos propios, todos editables:
  - nombre, año;
  - mínimo y máximo de jugadores, duración mínima y máxima;
  - complejidad (1–5);
  - Play mode por defecto;
  - "puntuación menor es mejor";
  - página en BGG (opcional): se pega la dirección de la ficha y se guarda su id;
  - Owners (opcional): uno o varios, porque a veces un Game se compra entre varios;
  - notas.
- **Juegos sin Owner.** Se puede registrar un Game sin Owner, por ejemplo uno prestado o jugado en un bar.
- **Expansion**. Va vinculada a su Game base y, como el Game, puede tener uno o varios Owners. No cambia los filtros de jugadores ni de duración.
- **Retired game**.
  - Un Game que ya no tenemos se retira: desaparece de la exploración y de las Suggestions, pero conserva su historial.
  - Solo se puede eliminar un Game que no tenga Plays.
- **Carátula**. La imagen enlazada de BGG, o una imagen propia subida por nosotros que la sustituye.
- **Ficheros y enlaces**. Cualquier Member puede adjuntar a un Game ficheros (un FAQ en PDF, una ayuda de juego: PDF, imagen, texto o documento, hasta 20 MB) y enlaces (una herramienta online), sin descripción. Solo el autor o el Admin pueden eliminarlos.
- **Rating**.
  - Cada Member puede dar de 1 a 5 estrellas a cada Game y cambiarlas cuando quiera.
  - Se muestra la media y el desglose por Member ("Juanito ★★★").

### 2. Integración con BGG (opcional)

- Al dar de alta un Game, se puede buscar en BGG e importar solo nuestros campos propios.
- La ficha del Game tiene un bloque **BGG info**:
  - consultado desde el servidor y guardado en caché unos 7 días;
  - muestra la descripción, la valoración, la mejor cantidad de jugadores y las mecánicas;
  - enlaza a la página del juego en BGG;
  - no se guarda como dato propio.
- Se muestra el logo "Powered by BGG" con enlace a BGG.
- Si no hay token o BGG falla, la aplicación funciona igual, con alta manual.

### 3. Exploración del Catalog

- **Filtros**:
  - número de jugadores y duración;
  - complejidad y Play mode;
  - Owner;
  - "no jugado desde hace X" y "nunca jugado";
  - Rating medio ≥ X y "a mí me gusta".
- **Ordenación**, entre otros criterios, por Rating.
- **"¿A qué jugamos hoy?" en Inicio**: tres preguntas rápidas (cuántos somos, cuánto tiempo tenemos, cooperativo o competitivo) y el botón **"¡Tira el dado!"**, que elige al azar un Game de los que encajan, con unos segundos de suspense en los que van pasando nombres y frases. El resultado sale en la misma Inicio. El Catalog no tiene dado.
- **Con una Session planificada**: los filtros pueden partir de sus Attendees, por ejemplo "juegos para 5" o "juegos con algún Owner que viene".

### 4. Sessions

- **Datos**: fecha, nombre (opcional, por ejemplo "Sábado de mazmorreo", se muestra junto a la fecha), lugar (opcional), Attendees, notas y Photos.
- **Ciclo de vida**:
  - Con fecha pasada, la Session nace **celebrada**: se está registrando algo que ya ocurrió.
  - Con fecha de hoy o futura, nace **planificada**. Es un paso opcional: muchas veces quedamos y se registra todo directamente, y la primera Play la pasa a celebrada.
  - De planificada se pasa a celebrada a mano ("¡Empezamos!") o al registrar la primera Play.
  - Una planificada puede **cancelarse**. Una celebrada no.
  - Si una planificada queda en el pasado sin Plays, aparece como **pendiente de cerrar** para que alguien la registre o la cancele. No se elimina sola.
- **RSVP**. En una planificada, los Members confirman si asistirán.
- **Compartir**. Un botón "Compartir por WhatsApp" genera el enlace de la Session o de su Poll.
- **Listado**. Primero las pendientes de cerrar, luego las próximas y después las celebradas, de la más reciente a la más antigua y de 10 en 10. Las canceladas van plegadas al final.

### 5. Plays

- **Participants**. Se preseleccionan con los Attendees de la Session y son editables. Si se añade a alguien que no estaba en la Session, también se añade a ella.
- **¿Quién empieza?** Al registrar una Play con dos o más Participants, un botón sortea quién empieza, con unos segundos de suspense. Es solo una ayuda en la mesa: no se guarda.
- **Game y Expansions** usadas.
- **Duración**. Se puede medir con el cronómetro de la aplicación (iniciar y terminar) o introducirla a mano. Siempre se puede corregir.
- **Notas**.
- **Resultado según el Play mode** (por defecto el del Game, pero se puede cambiar en la Play; ver [ADR 0003](./adr/0003-three-play-modes.md)):
  - **Competitivo**:
    - Score opcional por Participant.
    - El Ranking se calcula a partir del Score si lo hay (con el sentido "menor es mejor" del Game); si no, se marca a mano.
    - Se permiten empates.
  - **Cooperativo**: solo se registra si el grupo ganó o perdió. No hay posiciones.
  - **Por equipos**: cada Participant pertenece a un Team y se marca el Team ganador.
- **Varias Plays por Session.** Una Session puede tener varias Plays, también del mismo Game.

### 6. Polls

- **Asociación**. Un Poll pertenece siempre a una Session planificada.
- **Candidates**.
  - Cualquier Member puede añadir Candidates mientras el Poll está abierto.
  - La aplicación muestra Suggestions del Catalog, filtradas por número de Attendees, duración y Rating. Una Suggestion solo pasa a ser Candidate si un Member la añade.
- **Votación por aprobación**.
  - Cada Member marca todos los Candidates que le apetecen.
  - El Veto (uno por Member) es opcional y se configura en cada Poll.
  - Los Guests no votan.
- **Cierre**. El Poll se cierra en la fecha límite o a mano por su creador. El creador decide los empates.
- **Resultado**.
  - Es un ranking orientativo y no vinculante. Puede haber varios "ganadores", porque en una tarde se juega a varias cosas.
  - Las Plays no tienen que coincidir con el resultado.

### 7. Photos

- **Ubicación**. Una Photo se asocia a una Session o al Album general.
- **Compresión**. Las Photos se comprimen en el navegador antes de subirlas (lado largo de unos 2000 px, en WebP o JPEG, unos 300–500 KB) y se genera una miniatura para la galería. No se guardan los originales.
- **Etiquetado** opcional de los Players que aparecen y de la Play.
- **Galería**. Una sola página con todas las Photos: primero las del Album, donde se suben, y después las de cada Session, de la más reciente a la más antigua, con su fecha enlazada a la Session. En cada Photo, el pie va escrito a mano en el margen de la Polaroid, junto a los avatares de quienes salen.
- **Acceso** solo para Members, mediante URLs firmadas.

### 8. Estadísticas

Todas son filtrables por año o rango de fechas. En los rankings, los Players llevan su avatar, y el número de Plays o Sessions lleva a ellas: directamente si es una, o desplegando la lista con sus fechas si son varias.

- **Grupo**:
  - Sessions y Plays totales, y horas jugadas.
  - Games más jugados.
  - Games del Catalog nunca jugados ("la vergüenza de la estantería").
  - Asistencia por Member.
- **Player**:
  - Plays y victorias.
  - Porcentaje de victorias en Plays competitivas.
  - Game favorito.
  - "Némesis": quién le gana más.
  - Rachas.
- **Game**:
  - Veces jugado y última vez.
  - Duración real media frente a la estimada.
  - Quién gana más.
  - Porcentaje de victorias del grupo en cooperativo.

## Requisitos no funcionales

- **PWA instalable**, con diseño pensado primero para móvil.
- **Seguridad**:
  - RLS en todas las tablas.
  - Ningún secreto en el repositorio, que es público y con licencia MIT.
  - Solo datos ficticios en seeds, tests y documentos.
- **Entornos**:
  - Local: Supabase en Docker, con datos ficticios.
  - Producción: `alvaro2b.vercel.app` con el proyecto Supabase `alvaro2b`.
  - No hay staging ni previews de Vercel (ver [ADR 0001](./adr/0001-nextjs-supabase-vercel-zero-cost.md)).
- **Keep-alive**. Un cron diario de Vercel hace una consulta real a la base de datos para que Supabase no pause el proyecto.
- **Presupuesto de almacenamiento**. Supabase gratis ofrece 1 GB, que equivale a unas 2000–3000 Photos comprimidas.

## Datos de contexto que condicionan el diseño (comprobados en octubre de 2026)

- **API XML2 de BGG**:
  - Requiere registrar la aplicación y usar un token Bearer.
  - La licencia es gratuita para uso no comercial.
  - Obliga a mostrar el logo "Powered by BGG", prohíbe modificar los datos y recomienda llamar desde el servidor con caché.
- **Supabase gratis**:
  - Pausa el proyecto tras una semana sin actividad y no se reactiva solo.
  - El plazo para restaurar un proyecto pausado es de 1 año según la documentación actual, pero hay que contar con 90 días por prudencia.
- **Vercel Hobby**:
  - Solo para uso no comercial.
  - Los cron se ejecutan como mucho una vez al día, con una precisión de ±1 hora.

## Pendiente

La configuración del propietario (cuentas, tokens, OAuth de Google) está en [`SETUP.md`](./SETUP.md), y lo que aún le queda por hacer, en [`TASKS.md`](./TASKS.md).
