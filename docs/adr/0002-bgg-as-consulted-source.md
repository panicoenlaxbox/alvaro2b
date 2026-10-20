# BoardGameGeek como fuente consultada, no replicada

BGG es una integración opcional: la aplicación funciona por completo sin ella, dando de alta los Games a mano. Cuando está disponible, al dar de alta un Game se pueden importar solo nuestros campos propios (jugadores, duración, complejidad…), que después son editables. El resto se muestra en un bloque "BGG info" que se consulta desde el servidor y se guarda en caché, sin copiarlo a nuestros datos. No queremos mantener una réplica de BGG, y sus condiciones de uso prohíben modificar sus datos y desaconsejan el uso intensivo de la API.

## Consideradas

- **Replicar la ficha completa**: descartado. Duplica datos que no gestionamos y choca con las condiciones de uso.
- **Solo un enlace a BGG**: descartado. Pierde la importación, que es la que da calidad a los filtros del Catalog.

## Consecuencias

- La API XML2 exige registrar la aplicación y usar un token, que solo se usa en el servidor. La aprobación puede tardar semanas.
- Hay que mostrar el logo "Powered by BGG" con enlace y citar a BoardGameGeek.
- Las carátulas se enlazan a la URL de BGG y no se copian, porque re-alojarlas no está claramente permitido. Se puede subir una imagen propia que sustituya a la de BGG.
