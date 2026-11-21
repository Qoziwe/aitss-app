import React, { type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { QueryResult } from '@/api/useQuery';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

type Props<T> = { query: QueryResult<T>; children: (data: T) => ReactNode };

/** Shows loading and error states, then the content once data is there. */
export function AsyncView<T>({ query, children }: Props<T>) {
  const { colors } = useTheme();
  if (query.data !== undefined) return <>{children(query.data)}</>;

  if (query.loading) {
    return (
      <View style={{ paddingVertical: 64, alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Card tone="bad">
      <Text variant="h3" color="bad">Could not load this page</Text>
      <Text color="bad">{query.error ?? 'Something went wrong.'}</Text>
      <Button label="Try again" variant="secondary" size="sm" onPress={() => void query.refetch()} />
    </Card>
  );
}
