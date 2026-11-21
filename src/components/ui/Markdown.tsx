import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { fonts, radius, useTheme } from '@/theme';
import { Text } from './Text';

// Small renderer for lecture notes: # / ## headings, 1. and - lists, ```example blocks, **bold**.

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <Text key={i} variant="bodyStrong">{part.slice(2, -2)}</Text>
    ) : (
      part
    ),
  );
}

export function Markdown({ source }: { source: string }) {
  const { colors } = useTheme();
  const lines = source.split('\n');
  const out: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === '') {
      i += 1;
    } else if (line.startsWith('```')) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        code.push(lines[i]!);
        i += 1;
      }
      i += 1;
      out.push(
        <View key={out.length} style={{ backgroundColor: colors.fill, borderRadius: radius.md, padding: 14 }}>
          <Text style={{ fontFamily: fonts.medium }}>{code.join('\n')}</Text>
        </View>,
      );
    } else if (/^#{1,3}\s/.test(line)) {
      out.push(
        <Text key={out.length} variant="h3" style={{ marginTop: 4 }}>
          {line.replace(/^#{1,3}\s/, '')}
        </Text>,
      );
      i += 1;
    } else if (/^(\d+\.|-)\s/.test(line)) {
      const items: { mark: string; text: string }[] = [];
      while (i < lines.length && /^(\d+\.|-)\s/.test(lines[i]!)) {
        const m = /^(\d+\.|-)\s(.*)$/.exec(lines[i]!)!;
        items.push({ mark: m[1] === '-' ? '•' : m[1]!, text: m[2]! });
        i += 1;
      }
      out.push(
        <View key={out.length} style={{ gap: 6 }}>
          {items.map((it, k) => (
            <View key={k} style={{ flexDirection: 'row', gap: 8 }}>
              <Text color="muted" style={{ minWidth: 18 }}>{it.mark}</Text>
              <Text style={{ flex: 1 }}>{inline(it.text)}</Text>
            </View>
          ))}
        </View>,
      );
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i]!.trim() !== '' && !/^(#{1,3}\s|```|\d+\.\s|-\s)/.test(lines[i]!)) {
        para.push(lines[i]!);
        i += 1;
      }
      out.push(<Text key={out.length}>{inline(para.join(' '))}</Text>);
    }
  }

  return <View style={{ gap: 12 }}>{out}</View>;
}
