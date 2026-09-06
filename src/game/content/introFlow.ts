import welcomeCoverUrl from '@/assets/cover/portada-del-juego-v01.jpg';

export const globalWelcomeContent = {
  eyebrow: 'De un dibujo a un mundo',
  title: 'CURE RUNNER',
  subtitle: 'WOUNDED PLANET',
  lead: 'Estos dibujos se pueden recorrer.',
  body: 'Entra en el mundo de Mateo: salta, busca notas y descubre quién vive al otro lado.',
  supportFirstRun: '¿Se te ocurre algo? Puedes proponerlo mientras juegas.',
  supportReturn: 'Otra ruta, otro salto. A ver qué descubres esta vez.',
  ctaFirstRun: 'Jugar',
  ctaReturn: 'Volver a jugar',
  art: {
    imageUrl: welcomeCoverUrl,
    alt: 'Portada de Cure Runner: Wounded Planet'
  },
  loading: {
    eyebrow: 'Preparando entrada',
    title: 'El viaje está por empezar',
    copy: 'La primera ruta ya espera.'
  }
} as const;
