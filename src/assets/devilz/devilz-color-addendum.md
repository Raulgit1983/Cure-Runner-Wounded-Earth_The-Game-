## Addendum — 2026-08-08: relleno de color

Motivo: los tres Devilz, como línea pura sin relleno, casi no se veían contra
el fondo oscuro del arranque de nivel. Confirmado jugando (Claude Code, sesión
de conexión al registro/selector).

### Qué se hizo

Relleno de color plano **dentro** del contorno exacto de Mateo, por debajo de
su tinta. La tinta —cada trazo, cada temblor, cada asimetría— es un pixel a
pixel idéntica a la que salió del boceto original. No se suavizó, no se
enderezó, no se completó ningún trazo suyo. El color es una capa nueva
debajo; su dibujo no cambió.

Paleta, familia cálida coherente con el resto del proyecto (Chomper, Hell
Man), un tono distinto por personaje para que se distingan también en el
selector, no solo en el nivel:

| Personaje | Color | Hex aprox. |
|---|---|---|
| Devi | rojo-naranja | `#C43E28` |
| Lovu | ámbar | `#E0822A` |
| Divu | vino-magenta | `#963778` |

### La única excepción al "no se toca su trazo"

En el dibujo original, el cuerno derecho de Devi y la unión cuerno-cabeza de
Divu quedan como trazos que no llegan a tocarse — normal en un boceto rápido.
Para poder calcular *dónde* rellenar de color hizo falta, solo en el cálculo
interno, un puente de 2-3 px invisible que nunca se dibuja: sirve para que el
algoritmo sepa "esto es interior", no para alterar la línea final. La tinta
que se ve en pantalla es la suya, sin el puente. En Devi, el cuerno derecho
se dejó sin rellenar a propósito —no está unido al cuerpo en su dibujo, y
rellenar ahí habría sido inventar una unión que él no dibujó.

### Pipeline

`{n}_mask.png` (línea limpia, ya existente) → relleno calculado con la
técnica que cerraba bien cada contorno concreto (Devi/Lovu: flood-fill desde
el exterior; Divu necesitó cierre morfológico + contorno externo, su trazo
deja un hueco real que el método simple no cerraba) → composición: color
abajo, tinta de Mateo arriba, fuera transparente → mismo pipeline de poses
que ya existía (recorte, escala a 512×512, transform anclado a (0.5, 0.58),
squash/stretch/rotate por pose) → 12 webp nuevos, mismos nombres de archivo
que sustituyen a los anteriores.

Contrato de alineación sin cambios: mismo lienzo, mismo ancla, mismos cuatro
nombres de pose por personaje. Nada en `devilzProfiles.ts` ni en el switcher
necesita tocarse por este cambio — es sustitución de textura, no de contrato.

### Verificado

Contra blanco y contra un fondo casi negro (`#0c0c0e`, aproximando el fondo
real reportado). Los tres se leen con claridad en ambos. Pendiente: verlo
contra el fondo *real* del nivel, no una aproximación — confirmarlo la
próxima vez que alguien juegue con un Devilz seleccionado.
