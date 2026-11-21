import { useWindowDimensions } from 'react-native';
import { breakpoints } from '@/theme';

/** Screen width and the layout switch: side menu on wide screens, bottom tabs on phones. */
export function useLayout() {
  const { width } = useWindowDimensions();
  return { width, isWide: width >= breakpoints.wide };
}
