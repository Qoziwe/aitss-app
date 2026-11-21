import type { Colors } from '@/theme';
import type { MasteryStatus } from '@/api/types';
import type { IconName } from '@/components/ui/Icon';

export type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'accent';

export const STATUS_LABEL: Record<MasteryStatus, string> = {
  mastered: 'Mastered',
  learning: 'Learning',
  struggling: 'Struggling',
  unseen: 'Not started',
};

export const STATUS_TONE: Record<MasteryStatus, Tone> = {
  mastered: 'ok',
  learning: 'warn',
  struggling: 'bad',
  unseen: 'neutral',
};

export const STATUS_ICON: Record<MasteryStatus, IconName> = {
  mastered: 'check',
  learning: 'half',
  struggling: 'alert',
  unseen: 'circle',
};

/** Text color, soft background and bar color for a tone. */
export function toneColors(c: Colors, tone: Tone): { fg: string; bg: string; bar: string } {
  switch (tone) {
    case 'ok':
      return { fg: c.ok, bg: c.okSoft, bar: c.okBar };
    case 'warn':
      return { fg: c.warn, bg: c.warnSoft, bar: c.warnBar };
    case 'bad':
      return { fg: c.bad, bg: c.badSoft, bar: c.badBar };
    case 'accent':
      return { fg: c.accent, bg: c.accentSoft, bar: c.accent };
    default:
      return { fg: c.muted, bg: c.fill, bar: c.line };
  }
}
