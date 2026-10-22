> Sustituido por [0007](./0007-squash-migrations-again-before-first-use.md).

# Colapso de las migraciones antes del primer uso

Las 23 migraciones de la construcción inicial se sustituyen por una sola, `20261020000000_baseline.sql`, con el esquema final. Muchas creaban cosas que otras borraban después (el estado de las Sessions, los RSVP, los Vetoes, el Owner único), y había que leerlas todas para entender el esquema. Se hace una única vez, con producción todavía vacía.

## Consideradas

- **Dejarlas como estaban**: descartado. El historial no aportaba nada que valga la pena conservar, y con producción vacía colapsar no arriesga datos.
- **`supabase migration squash`**: descartado. Genera el fichero con un volcado del esquema, sin los comentarios que explican cada regla, y no recoge bien lo que vive fuera de `public` (buckets y políticas de `storage`, el trigger sobre `auth.users`).

## Consecuencias

- La regla de no editar migraciones aplicadas sigue en pie. Esta es la única excepción, y desde aquí cada cambio va en una migración nueva.
- La migración base se escribió a mano. Se comprobó que el esquema que deja es el mismo que dejaban las 23: los dos volcados de `public` y `private` coinciden, igual que los buckets, las políticas de `storage` y los tipos generados. Además pasan todos los tests de pgTAP.
  - La única diferencia es que `service_role` ya no tiene `GRANT ALL` sobre `private.delete_member` y `private.set_member_active`. Era un resto de cuando esas funciones estaban en `public`.
- El historial de migraciones de producción y de cada base local se reescribió con `supabase migration repair`: las 23 constan como revertidas y la base como aplicada. El esquema real no se tocó.
