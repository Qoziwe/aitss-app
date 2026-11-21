import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Card, type CardTone } from './Card';

// 12-column grid. On narrow containers every tile takes the full width.
const GAP = 24;
const COLUMNS = 12;
const STACK_BELOW = 600;

const WidthContext = createContext<number>(0);

export function Bento({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));
  return (
    <WidthContext.Provider value={width}>
      <View onLayout={onLayout} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {width > 0 ? children : null}
      </View>
    </WidthContext.Provider>
  );
}

type CellProps = {
  /** Columns out of 12 on wide containers. */
  span?: number;
  tone?: CardTone;
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function Cell({ span = 12, tone, padded, onPress, style, children }: CellProps) {
  const total = useContext(WidthContext);
  const stacked = total < STACK_BELOW;
  const width = stacked ? total : Math.floor((span / COLUMNS) * (total + GAP) - GAP);
  return (
    <Card tone={tone} padded={padded} onPress={onPress} style={[{ width }, style]}>
      {children}
    </Card>
  );
}
