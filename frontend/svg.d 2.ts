/* apps/axees/svg.d.ts  (keep the name if you like) */
declare module '*.svg'  {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

/* 👇 add these — one line per asset type you want TS to accept */
declare module '*.gif'  { const src: number; export default src; }
declare module '*.png'  { const src: number; export default src; }
declare module '*.jpg'  { const src: number; export default src; }
declare module '*.jpeg' { const src: number; export default src; }
