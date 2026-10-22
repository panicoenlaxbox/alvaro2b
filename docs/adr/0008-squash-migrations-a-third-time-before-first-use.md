# Tercer colapso de las migraciones antes del primer uso

Las cuatro migraciones posteriores a la base (`20261022120000_member_last_seen.sql`, `20261022130000_audit_log.sql`, `20261022150000_set_expansion_owners.sql` y `20261022160000_atomic_saves.sql`) se integran en `20261020000000_baseline.sql` y vuelve a quedar una sola migración. Sustituye a la [ADR 0007](./0007-squash-migrations-again-before-first-use.md), que prometía que desde allí cada cambio iría en una migración nueva aunque producción siguiera vacía. Esa promesa no se cumplió: producción sigue sin usarse (solo hay dos Players con su email en la allowlist; ningún Game, Session, Play ni Audit entry) y tener el esquema en un solo fichero sigue siendo más fácil de leer.

## Consecuencias

- La regla de no editar migraciones aplicadas sigue en pie, pero no se vuelve a prometer que este sea el último colapso. Si se repite, debe ser con producción igual de vacía y con una ADR nueva.
- Las cuatro migraciones solo creaban objetos nuevos, así que cada bloque se copió tal cual en la sección de la base a la que pertenece, y el Audit log tiene sección propia antes de Storage. El volcado de `public` y `private` es idéntico al que dejaban las cinco migraciones, los tipos generados no cambian y pasan todos los tests de pgTAP.
- El historial de migraciones de producción se reescribió con `supabase migration repair`: las cuatro constan como revertidas y la base sigue aplicada. El esquema real no se tocó.
