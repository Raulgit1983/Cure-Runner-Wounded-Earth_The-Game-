# Devilz — animation pack v2

Paquete de arte preparado para integración. **No está conectado al juego** y
ningún archivo de implementación se ha modificado.

## Qué contiene

Cada carpeta (`devi/`, `lovu/`, `divu/`) contiene:

- `*-main.webp`: pose base / reposo.
- `*-run-contact.webp`: contacto y compresión de carrera.
- `*-run-pass.webp`: paso por el centro del ciclo.
- `*-run-push.webp`: impulso y extensión.
- `*-jump-rise.webp`: subida.
- `*-jump-apex.webp`: suspensión en el ápice.
- `*-jump-fall.webp`: caída.
- `*-landing-compress.webp`: aterrizaje comprimido.
- `*-hit-stagger.webp`: reacción breve al golpe.
- `*-finish-awakened.webp`: despertar / celebración.
- `*-pose-sheet.webp`: hoja completa transparente para revisión humana.

Los 30 archivos runtime son WebP RGBA de `512×512`, tienen esquinas
transparentes y comparten el origen previsto por el proyecto: `(0.5, 0.58)`.
Las hojas completas son material de referencia, no texturas runtime.

`previews/` contiene hojas sobre el fondo oscuro real aproximado y GIFs de
carrera y salto. Son solo QA visual; no deben cargarse en Phaser.

## Movimiento recomendado

| Estado | Uso |
|---|---|
| Reposo | `main` + la respiración procedural existente |
| Carrera | `contact → pass → push → pass`, 10 fps, bucle |
| Salto | `rise → apex → fall`, elegido por velocidad vertical |
| Aterrizaje | `landing-compress` durante unos 90 ms y vuelta a carrera |
| Golpe | `hit-stagger` durante los 150 ms ya usados por el juego |
| Final | `finish-awakened`, sin bucle |

La prioridad visual debe ser: final → golpe → aterrizaje → salto → carrera →
reposo. La animación no debe modificar física, hitbox, radio de recogida ni
timing del runner.

## Identidad del trío

- **Devi — impulso y valor.** La boca y los cuernos llevan el movimiento. Es
  el de mayor amplitud y follow-through.
- **Lovu — escucha y precisión.** Se mueve poco, exacto y rítmico; los brazos
  son un metrónomo. La boca recta nunca se convierte en sonrisa.
- **Divu — alegría y rebote.** Su silueta redonda comprime y recupera como una
  pelota blanda. Conserva siempre su sonrisa.

Los rasgos de juego propuestos son laterales, no una jerarquía de “mejor” y
“peor”: Devi transforma un peligro, Lovu hace legible un pulso seguro y Divu
recupera un impulso aéreo bajo una condición musical.

## La solución para Carlitos

Carlitos deja de competir como cuarto seleccionable y se convierte en **El
Latido de Carlitos**, la representación visual de la reserva que ya existe.
Cuando la reserva se llena, su presencia acompaña al trío; cuando
`reserve_spent` salva al jugador, aparece como una luz protectora breve. No
añade botón ni modifica el equilibrio: vuelve emocionalmente visible una
mecánica ya implementada.

## Contrato de dibujo

- La silueta, expresión, asimetrías y rasgos de Mateo son autoridad.
- El acabado nuevo añade lápiz, cera, luz y volumen; no normaliza la tinta.
- Ningún fotograma debe introducir anatomía nueva ni convertirlos en mascotas
  genéricas.
- La paleta común usa cuerpo cálido, sombra vino y acentos chartreuse; cada
  personaje conserva su color dominante.

Véase `manifest.json` para el mapeo de estados y
`OPUS_IMPLEMENTATION_PROMPT.md` para el relevo listo para copiar.
