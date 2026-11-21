import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Shapes are copied from the design sprite. 24x24 grid, line icons.
type Shape =
  | { p: string; fill?: boolean }
  | { c: [number, number, number]; dash?: string }
  | { r: [number, number, number, number, number] };

const ICONS = {
  home: [{ p: 'M3 11.5 12 4l9 7.5' }, { p: 'M5.5 10v10h13V10' }],
  book: [{ p: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z' }, { p: 'M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5' }],
  chat: [{ p: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z' }],
  graph: [{ c: [6, 12, 2.5] }, { c: [18, 6, 2.5] }, { c: [18, 18, 2.5] }, { p: 'm8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6' }],
  task: [{ r: [5, 4, 14, 17, 2.5] }, { p: 'M9 4h6v3H9z' }, { p: 'm9 14 2 2 4-4' }],
  gear: [{ p: 'M4 7h9M17 7h3M4 17h3M11 17h9' }, { c: [15, 7, 2] }, { c: [9, 17, 2] }],
  users: [{ c: [9, 8, 3.5] }, { p: 'M2.5 20a6.5 6.5 0 0 1 13 0' }, { p: 'M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.6A6.5 6.5 0 0 1 21.5 20' }],
  flag: [{ p: 'M5 21V4' }, { p: 'M5 4h12l-2 4 2 4H5' }],
  check: [{ p: 'm5 12.5 4.5 4.5L19 7.5' }],
  down: [{ p: 'M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14' }],
  send: [{ p: 'M4 12 20 4l-4 16-4.5-6.5z' }],
  arrow: [{ p: 'M5 12h14M13 6l6 6-6 6' }],
  sun: [{ c: [12, 12, 4] }, { p: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4' }],
  moon: [{ p: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z' }],
  auto: [{ r: [3, 4, 18, 12, 2.5] }, { p: 'M8 20h8M12 16v4' }],
  wifiOff: [{ p: 'M3 3l18 18' }, { p: 'M5 12.5a10 10 0 0 1 4-2.4M19 12.5a10 10 0 0 0-5.5-2.8M8.5 16a5 5 0 0 1 3-1.4M15.5 16a5 5 0 0 0-1-.9' }, { p: 'M12 19.5v.01' }],
  sync: [{ p: 'M20 11a8 8 0 0 0-14-4L4 9' }, { p: 'M4 4v5h5' }, { p: 'M4 13a8 8 0 0 0 14 4l2-2' }, { p: 'M20 20v-5h-5' }],
  cpu: [{ r: [6, 6, 12, 12, 2] }, { p: 'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3' }],
  user: [{ c: [12, 8, 4] }, { p: 'M4 21a8 8 0 0 1 16 0' }],
  lock: [{ r: [5, 11, 14, 9, 2] }, { p: 'M8 11V8a4 4 0 0 1 8 0v3' }],
  plus: [{ p: 'M12 5v14M5 12h14' }],
  bolt: [{ p: 'M13 3 5 13.5h6L10 21l8-10.5h-6z' }],
  alert: [{ p: 'M12 4 2.5 20h19z' }, { p: 'M12 10v4M12 17.2v.01' }],
  half: [{ c: [12, 12, 8] }, { p: 'M12 4a8 8 0 0 1 0 16z', fill: true }],
  circle: [{ c: [12, 12, 8], dash: '3 3' }],
  chev: [{ p: 'm9 6 6 6-6 6' }],
  globe: [{ c: [12, 12, 9] }, { p: 'M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z' }],
  mic: [{ r: [9, 3, 6, 11, 3] }, { p: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21' }],
  calendar: [{ r: [3, 5, 18, 16, 2.5] }, { p: 'M3 10h18M8 3v4M16 3v4' }],
  logout: [{ p: 'M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M15 8l4 4-4 4M19 12H9' }],
} as const satisfies Record<string, readonly Shape[]>;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

export function Icon({ name, size = 20, color, strokeWidth = 1.8 }: Props) {
  const shapes = ICONS[name] as readonly Shape[];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {shapes.map((s, i) => {
        if ('p' in s) return <Path key={i} d={s.p} fill={s.fill ? color : 'none'} />;
        if ('c' in s) return <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} strokeDasharray={s.dash} />;
        return <Rect key={i} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4]} />;
      })}
    </Svg>
  );
}
