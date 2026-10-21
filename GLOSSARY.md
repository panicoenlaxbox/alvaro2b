# Glosario

Vocabulario del dominio de una aplicación para que un grupo de amigos organice sus quedadas de juegos de mesa: qué tienen, a qué juegan, quién gana y qué recuerdos guardan.

## Personas

**Member**:
Persona del grupo con cuenta propia en la aplicación. Un Member *desactivado* no puede entrar ni aparece al elegir jugadores, pero conserva su historial.
_Evitar_: usuario, socio, amigo

**Guest**:
Persona sin cuenta que ha participado en alguna Session; puede convertirse en Member conservando su historial. Un Guest *desactivado* no aparece al elegir jugadores, pero conserva su historial.
_Evitar_: invitado anónimo, jugador externo

**Player**:
Cualquier persona que puede participar en una Play, sea Member o Guest.
_Evitar_: jugador (como sinónimo de Member)

**Admin**:
Member que gestiona quién forma parte del grupo.
_Evitar_: moderador, propietario del grupo

## Quedadas y partidas

**Session**:
Una quedada del grupo en una fecha concreta, en la que se juegan cero o más Plays.
_Evitar_: quedada, evento, partida, noche de juegos

**Upcoming / past Session**:
Una Session es *próxima* si su fecha es hoy o futura y *pasada* si es anterior. Se deduce de la fecha: una Session no tiene estado.
_Evitar_: planificada, celebrada, cancelada, estado

**Attendee**:
Player que asiste o ha confirmado que asistirá a una Session.
_Evitar_: asistente confirmado, participante (reservado para Play)

**RSVP**:
Respuesta de un Member sobre si asistirá a una Session próxima.
_Evitar_: confirmación, inscripción

**Play**:
Una partida concreta de un Game dentro de una Session, con sus Participants, duración, resultado y notas.
_Evitar_: partida (en código), juego, ronda, match

**Participant**:
Player que toma parte en una Play.
_Evitar_: jugador de la partida, Attendee

**Play mode**:
Forma de ganar en una Play: *competitivo* (ranking individual), *cooperativo* (el grupo gana o pierde junto, sin posiciones) o *por equipos* (gana un Team). Cada Game tiene un modo por defecto que una Play puede cambiar.
_Evitar_: tipo de juego, modalidad

**Team**:
Conjunto de Participants que ganan o pierden juntos en una Play por equipos.
_Evitar_: bando, grupo

**Ranking**:
Orden final de los Participants en una Play competitiva; admite empates. No existe en Plays cooperativas.
_Evitar_: clasificación, posiciones

**Score**:
Puntuación opcional de un Participant en una Play competitiva.
_Evitar_: puntos, resultado

## Catálogo

**Game**:
Juego de mesa base del que el grupo tiene o ha tenido un ejemplar, o al que ha jugado alguna vez.
_Evitar_: juego (para expansiones), título, ficha

**Expansion**:
Ampliación de un Game base; se registra qué Expansions se usaron en cada Play.
_Evitar_: ampliación, add-on, DLC

**Catalog**:
Conjunto de Games y Expansions del grupo.
_Evitar_: colección, ludoteca, estantería

**Owner**:
Member al que pertenece el ejemplar de un Game o de una Expansion. Es opcional y puede haber varios, si se compró entre varios.
_Evitar_: dueño, propietario del juego

**Retired game**:
Game que el grupo ya no tiene; conserva su historial pero no aparece al elegir a qué jugar.
_Evitar_: juego borrado, juego archivado

**Rating**:
Valoración subjetiva de 1 a 5 estrellas que un Member da a un Game.
_Evitar_: nota, puntuación (reservado para Score), like

**BGG info**:
Información sobre un Game que se consulta en BoardGameGeek y se muestra tal cual, sin formar parte de los datos del grupo.
_Evitar_: ficha BGG, datos importados

## Votación

**Poll**:
Votación orientativa, asociada a una Session próxima, para decidir a qué Games jugar.
_Evitar_: encuesta, votación vinculante

**Candidate**:
Game propuesto por un Member como opción en un Poll.
_Evitar_: opción, propuesta

**Suggestion**:
Game del Catalog que la aplicación recomienda proponer en un Poll; solo es Candidate si un Member lo añade.
_Evitar_: candidato automático

**Approval**:
Voto de un Member a favor de un Candidate; cada Member puede aprobar varios.
_Evitar_: voto único, like

**Veto**:
Rechazo de un Member a un Candidate, si el Poll lo permite.
_Evitar_: voto negativo, bloqueo

## Recuerdos

**Photo**:
Imagen del grupo, asociada a una Session o al Album general, en la que pueden etiquetarse Players y una Play.
_Evitar_: imagen, foto (en código)

**Album**:
Colección general de Photos que no pertenecen a ninguna Session.
_Evitar_: galería, carpeta
