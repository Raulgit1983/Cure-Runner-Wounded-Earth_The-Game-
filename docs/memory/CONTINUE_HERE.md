# Continúa aquí — instrucción vigente de Raúl, 2026-09-05

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

## Siguiente tanda, en orden

1. Mostrar a Raúl las capturas/arena y recoger su selección artística. La
   pregunta de aprobación de la arena se lanzó, sin respuesta específica aún.
   «Continúa» no se registra como selección de una imagen concreta.
2. Chomper necesita **partes animables separadas**: cuerpo, ambas cabezas,
   reposo/aviso/ataque/recuperación. Hoy es una ilustración estática con VFX
   dinámicos, no un rig final. Mantener silueta, asimetrías y diferencias entre
   cabezas de `Imagenes/Chomper.jpg`; generar estados sin descargas horneadas.
3. Tras aprobación, exportar assets runtime optimizados y cargarlos en el
   preload de Chomper. Levantar explícitamente el gate DEV de Boot/Finish/
   Journey solo cuando la escena tenga assets distribuibles y review suficiente.
4. Probar con Raúl/Mateo legibilidad, anticipación y comodidad de los ataques;
   ajustar SOLO este encuentro. Completar audio/reduced-motion en hardware.
5. Bosque: aprobar o corregir el suelo candidato e integrar si se acepta.
   Escenas 1-2: seguir el pase material de fondos y peligros; los fondos fuente
   no se han repintado en esta tanda. Revisar flechas de anotación en las fuentes,
   sin confundirlas con las banderas conectadas de las nuevas notas.
6. Ingrediente de Black Forest y cierre narrativo siguen pendientes; no rellenar
   automáticamente con los viejos mundos especulativos de CLAUDE.md.

## Estado que comprobar al reanudar (no reiniciar de cero)

- Base HEAD `e1480b0105edd6217fd0016d624f7851ab3c1216`, rama
  `visual/world-01-carlitos-drive`. Hay WIP de esta tanda: preservarlo.
- Leer `project-current-state.md`, `next-agent-brief.md` y el diff real.
- `art-lab/2026-09-05-forest-polish/` conserva textura, capturas y QA reproducible.
  La textura del suelo es candidata, no está importada por el juego.
- El ensayo Claude anterior no hizo inferencia ni editó. Su worktree queda
  conservado como baseline; no invocarlo ni limpiarlo automáticamente.
- La primera salida de Chomper tenía una cuadrícula pintada: **NO es alpha**.
  La segunda añadió fondo/halo. No promover ninguna como sprite transparente.
  La primera arena tenía una descarga estática; ya está corregida en
  `chomper-arena-v1.webp` (111840 bytes), que usa el preview DEV. No es alpha.
  Siempre contrastar con `Imagenes/Chomper.jpg`,
  no tratar las antiguas hojas generadas como decisiones de Mateo.
- No se ha ejecutado commit, push, deploy, instalación de paquetes ni pago.
- Informes, límites y lista de archivos: [polish-2026-09-05.md](polish-2026-09-05.md).
  Revisión visual: `art-lab/2026-09-05-forest-polish/REVIEW.md`.

Si la sesión se interrumpe, continuar desde el último cambio comprobado y
actualizar este archivo con pruebas/pendientes; no prometer ejecución mientras
la app o la sesión no pueden correr.
