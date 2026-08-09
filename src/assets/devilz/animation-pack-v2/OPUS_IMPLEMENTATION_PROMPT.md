# Prompt para Opus — integrar Devilz animation pack v2

Trabaja en el repositorio del juego de Mateo. Antes de editar, confirma `cwd`,
raíz Git, rama, `HEAD` y `git status`; lee completos `CLAUDE.md`,
`docs/memory/project-current-state.md`, `docs/memory/next-agent-brief.md`,
`src/assets/devilz/animation-pack-v2/README.md` y
`src/assets/devilz/animation-pack-v2/manifest.json`.

## Estado que debes respetar

- El paquete de arte está completo en
  `src/assets/devilz/animation-pack-v2/`.
- Son 30 texturas runtime WebP RGBA de 512×512: diez por personaje (`main` +
  nueve poses). Las hojas y GIFs de `previews/` son solo QA.
- Todos los frames usan el origen compartido `(0.5, 0.58)`.
- El código todavía usa los assets Devilz antiguos. No sobrescribas ni borres
  los originales; integra el paquete v2 por nuevas rutas/imports.
- La física, colisiones, velocidad, salto, doble salto y radio de recogida ya
  funcionan y quedan fuera de alcance.
- No despliegues, no publiques, no hagas push y no hagas commit sin permiso
  humano explícito.

## Objetivo

Integrar el trío Devi/Lovu/Divu como los tres únicos personajes seleccionables,
darles animación orgánica usando el paquete v2, convertir a Carlitos en la
presencia visual de la reserva existente y rediseñar la selección para móvil
como un carrusel grande con swipe.

## 1. Registro y carga de arte

- Amplía el modelo compartido de personajes de forma data-driven; no añadas
  condicionales por nombre dentro de `JourneyScene`.
- Cada personaje debe declarar: `main`, tres frames de carrera, `jumpRise`,
  `jumpApex`, `jumpFall`, `landing`, `hit` y `finishAwakened`.
- `BootScene` debe cargar el nuevo conjunto caminando el registro, igual que
  hace ahora con las poses. No cargues hojas ni GIFs de preview.
- Conserva los tamaños móviles actuales en una primera pasada y evalúa el
  tamaño visual real en un viewport de teléfono; el arte no autoriza cambios
  de hitbox.

## 2. Animación orgánica, mínima y segura

- Cambia el Game Object del personaje de `Image` a `Sprite` solo si hace falta
  para usar `Phaser.Animations`; conserva exactamente posición, origen,
  profundidad, alpha, escala, rotación, aura y sombra actuales.
- Carrera en suelo: `run-contact → run-pass → run-push → run-pass`, 10 fps,
  `repeat: -1`. Crea una animación por personaje desde sus claves de textura.
- Salto: usa las reglas actuales de velocidad vertical. `jump-rise` durante
  subida, `jump-apex` dentro de la deadzone y `jump-fall` durante caída. El
  doble salto reutiliza `jump-rise`; no cambia la física.
- Aterrizaje: muestra `landing-compress` unos 90 ms y vuelve a carrera. Usa el
  `landingBurst`/momento de aterrizaje existente; no inventes otro detector.
- Golpe: mantiene la prioridad y bloqueo actuales de 150 ms con
  `hit-stagger`.
- Final: usa `finish-awakened`; los Devilz ya no necesitan fallback a `main`.
- Prioridad estricta: final → golpe → aterrizaje → salto → carrera → main.
- El código actual ya añade bob, respiración, squash, tilt e impacto. Evita
  duplicar amplitudes: primero conserva el comportamiento; si la carrera
  rebota demasiado, reduce solo el bob visual durante la animación de carrera,
  sin tocar el runner.
- No crees una máquina de estados general ni un refactor amplio. Extrae un
  controlador pequeño solo si reduce de verdad la complejidad de
  `JourneyScene`.

## 3. Solo tres seleccionables

- El carrusel debe ofrecer `devi`, `lovu`, `divu`; Carlitos deja de ser una
  opción jugable.
- Conserva los assets/perfil de Carlitos para el poder de reserva y para no
  romper partidas antiguas.
- Migra de forma segura la preferencia guardada `hero`: resuélvela a un Devilz
  por defecto sin lanzar errores. No borres otras preferencias ni progreso.
- Ningún Devilz es “mejor”: las diferencias visuales no deben tocar números de
  dificultad en esta fase.

## 4. Selector móvil grande y deslizable

- Sustituye la fila actual de retratos de 30 px por un carrusel horizontal.
- Personaje activo centrado y grande (aprox. caja de 110–132 px, ajustada por
  su `mobileScale`); anterior y siguiente visibles a los lados a unos 64 px y
  con menor alpha.
- Swipe horizontal real: umbral aproximado de 26 px y rechazo de gesto cuando
  domina el desplazamiento vertical. Incluye flechas con targets de al menos
  44 px y permite tocar los retratos laterales.
- Muestra nombre, puntos de posición y el texto exacto `Desliza para elegir`.
- Mantén el CTA explícito como única forma de empezar; un swipe o tap en el
  fondo nunca debe iniciar el nivel.
- Recompón la pantalla de 360×640 con cuidado. No tapes título, copy ni CTA;
  valida safe areas y teléfono real/coarse pointer.
- Persiste la elección inmediatamente con `localPreferenceStore`.

## 5. Carlitos como poder sin cambiar balance

- Nombre: **El Latido de Carlitos**.
- Reutiliza la reserva que ya existe; no añadas botón, medidor, carga, colisión,
  invulnerabilidad ni regla nueva.
- En `reserve_fill`, muestra una presencia cálida y discreta de Carlitos cerca
  del indicador de reserva o del aura, sin obstaculizar el juego.
- En el `reserve_spent` ya emitido por `audioCueBus`, muestra durante unos
  400–550 ms una aparición luminosa de Carlitos protegiendo al Devilz activo y
  desvaneciéndose. Reutiliza `hero-main.webp` y los sistemas de luz/tween
  existentes; no hace falta arte nuevo.
- Respeta reduced motion y destruye toda referencia/tween en shutdown/restart.

## 6. Verificación obligatoria

- Ejecuta `npm run check`, `npm run build` y `npm test`.
- Prueba en viewport móvil los tres personajes por separado: selector, swipe en
  ambos sentidos, persistencia, carrera, salto simple, doble salto,
  aterrizaje, golpe, i-frames, reserva llena/gastada, pausa, reintento y final.
- Confirma que cada estado usa la textura del personaje correcto y que jamás
  aparece un frame de Carlitos dentro del Devilz.
- Revisa consola y carga de red: cero errores, cero 404, cero textura ausente.
- Verifica visualmente que no hay halos cian ni bloques rectangulares, que los
  pies/silueta no saltan por cambios de ancla y que los personajes se leen
  sobre ambos mundos.
- Informa exactamente archivos tocados, no tocados y aplazados. Adjunta diff y
  resultados de validación. No amplíes el alcance.
