import React from 'react';
import { ScrollView, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { Bento, Button, Cell, Icon, Row, Text, type IconName } from '@/components/ui';
import { useLayout } from '@/hooks/useLayout';
import { spacing, useTheme } from '@/theme';

const FEATURES: { icon: IconName; title: string; text: string; span: number }[] = [
  { icon: 'chat', title: 'An AI tutor that does not give answers', text: 'It asks guiding questions and explains step by step. After three tries it passes the student to the teacher with a short note.', span: 7 },
  { icon: 'graph', title: 'Knowledge graph', text: 'Every topic is linked to what it needs. See the real gap, not just a bad grade.', span: 5 },
  { icon: 'task', title: 'Homework checked in seconds', text: 'Students write steps and a final answer. The AI finds the mistake and the weak topic behind it.', span: 5 },
  { icon: 'wifiOff', title: 'Works offline', text: 'Download a lesson, study without internet, sync later.', span: 3 },
  { icon: 'users', title: 'Time back for teachers', text: 'One screen shows which topics the group struggles with and who needs help now.', span: 4 },
];

export default function Landing() {
  const { user, ready } = useAuth();
  const { colors } = useTheme();
  const { isWide } = useLayout();
  const insets = useSafeAreaInsets();

  if (!ready) return null;
  if (user) return <Redirect href={`/${user.role}/dashboard` as never} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ alignItems: 'center', paddingTop: insets.top + spacing.lg, paddingBottom: spacing.huge, paddingHorizontal: isWide ? spacing.xxxl : spacing.lg }}>
      <View style={{ width: '100%', maxWidth: 1120, gap: spacing.giant }}>
        <Row justify="space-between">
          <Row gap={10}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bolt" size={18} color={colors.onAccent} />
            </View>
            <Text variant="h2">AITSS</Text>
          </Row>
          <Button label="Sign in" variant="secondary" size="sm" href="/auth?mode=login" />
        </Row>

        <View style={{ gap: spacing.xl, paddingTop: isWide ? spacing.xxxl : spacing.lg }}>
          <Text variant="eyebrow" color="accent">AI Teaching Support System</Text>
          <Text variant="display" style={{ maxWidth: 760, fontSize: isWide ? 52 : 36, lineHeight: isWide ? 56 : 40 }}>
            Every student gets a tutor. Every teacher gets time back.
          </Text>
          <Text color="muted" style={{ maxWidth: 560, fontSize: 16, lineHeight: 24 }}>
            AITSS explains, checks homework and shows exactly where a student is stuck, so teachers can focus on the students who need them most.
          </Text>
          <Row wrap>
            <Button label="Get started" iconRight="arrow" href="/auth?mode=signup" />
            <Button label="Sign in" variant="secondary" href="/auth?mode=login" />
          </Row>
        </View>

        <Bento>
          {FEATURES.map((f, i) => (
            <Cell key={f.title} span={f.span} tone={i === 0 ? 'accent' : 'default'}>
              <Icon name={f.icon} size={24} color={colors.accent} />
              <Text variant="h3">{f.title}</Text>
              <Text color="muted">{f.text}</Text>
            </Cell>
          ))}
        </Bento>

        <Bento>
          <Cell span={6}>
            <Text variant="eyebrow" color="accent">For students</Text>
            <Text variant="h2">Learn at your own pace</Text>
            <Text color="muted">Ask the tutor, practice weak topics and track your progress in every subject.</Text>
          </Cell>
          <Cell span={6}>
            <Text variant="eyebrow" color="accent">For teachers</Text>
            <Text variant="h2">See the whole group at a glance</Text>
            <Text color="muted">Review the knowledge map, set AI rules for your group and answer only the questions that matter.</Text>
          </Cell>
        </Bento>
      </View>
    </ScrollView>
  );
}
