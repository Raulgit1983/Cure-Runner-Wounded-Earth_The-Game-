import type { JourneyStageKey } from './journeyStages';

export type CollaborationMoment = JourneyStageKey | 'final' | 'gallery';
export const COLLABORATION_EMAIL = 'lamanigua.ca@gmail.com';
export interface CollaborationInvitation { title: string; purpose: string; subject: string; template: string }
export const COLLABORATION_INVITATIONS: Record<CollaborationMoment, CollaborationInvitation> = {
  'wounded-planet': {
    title: '¿Cómo sonaría tu planeta?',
    purpose: '¿Un pulso grave, una melodía, un ruido inventado? Cuéntanos cómo suena y cuándo debería aparecer para probar nuevas ideas en el juego.',
    subject: 'Una idea para el planeta',
    template: 'Mi sonido o canción sería…\n\nSonaría cuando…\n\nCambiaría esta parte del juego…'
  },
  'moonlight-mountain': {
    title: '¿Qué harías brillar?',
    purpose: 'La luna ya responde al sonido. ¿Qué más podría cambiar al tocar una nota? Queremos probar otras formas de jugar con la música.',
    subject: 'Una idea para Moonlight Mountain',
    template: 'Con la música, me gustaría que la luna o los cristales…\n\nImagino este sonido o movimiento…\n\nPodría suceder cuando…'
  },
  'black-forest': {
    title: '¿Qué voz tendría el bosque?',
    purpose: 'Ponle voz a lo que se esconde entre los pinos. Puedes inventar una frase, describir su sonido o imaginar otro personaje para el bosque.',
    subject: 'Una idea para The Black Forest',
    template: 'Imagino que el bosque diría o sonaría así…\n\nMe gustaría encontrar…\n\nTambién cambiaría…'
  },
  final: {
    title: 'Sigamos imaginando',
    purpose: '¿Qué te dieron ganas de repetir? ¿Qué se hizo largo o confuso? Tus ideas nos ayudan a elegir qué mejorar y qué construir después.',
    subject: 'Mi idea para seguir construyendo Cure Runner',
    template: 'Volvería a jugar esta parte…\n\nCambiaría esto porque…\n\nMi idea para el próximo mundo es…'
  },
  gallery: {
    title: 'Tu creación también cabe aquí',
    purpose: 'Un boceto, una canción, una escena, algo construido con lo que tenías a mano. Describe tu creación y cómo entraría en este mundo. Puede estar a medias.',
    subject: 'Una creación para el mundo de Mateo',
    template: 'He imaginado o creado…\n\nEn el juego podría…\n\nMe gustaría que al verlo o escucharlo…'
  }
};
