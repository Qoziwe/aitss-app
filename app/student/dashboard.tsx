import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { lmsApi } from '@/api/endpoints';
import { useQuery } from '@/api/useQuery';
import type { StudentDashboard } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { AsyncView, Bar, Bento, Button, Cell, Chip, Icon, List, ListRow, Page, Row, Section, Text } from '@/components/ui';
import { whenLabel } from '@/utils/calendar';
import { useTheme } from '@/theme';
import { STATUS_TONE } from '@/utils/mastery';
import { firstName, greeting, sentLabel, todayLabel } from '@/utils/format';

export default function StudentDashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const query = useQuery<StudentDashboard>('student.dashboard', lmsApi.studentDashboard);

  return (
    <Page title={`${greeting()}, ${firstName(user?.full_name ?? '')}`} subtitle={todayLabel()}>
      <AsyncView query={query}>
        {(d) => (
          <Bento>
            <Cell span={12} tone="accent">
              <Text variant="eyebrow" color="accent">From your AI tutor</Text>
              <Text variant="h2">{d.ai_summary}</Text>
              <Row wrap>
                <Button label="Continue with AI Tutor" iconRight="arrow" href="/student/tutor" />
                <Button label="Open lecture notes" variant="secondary" href="/student/subjects" />
              </Row>
            </Cell>

            {d.consultations.length > 0 ? (
              <Cell span={12} tone="ok">
                <Section title="Your consultation" subtitle="Your teacher set a time to help you in person" />
                <List>
                  {d.consultations.map((c) => (
                    <View key={c.id} style={{ paddingVertical: 14, gap: 6 }}>
                      <Row gap={10}>
                        <Icon name="calendar" size={20} color={colors.ok} />
                        <Text variant="h3">{whenLabel(c.starts_at, c.duration_min)}</Text>
                      </Row>
                      <Text color="muted">{c.teacher_name} · {c.topic_title} · {c.place}</Text>
                      {c.note ? <Text>{c.note}</Text> : null}
                    </View>
                  ))}
                </List>
              </Cell>
            ) : null}

            <Cell span={7}>
              <Section title="Pending homework" right={<Button label="All tasks" variant="link" size="sm" iconRight="chev" href="/student/homework" />} />
              {d.pending_tasks.length === 0 ? <Text color="muted">Nothing to do. Nice work.</Text> : null}
              <List>
                {d.pending_tasks.map((t) => (
                  <ListRow
                    key={t.id}
                    title={t.title}
                    subtitle={`${t.subject} · ${t.topic} · ${sentLabel(t.posted_at).replace('Sent', 'Posted')}`}
                    right={
                      <Row gap={10}>
                        <Chip label={t.type === 'quiz' ? 'Quiz' : 'Homework'} />
                        <Button label="Start" size="sm" onPress={() => router.push(`/student/homework?task=${t.id}` as never)} />
                      </Row>
                    }
                  />
                ))}
              </List>
            </Cell>

            <Cell span={5}>
              <Section title="Teacher requests" />
              {d.consultations.length > 0 ? (
                <Text color="muted">Meeting set for {whenLabel(d.consultations[0]!.starts_at, d.consultations[0]!.duration_min)}.</Text>
              ) : d.active_escalation ? (
                <View style={{ gap: 8 }}>
                  <Chip label="Waiting for your teacher" tone="warn" icon="flag" />
                  <Text variant="bodyStrong">{d.active_escalation.topic_title}</Text>
                  <Text variant="small" color="muted">
                    {d.active_escalation.group_name} · {sentLabel(d.active_escalation.created_at)}
                  </Text>
                  <Text color="muted">Your teacher has a short summary of what you tried.</Text>
                </View>
              ) : (
                <Text color="muted">No open requests. If the AI cannot help, it will send you to your teacher here.</Text>
              )}
            </Cell>

            <Cell span={6}>
              <Section title="My weak spots" right={<Button label="Graph" variant="link" size="sm" iconRight="chev" href="/student/graph" />} />
              {d.weak_nodes.length === 0 ? <Text color="muted">No weak spots right now.</Text> : null}
              <List>
                {d.weak_nodes.map((n) => (
                  <View key={n.topic_id} style={{ paddingVertical: 14, gap: 8 }}>
                    <Row justify="space-between">
                      <Text variant="bodyStrong">{n.title}</Text>
                      <Text variant="smallStrong" color="muted">{n.mastery_score}%</Text>
                    </Row>
                    <Bar value={n.mastery_score} tone={STATUS_TONE[n.status]} />
                    <Text variant="small" color="muted">{n.note}</Text>
                  </View>
                ))}
              </List>
            </Cell>

            <Cell span={6}>
              <Section title="My subjects" right={<Button label="Open" variant="link" size="sm" iconRight="chev" href="/student/subjects" />} />
              <List>
                {d.subjects.map((s) => {
                  const pct = s.total_topics ? Math.round((s.mastered_topics / s.total_topics) * 100) : 0;
                  return (
                    <View key={s.id} style={{ paddingVertical: 14, gap: 8 }}>
                      <Row justify="space-between">
                        <Text variant="bodyStrong">{s.title}</Text>
                        <Text variant="smallStrong" color="muted">{s.mastered_topics} of {s.total_topics} topics</Text>
                      </Row>
                      <Bar value={pct} />
                    </View>
                  );
                })}
              </List>
            </Cell>
          </Bento>
        )}
      </AsyncView>
    </Page>
  );
}
