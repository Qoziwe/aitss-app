import type { LearningLevel } from '@/api/types';

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'ms', label: 'Malay' },
];

export const LEVELS: { value: LearningLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const MAX_WIDTH = 1120;
