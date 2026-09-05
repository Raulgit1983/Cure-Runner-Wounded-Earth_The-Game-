# Chomper: movimiento y separación v4 candidato · 2026-09-05

## Resultado

Astra continuó sobre `bc8ed3178684dad65952e8dcd57f8f7b0380f036`, rama
`visual/world-01-carlitos-drive`, tras comprobar AGENTS y el árbol limpio.
El commit base ya existía; esta tanda se guarda después como checkpoint Git
local antes de abrir la siguiente tarea.

Raúl aprobó expresamente el acabado de la arena mostrada
(`chomper-arena-v1.webp`). Tras una salida opaca de imagegen, autorizó
«Usa la mejor solución» para el recorte convencional. Se usaron máscaras para
separar los píxeles aprobados; no se reinterpretó la criatura ni se alteraron
los archivos fuente. No hubo Claude, claves API, paquetes, pagos, push o deploy.

La primera animación física fue rechazada por básica, discreta y tiesa. Raúl
pidió entonces una embestida. Sobre el pase intermedio corrigió dos decisiones:
debía morder la cabeza roja superior, abriendo/cerrando sus mandíbulas y negando
antes de atacar; además, la trayectoria no podía caer casi verticalmente sobre
el personaje porque el salto no se leía como una evasión posible.

La v4 responde a esas correcciones y añade una solución de arte para que
Chomper no se empaste con el fondo. Sigue siendo candidata: necesita revisión
física de Raúl/Mateo.

## Movimiento y combate

- `src/game/content/chomperArt.ts`: manifiesto DEV de siete WebP, pivotes y
  bocas. La cabeza roja se divide en mandíbula superior, izquierda, derecha y
  una unión central.
- `src/game/systems/boss/chomperArtPose.ts`: respiración/oscilación corporal y
  anticipación/liberación amplia en los ataques a distancia. Para el mordisco,
  la cabeza roja niega dos veces, abre sus tres mandíbulas, cierra en contacto
  y las vuelve a relajar durante la retirada.
- `src/game/systems/boss/chomperBitePath.ts`: una única curva compartida por
  arte y colisión. Chomper baja por el extremo izquierdo, alcanza el suelo en
  x=82,y=520, barre hasta x=278,y=530, retrocede por x=72,y=558 y vuelve a su
  pose inicial por el lateral. La ventana peligrosa se limita al barrido.
- `src/game/systems/boss/ChomperEncounter.ts`: secuencia de onda baja, descarga
  alta y mordisco rasante. Se comprobó que un salto entre 0 y 350 ms después de
  «¡Ahora!» evita el mordisco.
- `src/game/scenes/ChomperScene.ts`: aviso visual/sonoro específico, instrucción
  «salta el mordisco», impacto y cruce de profundidad durante el contacto.
- `src/game/services/audio/`: aviso grave de dos golpes para distinguir el
  mordisco de los ataques a distancia.

## Solución de contraste

`ChomperArtRenderer` conserva las piezas y colores aprobados. Detrás de la
silueta compone un claro de bosque con tres luces aditivas suaves. Una segunda
instancia de las mismas piezas, ampliada un 1,8 %, forma un borde frío fino.
El claro y el borde siguen la pose completa y aumentan durante aviso/ataque;
también cruzan de profundidad con Chomper durante el mordisco. No se cargan
texturas adicionales para este tratamiento ni se pinta encima del original.

La intención es separar primero la silueta y luego sus detalles de color, sin
convertirla en un personaje genérico ni borrar la textura hecha a mano. La
intensidad sigue pendiente de valoración en la pantalla física del teléfono.

## Arte y tamaño

| Archivo candidato cargado | Dimensiones | Bytes |
| --- | --- | ---: |
| `empty-plate-v1.webp` | 720×1080 | 86852 |
| `body-v1.webp` | 341×602 | 286886 |
| `red-upper-jaw-v1.webp` | 88×98 | 12182 |
| `red-left-jaw-v1.webp` | 50×77 | 6262 |
| `red-right-jaw-v1.webp` | 78×94 | 9790 |
| `red-hub-v1.webp` | 30×31 | 1594 |
| `gold-head-v1.webp` | 128×168 | 35154 |
| **Total** | | **438720** |

Las piezas usan WebP lossless con alpha real. Los exportadores comprueban que
el RGB visible coincide con la arena aprobada. La recomposición de las cuatro
piezas rojas en reposo es idéntica píxel a píxel al recorte rojo previo.

`rejected-body-fake-alpha.png` conserva una cuadrícula pintada y sigue
rechazado. El antiguo `red-head-v1.webp` se conserva en el laboratorio como
proveniencia, pero la v4 no lo carga. Todo el material de revisión está en
`art-lab/2026-09-05-chomper-rig/`, ignorado por Git.

## Validación

- `npm run check`: PASS.
- `npm test`: **216/216, 19 archivos**, PASS.
- `npm run build`: PASS; sólo la advertencia preexistente del chunk Phaser.
- `git diff --check`: PASS.
- Búsqueda en el build: sin ChomperScene, `bite-lunge`, `chomper-rig` ni sus
  rutas. El jefe continúa fuera de producción.
- `qa-rig.mjs`: Chrome móvil emulado 360×640 DPR2, doce posturas principales,
  nueve hitos del mordisco, 14 imágenes en escena contando rig principal,
  borde, fondo y héroe, pausa congelada, movimiento reducido y cero errores.
  El barrido medido recorre x=82→177→278 en y=520→521,25→530. Entrada y salida
  permanecen a la izquierda de x=120.
- Comparativa: 390×844, sin desbordamiento; movimiento reducido inicial,
  reproducción, pausa, selector y recorrido manual verificados.
- `qa-encounter.mjs`: victoria con seis notas y tres vidas saltando los ataques,
  retry táctil, entrada por teclado, pausa, ruta real desde Black Forest y
  audio desbloqueado por gesto. Se cuentan dos avisos de cada ataque, seis
  recogidas y una victoria; cero errores de página o HTTP.

Las comprobaciones válidas de navegador se ejecutaron con permiso de host
contra el Vite local. Emulación y conteo de eventos de audio no equivalen a una
aprobación física ni a una escucha real.

## Revisión física pendiente

- Comparar: `http://127.0.0.1:5174/art-lab/2026-09-05-chomper-rig/`.
- Jugar: `http://127.0.0.1:5174/?encounter=chomper&chomperArt=rig`.
- Jugar en la LAN de esta sesión:
  `http://192.168.1.138:5174/?encounter=chomper&chomperArt=rig`.

Revisar en el teléfono la separación respecto al bosque, la lectura de las
tres mandíbulas, el gesto de negación, el barrido horizontal y el margen real
del salto. Ajustar sólo desde esa evidencia. El suelo del bosque, ingrediente
y cierre siguen pendientes; la aprobación de la arena no autoriza publicar.

Commit sugerido, sólo si Raúl lo pide:
`feat(chomper): add articulated bite and mobile contrast preview`.

Codex / GPT-6 Astra · 2026-09-05.
