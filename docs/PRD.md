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
  - Cualquier Member puede crear, editar y eliminar todo: Sessions, Plays, Games, Expansions, ficheros, Polls y Photos. También cerrar un Poll, decidir sus empates y quitar Candidates.
  - Solo el Admin gestiona quién entra y los Players (Members y Guests).
  - Lo personal es de cada uno: su Rating, su voto y su respuesta a "¿Vienes?".

## Funcionalidades

### 1. Catalog

- **Game**. Campos propios, todos editables:
  - nombre y año (el año no se muestra en la ficha);
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
  - Un Game que ya no tenemos se retira: desaparece de la exploración y de los Polls, pero conserva su historial.
  - Solo se puede eliminar un Game que no tenga Plays.
- **Carátula**. La imagen enlazada de BGG, o una imagen propia subida por nosotros que la sustituye.
- **Ficheros y enlaces**. Cualquier Member puede adjuntar a un Game ficheros (un FAQ en PDF, una ayuda de juego: PDF, imagen, texto o documento, hasta 20 MB) y enlaces (una herramienta online), sin descripción. Cualquier Member puede eliminarlos.
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

- **Búsqueda**, sobria, con "Buscar" y "Limpiar": nombre, Play mode, Rating medio mínimo (con estrellas) y "Por estrenar".
- **Ordenación** de los resultados, encima de la lista, entre otros criterios por Rating.
- **"¿A qué jugamos hoy?" en Inicio**: tres preguntas rápidas (cuántos somos, cuánto tiempo tenemos, cooperativo o competitivo) y el botón **"¡Tira el dado!"**, que elige al azar un Game de los que encajan, con unos segundos de suspense en los que van pasando nombres y frases. El resultado sale en la misma Inicio, con **"Empezar"**: sin preguntar, usa la Session de hoy (o la crea), apunta al Member y abre el registro de la Play con ese Game elegido. El Catalog no tiene dado.

### 4. Sessions

- **Datos**: fecha, hora (opcional, en formato 24 horas), nombre (opcional, por ejemplo "Sábado de mazmorreo", se muestra junto a la fecha), lugar (opcional), Attendees, notas y Photos.
- **Sin estados**. Una Session no tiene estado: es **próxima** si su fecha es hoy o futura y **pasada** si es anterior. Siempre admite Plays y Photos.
- **Si no se celebra, se elimina.** No hay cancelación.
- **Attendees**. Se eligen al crear o editar la Session. En el detalle solo se ven; quien "quizá" va sale con la cara atenuada; en el selector de Editar lleva un "?".
- **RSVP**. En una próxima, cualquier Member responde "Voy", "Quizá" o "No voy", esté o no entre los Attendees; la respuesta se guarda al momento en la lista de Attendees. Quien juega una Play deja de ser "quizá".
- **Compartir**. Un botón con el logo de WhatsApp, en la cabecera junto a "Editar" y "Eliminar", genera el enlace de la Session o de su Poll.
- **En Inicio**: arriba, un aviso con la próxima Session, si la hay, y abajo la "Última sesión", si la hay.
- **Listado**. Primero las próximas, de la más cercana a la más lejana, y después las pasadas, de la más reciente a la más antigua y de 10 en 10. Cada grupo muestra cuántas tiene y se puede plegar; las pasadas empiezan plegadas. Cada Session muestra cuándo es, dónde y quién va.

### 5. Plays

- **Participants**. Se preseleccionan con los Attendees de la Session y son editables. Si se añade a alguien que no estaba en la Session, también se añade a ella.
- **¿Quién empieza?** Al registrar una Play con dos o más Participants, un botón sortea quién empieza, con unos segundos de suspense. Es solo una ayuda en la mesa: no se guarda.
- **Game y Expansions** usadas.
- **Duración**. Se introduce a mano, en minutos, y siempre se puede corregir.
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

- **Asociación**. Un Poll pertenece siempre a una Session próxima.
- **Candidates**.
  - Cualquier Member puede añadir Candidates mientras el Poll está abierto.
- **Votación por aprobación**.
  - Cada Member marca todos los Candidates que le apetecen.
  - Los Guests no votan.
- **Cierre**. El Poll se cierra en la fecha límite, que no puede pasar del comienzo de la Session, o a mano por cualquier Member, que también decide los empates.
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

Todas son filtrables por año o rango de fechas. En los rankings, el número de Plays o Sessions lleva a ellas: directamente si es una, o desplegando la lista con sus fechas si son varias.

- **Grupo**:
  - Sessions con al menos una Play, Plays totales y horas jugadas.
  - Games más jugados.
  - Games del Catalog nunca jugados ("la vergüenza de la estantería").
  - Asistencia por Member, contando las Sessions con al menos una Play.
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

- **PWA instalable**, con diseño pensado primero para móvil:
  - Ninguna pantalla se desborda a lo ancho y todo lo que se toca mide al menos unos 40 px.
  - En el móvil, los botones de una fila se reparten el ancho.
  - Las acciones que no se deshacen (eliminar, retirar, desactivar…) piden un segundo toque en el mismo botón. Su texto cambia ("Sí, eliminar") sin que se mueva nada, y vuelve a su estado si se toca fuera, se pulsa Escape o pasan 5 segundos.
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
