# Continúa aquí — instrucción vigente de Raúl, 2026-09-06

## Estado vigente — cierre y publicación, 2026-09-06

Raúl autorizó terminar, guardar y publicar para Mateo. Está confirmado el correo
`lamanigua.ca@gmail.com`: el usuario aportó la recepción del mensaje técnico.
Los formularios se envían dentro del juego y siguen al capítulo que corresponde;
Inicio desde pausa pide confirmación. El final permite empezar desde el primer
mundo. Se han afinado las preguntas y el tono; luna completa y cristales según
la referencia elegida, con brillo vinculado al sonido real. Chomper v4 aprobado
se incorpora a la secuencia pública mediante carga diferida.

Base: `b6be6472a0ff0fbc0e4efc1f3587c06aaf1612af`; rama de trabajo
`visual/world-01-carlitos-drive`. Se preserva el pase anterior completo.
232 pruebas / 22 archivos, check y build correctos; 210 capturas en 5 formatos.
Estado de publicación y recibo exacto: [release-2026-09-06.md](release-2026-09-06.md).
Código publicado: `18a4e1f489fa4b40188d5685f5f911edd1adbd39`; build y deploy
de GitHub Actions 34019527754 correctos. Los 11 archivos públicos HTML/JS/CSS
coinciden con el build comprobado. QA público del recorrido y formulario PASS;
un envío real desde el juego recibió HTTP 200/success=true. Este checkpoint
documental posterior permanece
en la rama de trabajo; main conserva la versión publicada. URL:
https://raulgit1983.github.io/Cure-Runner-Wounded-Planet/

Codex/Astra continúa como único escritor. No activar Claude, reiniciar el pase,
limpiar originales/art-lab ni modificar el lockfile por rutina. La revisión real
de Mateo sigue pendiente; las pruebas emuladas no equivalen a Safari físico.

## Histórico — pase editorial inicial, 2026-09-05

Base comprobada antes de editar: rama `visual/world-01-carlitos-drive`, HEAD
`b6be6472a0ff0fbc0e4efc1f3587c06aaf1612af`, árbol limpio. El pase actual es
**trabajo local sin commit**, posterior al checkpoint Chomper v4 aprobado.

- Tipografía nativa del navegador sincronizada con Phaser, cuerpos y controles
  mayores, paneles recompuestos y HUD oculto durante cierres/ayudas.
- Cierres propios de cada capítulo e invitaciones opcionales a imaginar sonido,
  gesto y voz. La historia y el ingrediente del bosque siguen abiertos.
- Moonlight conserva escala uniforme, luna centrada durante todo el recorrido y
  «Shine to the beat» centrado. Terreno auxiliar independiente del dibujo.
- Suelo candidato del bosque integrado localmente para revisión, sin modificar
  la composición original del ojo y la boca. Es una propuesta, no aprobación física.
- Galería de cinco dibujos originales completos desde portada y cartel final.
  Invitación a compartir las creaciones tal como estén, cualquiera que sea su acabado.
- Cartel final de pantalla completa, borrador opcional de mensaje y copia manual.
  No hay un servicio de envío ni se transmiten creaciones automáticamente.
- **Alfredito** sustituye el nombre anterior en el juego. Cualquiera de los tres
  Devilz adopta su figura completa con borde de luz mientras queden reservas;
  al consumir la última vuelve al personaje elegido. No se añade duración,
  ventaja, botón, colisión ni regla de obtención.
- `check`, `build`, **220 tests / 20 archivos** y `diff --check` correctos.
  QA móvil y límites detallados en [informe del pase](editorial-mobile-2026-09-05.md).
- Sigue pendiente la revisión física de Raúl de este pase. Chomper continúa
  sólo en DEV, con su v4 previamente aprobada. Sin commit, push ni deploy.

Revisión local: `http://192.168.1.138:5174/?chomperArt=rig`.
Capturas: `http://192.168.1.138:5174/art-lab/2026-09-05-editorial-mobile/`.
Build servido localmente: `http://192.168.1.138:4321/` (termina en el bosque).
Los servidores dependen de esta máquina; comprobar que siguen activos al reanudar.

Dirección educativa: [criterios de Raúl](editorial-direction-2026-09-05.md).
La investigación de maestría/doctorado está abierta; los propósitos del diseño
no son efectos educativos demostrados.

### Próximo paso

Presentar el juego y las capturas para revisión física en móvil. Atender sus
observaciones antes de cualquier publicación. Preservar este WIP y los
materiales ignorados en `art-lab/`; no repetir el pase desde cero.

## Antecedentes conservados — el estado anterior queda sustituido por el pase vigente

## Encargo activo

Codex/Astra implementa directamente; Claude ya no forma parte del equipo.
Mejorar el juego sin perder la esencia de los diseños de Mateo. Raúl aclara
que notas, premios, plataformas y elementos auxiliares no son dibujos de
Mateo y autoriza rediseñarlos. Autoriza **una cuarta escena propia para
Chomper y sus ataques, después de las tres escenas existentes**.

Este mandato sustituye la antigua espera para comenzar el jefe; no autoriza
inventar los ingredientes o el cierre emocional, publicar, gastar dinero,
borrar trabajo o hacer commits sin su gate correspondiente.

## Ya implementado y comprobado — no rehacer

### Continuación con Astra — 2026-09-05

- Preflight real: rama `visual/world-01-carlitos-drive`, HEAD
  `bc8ed3178684dad65952e8dcd57f8f7b0380f036`, árbol limpio al iniciar.
  La tanda anterior ya estaba en ese commit; la referencia a WIP/e1480b0
  que figuraba aquí estaba desactualizada.
- Raúl respondió **«Apruebo»** a la arena `chomper-arena-v1.webp` mostrada en
  esta conversación. Acabado aprobado; esto no selecciona automáticamente
  el suelo del bosque ni movimientos que aún no se habían mostrado.
- Ante otra salida de imagegen con cuadrícula pintada (RGB opaco), Raúl
  respondió **«Usa la mejor solución»** a la propuesta de máscaras y recorte
  convencional. Se recortaron cuerpo/cabezas desde la arena aprobada,
  conservando RGB y proporciones. Imagegen solo aporta el relleno de fondo
  bajo las piezas retiradas; las fuentes no se sobrescriben.
- Raúl probó la primera variante animada en su móvil y la consideró demasiado
  básica: movimiento discreto y cuerpo tieso. Esa versión **no está aprobada**.
  Después pidió una embestida de mordisco. Rechazó también dos decisiones del
  pase intermedio: debía morder la cabeza roja superior, con apertura/cierre y
  un gesto de negación, y la trayectoria no podía caer casi verticalmente sobre
  el personaje porque así el salto no se leía como evasión.
- Variante animada v4 **opt-in DEV**:
  `http://127.0.0.1:5174/?encounter=chomper&chomperArt=rig`.
  El cuerpo respira, oscila y reacciona desde la espiral inferior; las cabezas
  anticipan/liberan con mayor amplitud. En `bite-lunge`, la cabeza roja niega
  dos veces y abre sus tres mandíbulas; la silueta baja por el borde izquierdo,
  barre el carril del suelo de izquierda a derecha, cierra la boca en contacto
  y se retira por debajo/izquierda antes de subir. El collider comparte esa
  misma curva; el salto pasa por encima del tramo peligroso.
- Nueva separación visual candidata: claro de bosque localizado detrás del
  cuerpo y borde frío derivado de las mismas piezas. Ambos acompañan la pose y
  aumentan con el aviso/ataque, sin recolorear ni sustituir el dibujo aprobado.
- Comparativa interactiva, sin necesidad de jugar:
  `http://127.0.0.1:5174/art-lab/2026-09-05-chomper-rig/`.
  Permite reproducir/pausar, elegir cabeza/estado y recorrer la postura.
- 7 WebP candidatos cargados, **438720 bytes**: fondo, cuerpo, cabeza dorada y
  cuatro piezas de la cabeza roja con alpha real. Su recomposición en reposo es
  idéntica píxel a píxel al recorte rojo anterior.
  En `art-lab/2026-09-05-chomper-rig/` (ignorado por Git) quedan máscaras,
  exportador, manifiesto, prompts, capturas y QA. No promover el cuerpo
  generado rechazado: contiene cuadrícula pintada.
- `check`, **216 tests / 19 archivos**, `build`, `diff --check`: PASS.
  Chrome 360×640 DPR2: 12 posturas, 9 hitos de la curva del mordisco, pausa,
  reduced-motion, contraste y carga opcional PASS; encuentro con victoria de
  6 notas/3 vidas saltando, retry/ruta/audio PASS. La boca y el collider van de
  x=82,y=520 a x=278,y=530 en el barrido peligroso. Producción sigue sin chunk
  Chomper ni rutas art-lab.
- Raúl revisó esta v4 en el móvil y respondió **«Muy bien»**. Autoriza salvar
  el estado como checkpoint antes de abrir una tarea nueva. Esto valida el pase
  para continuar trabajando; no autoriza todavía push, deploy o publicación.
- Esta continuación se guarda en un checkpoint Git local antes del relevo; no
  se ha hecho push o deploy. Informe:
  [chomper-rig-2026-09-05.md](chomper-rig-2026-09-05.md).

### Tanda anterior conservada

- Bosque: composición opaca + velo final; pausa: destrucción síncrona,
  idempotente, teclas repetidas ignoradas y paneles sin botones fuera.
- Notas conectadas, plataformas de apoyo plano y dos premios con dibujo propio.
  Son propuestas de arte integradas localmente, no selección final de Raúl.
- Chomper: modelo aislado a 120 pasos/s, avisos de 1,3 s, onda baja/descarga alta,
  tres vidas, seis notas en recuperación, doble salto, pausa, retry y salida.
  Esta afinación es un prototipo de Codex, no una anotación atribuida a Mateo.
- Cuarta escena **solo DEV** tras Black Forest. Acceso directo de prueba:
  `http://127.0.0.1:5174/?encounter=chomper`. No llega al build de producción.
- `check`, `test` (199/199, 17 archivos), `build`, `diff --check` correctos.
  Chrome emulado 360×640 DPR 2: tres niveles, pausa/ayuda/restart, contacto de
  los dos premios, boss victoria 6 notas/3 vidas, derrota/retry/ruta y eventos
  de audio. No se ha hecho prueba física ni escucha en un móvil.

## Encargo editorial recibido — implementado en el pase vigente

1. Hacer una **auditoría móvil integral de lectura y dirección editorial** antes
   de cualquier deploy: todos los textos, paneles, ayudas, avisos, botones,
   cierres y estados de las cuatro escenas. La tipografía actual se ve borrosa y
   obliga a esforzarse. Elegir una familia adecuada, asegurar render nítido,
   tamaños, interlineado, jerarquía, ancho de línea, composición y paleta con
   rigor; resolverlo de forma sistémica y comprobar cada pantalla real.
2. Dar un cierre propio y menos parco a cada capítulo, coherente con su mundo y
   con el recorrido general. Revisar el copy completo usando la información ya
   existente en el proyecto; Raúl pide avanzar sin preguntas rutinarias.
3. Reencuadrar **Moonlight Mountain**: la ilustración actual está demasiado
   estirada y la luna casi desaparece. La luna debe permanecer visible y
   centrada, con `Shine to the beat` también centrado. Componer el área jugable
   y extender sólo el terreno/entorno necesario como candidato integrado con el
   lenguaje de Mateo, preservando la ilustración focal y sus proporciones.
4. Resolver el suelo de **Black Forest**: hoy el carril se percibe como un camino
   negro desligado del dibujo. Partir del material candidato existente o crear
   una versión mejor, integrarla con la escena y revisarla en móvil.
5. Rediseñar el final como cartel a pantalla completa. Mantener la información
   útil actual y añadir una invitación cálida a Mateo y a cualquier jugador para
   enviar un mensaje con lo que añadirían, cambiarían o imaginarían. Debe sonar
   a seguir construyendo juntos, sin usar la palabra «prompt» ni tono técnico.
6. Auditar el conjunto con capturas móviles, contraste, desbordamientos,
   legibilidad y coherencia entre capítulos. Después presentar el pase a Raúl.
   **No desplegar** hasta que esa revisión esté terminada y él lo autorice.

## Estado que comprobar al reanudar (no reiniciar de cero)

- La base de la tanda Chomper fue `bc8ed3178684dad65952e8dcd57f8f7b0380f036`,
  rama `visual/world-01-carlitos-drive`. Releer el HEAD y estado Git reales: el
  checkpoint v4 se crea inmediatamente después de actualizar este relevo.
- Leer `project-current-state.md`, `next-agent-brief.md` y el diff real.
- `art-lab/2026-09-05-forest-polish/` conserva textura, capturas y QA reproducible.
  La textura del suelo se ha integrado localmente como candidata en el pase vigente.
- El ensayo Claude anterior no hizo inferencia ni editó. Su worktree queda
  conservado como baseline; no invocarlo ni limpiarlo automáticamente.
- La primera salida de Chomper tenía una cuadrícula pintada: **NO es alpha**.
  La segunda añadió fondo/halo. No promover ninguna como sprite transparente.
  La primera arena tenía una descarga estática; ya está corregida en
  `chomper-arena-v1.webp` (111840 bytes), que usa el preview DEV. No es alpha.
  Siempre contrastar con `Imagenes/Chomper.jpg`,
  no tratar las antiguas hojas generadas como decisiones de Mateo.
- El commit `bc8ed31` ya existía al reanudar. Esta continuación no ejecuta
  otro commit, push, deploy, instalación de paquetes ni pago.
- Informes, límites y lista de archivos: [polish-2026-09-05.md](polish-2026-09-05.md).
  Revisión visual: `art-lab/2026-09-05-forest-polish/REVIEW.md`.

Si la sesión se interrumpe, continuar desde el último cambio comprobado y
actualizar este archivo con pruebas/pendientes; no prometer ejecución mientras
la app o la sesión no pueden correr.
