# Segundo colapso de las migraciones antes del primer uso

La migración `20261022090000_drop_play_timer.sql`, que quitaba el cronómetro de las Plays, se integra en `20261020000000_baseline.sql` y vuelve a quedar una sola migración. Sustituye a la [ADR 0006](./0006-squash-migrations-before-first-use.md), que presentaba aquel colapso como la única excepción a la regla de no editar migraciones aplicadas. Se repite por el mismo motivo: la base creaba dos columnas y una restricción que la migración siguiente borraba. Además, producción sigue sin usarse: no tiene Games, Sessions ni Plays, solo el Admin.

## Consecuencias

- La regla de no editar migraciones aplicadas sigue en pie. Desde aquí cada cambio va en una migración nueva, también mientras producción esté vacía.
- La base se editó a mano, como en la ADR 0006. El volcado de `public` y `private` es idéntico al que dejaban las dos migraciones, los tipos generados no cambian y pasan todos los tests de pgTAP.
  - La restricción de `plays` que limita `coop_won` a las Plays cooperativas se declara con el nombre `plays_check1`, el mismo que tiene en producción. Si no, en una base nueva se llamaría `plays_check`.
- El historial de migraciones de producción se reescribió con `supabase migration repair`: `20261022090000` consta como revertida y la base sigue aplicada. El esquema real no se tocó.
