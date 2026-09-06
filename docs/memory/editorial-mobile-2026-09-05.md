# Pase editorial y móvil — 2026-09-05

> Informe histórico del primer pase. El estado actual, envío directo, nueva luna
> y autorización de publicación están en [release-2026-09-06.md](release-2026-09-06.md).

## Estado y alcance

Implementación local de Codex/Astra sobre la rama `visual/world-01-carlitos-drive`,
HEAD `b6be6472a0ff0fbc0e4efc1f3587c06aaf1612af`. El preflight coincidió exactamente
con la instrucción de Raúl y el árbol estaba limpio. Esta tanda queda **sin commit,
push ni deploy**. La v4 de Chomper conserva la revisión física positiva anterior;
el pase editorial/visual actual está pendiente de revisión física.

El mandato inicial cubría lectura, composición y copy de todas las pantallas,
Moonlight Mountain, suelo de Black Forest y cartel final. Raúl añadió la orientación
educativa/artística, una galería de los originales y la transformación completa al
obtener reserva. Después cambió el nombre Carlitos por **Alfredito**.

## Resultado

### Lectura y composición

`uiText` conserva el objeto y el ciclo de vida de Phaser para medir, situar y pulsar,
pero el navegador dibuja las letras a la resolución del dispositivo. Subir sólo
`Text.resolution` no evita que la textura vuelva a pasar por el framebuffer de
360 píxeles. No se amplía el framebuffer de todo el juego. La fuente es system-ui,
sin contornos ni sombras sobre los caracteres. Cuerpos de 15–17 px lógicos,
títulos de 20–28 px y controles de 46–48 px, según la pantalla.

La matriz real de Phaser sitúa los textos nativos, incluidos contenedores, origen,
rotación y cámara. Se ocultan al no renderizarse y se destruyen con el objeto.
Los paneles ocultan el texto de la escena inferior; el HUD desaparece durante
ayuda/cierre. Se corrigió el centrado doble de CSS y Phaser en formatos alargados
y horizontales. Los dos accesos de portada comparten una fila para liberar el título.

### Capítulos y apertura educativa

Cada cierre observa lo que sucedió y conecta con el siguiente lugar. Se invita,
sin obligación, a imaginar el sonido del planeta, un gesto del reflejo y la voz
del bosque. No se inventa un ingrediente ni una resolución narrativa del bosque.
El cartel conserva la idea de un recorrido todavía abierto e invita a añadir,
cambiar e imaginar mediante palabras, dibujo, sonido o movimiento.

La dirección de Raúl queda recogida en
[editorial-direction-2026-09-05.md](editorial-direction-2026-09-05.md): incertidumbre,
creación compartida, accesibilidad del lenguaje y futuro marco académico abierto.
Se distinguen las intenciones del diseño de efectos educativos por investigar.

### Ilustraciones

Moonlight usa un encuadre de 380 px de ancho, centro vertical 292, con escala
idéntica en ambos ejes. El punto focal de la luna permanece en x=180 a cualquier
avance. «Shine to the beat» está centrado. Los arcos originales son abiertos y
llegan al borde superior de la fuente: no se ha inventado un disco cerrado.
Un fundido discreto y estratos de grafito auxiliares enlazan con el suelo jugable.

Black Forest incorpora una copia exacta de `forest-floor-candidate-v1.webp`
(87 376 bytes) de `art-lab/2026-09-05-forest-polish/`. La textura se funde por
debajo del conjunto existente; ojo, boca, dibujo base y reglas siguen intactos.
La integración permite revisar la propuesta; no equivale a aprobación artística.

### Originales y cartel

Galería accesible desde portada y cartel, con cinco imágenes: Devilz, planeta,
montaña, bosque y Chomper. Son copias de las fotografías completas, autoorientadas
y reducidas proporcionalmente a WebP, sin recorte ni retoque. Los cinco hashes
SHA-256 de las fuentes siguen idénticos. Peso total: **398 120 bytes**; carga
bajo demanda y elementos de imagen con lazy loading. El dibujo de Chomper sí
forma parte de esta galería de producción, aunque el encuentro siga sólo en DEV.

El cartel ocupa la pantalla y permite desplazamiento en las más pequeñas. El
mensaje se prepara en un campo editable y se copia para enviarlo manualmente a
quien compartió el juego. Se comprobó tanto el portapapeles seguro como la
alternativa en HTTP de la red local. No hay servidor de recepción ni envío
externo. La galería usa un diálogo nativo y devuelve el foco al cerrarse; el
editor de mensaje admite Tab y Escape.

### Alfredito

Se retira la pequeña figura acompañante. La figura principal pasa a Alfredito
mientras `recoveryChances > 0`, con borde cálido de silueta y cuatro destellos.
La preferencia del personaje elegido se conserva por separado. Al consumir la
última reserva se restaura Devi, Lovu o Divu, incluso tras guardar varias reservas.
Las poses existentes de salto, golpe y celebración se cargan con la escena del
recorrido. La animación cambia de apariencia sin alterar física ni colisiones.
El nombre visible y las ayudas dicen Alfredito. `hero`, rutas históricas y nombre
de rama se mantienen por compatibilidad; no son nombres mostrados al jugador.

## Comprobaciones

- `npm run check`: PASS.
- `npm test`: **220/220, 20 archivos**, incluidas cuatro pruebas del ciclo de reserva.
- `npm run build`: PASS; sólo permanece el aviso habitual por tamaño del motor Phaser.
- `git diff --check`: PASS.
- Chrome emulado: **32 estados × 5 formatos = 160 capturas**, a 360×640 DPR2,
  320×568 DPR2, 390×844 DPR3, 412×915 DPR3 y 640×360 DPR2. Cero errores de página
  o HTTP, cero desbordamientos horizontales, todos los textos visibles dentro
  del viewport y canvas centrado. Se revisaron las composiciones principales.
- Entradas, juego, pausa/ayuda, cierres de los tres capítulos, cinco avisos de
  descubrimiento, retry, galería inicial/final y editor de mensaje.
- Chomper: inicio, aviso, pausa congelada, victoria por saltos con seis notas y
  tres vidas, cartel, derrota, retry y regreso al inicio.
- Transformación de cada Devilz con dos reservas, consumo parcial, restauración
  final, persistencia de selección, apoyo de pies, pausa, reduced-motion y giro.
- Cinco reinicios de escena: número estable de nodos de texto y escuchas de
  prerender. Sin acumulación de texto nativo.
- Focal lunar a 0 %, 50 % y 100 % del recorrido: x=180 y escala uniforme.
- Contraste calculado de ocho parejas de lectura sobre fondos sólidos:
  **9,95:1–16,30:1**. No se extrapola a una certificación de toda la escena animada.
- Build servido por LAN en 4321: cartel tras el bosque, galería, repetir y copia
  del mensaje en contexto HTTP no seguro: PASS. Sin chunk del encuentro Chomper
  ni referencias a `/art-lab/` en el JavaScript de producción.

Capturas y scripts locales reproducibles (ignorados por Git):
`art-lab/2026-09-05-editorial-mobile/`. `qa.mjs all` recorre los cinco formatos;
`reserve-qa.mjs` verifica la transformación; `production-qa.mjs` recorre el cierre
del build servido. Los cierres del recorrido y ciertos avisos se preparan con
fixtures sobre escenas reales; esto no demuestra completar los tres recorridos
mediante juego humano. El encuentro Chomper sí se completa mediante su máquina
de estados y saltos simulados. JSON de resultados, contraste y manifiesto de
fuentes quedan junto a las capturas.

## Archivos del pase

- `src/ui/nativeText.ts`, `phaserTextStyle.ts`, `panelButton.ts`, `createHud.ts`:
  letras nativas, tamaños y visibilidad.
- `src/styles/global.css`, `src/main.ts`, `src/game/config/gameConfig.ts`:
  disposición, foco, capa de texto y suavizado visual.
- `src/game/content/helpContent.ts`, `introFlow.ts`, `journeyStages.ts`,
  `overlayText.ts`: orientación, ayudas y cierres.
- `src/game/scenes/BootScene.ts`, `LevelEntryScene.ts`, `JourneyScene.ts`,
  `ChomperScene.ts`, y los cuatro módulos de `systems/overlays/`: integración.
- `src/game/systems/backdrop/ImageBackdropRenderer.ts`,
  `BlackForestBackdropRenderer.ts` y su prueba: encuadre y suelo.
- `src/game/systems/character/AlfreditoPower.ts`, `reserveForm.ts` y su prueba,
  `CharacterAnimator.ts`, `src/game/content/reserveArt.ts`,
  `playableCharacters.ts` y su prueba, `localPreferenceStore.ts`: transformación
  y nombre. Se sustituye `CarlitosHeartbeat.ts`.
- `src/ui/JourneyPoster.ts`, `OriginalGallery.ts`, `src/assets/gallery/`,
  `src/assets/worlds/black-forest/runtime/black-forest-floor-v1.webp`: nuevas
  superficies y recursos. `PauseFlow.test.ts` adapta su doble de texto.
- Continuidad: este informe, dirección educativa, `CONTINUE_HERE.md`,
  `project-current-state.md`, `next-agent-brief.md`, `production-stack-orchestration.md`.

## Revisión física y siguiente paso

Juego con cuarta escena: `http://192.168.1.138:5174/?chomperArt=rig`.
Capturas: `http://192.168.1.138:5174/art-lab/2026-09-05-editorial-mobile/`.
Build de tres capítulos: `http://192.168.1.138:4321/`.

La aceptación depende de Raúl en su teléfono: nitidez, tacto, lectura de luna/suelo,
tamaño de Alfredito y tono editorial. El diseño mantiene el recorrido vertical;
en horizontal el canvas encaja a menor tamaño y los paneles también se reducen.
Chrome emulado no sustituye Safari físico, su teclado, safe areas, brillo ni
rendimiento sostenido. El siguiente paso es revisar el pase con Raúl y atender
sus observaciones. No se ha solicitado ni ejecutado publicación.
