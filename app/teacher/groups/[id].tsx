import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { invalidateQuery, useQuery } from '@/api/useQuery';
import type { GradebookState, GroupDetail, KnowledgeMapRow } from '@/api/types';
import { AsyncView, Bento, Button, Cell, Chip, List, Page, Row, Section, Select, Stack, Text, TextField, Toggle } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Tone } from '@/utils/mastery';

const STATE: Record<GradebookState, { label: string; tone: Tone }> = {
  checked: { label: 'Checked', tone: 'ok' },
  escalated: { label: 'Needs teacher', tone: 'warn' },
  missing: { label: 'Not submitted', tone: 'neutral' },
};

function MapBar({ row }: { row: KnowledgeMapRow }) {
  const { colors } = useTheme();
  const parts: [number, string][] = [
    [row.mastered, colors.okBar],
    [row.learning, colors.warnBar],
    [row.struggling, colors.badBar],
    [row.unseen, colors.line],
  ];
  return (
    <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2, backgroundColor: colors.card }}>
      {parts.map(([n, color], i) => (n > 0 ? <View key={i} style={{ flex: n, backgroundColor: color }} /> : null))}
    </View>
  );
}

export default function TeacherGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);
  const key = `teacher.group.${groupId}`;
  const query = useQuery<GroupDetail>(key, () => lmsApi.teacherGroup(groupId));

  const [instructions, setInstructions] = useState('');
  const [instrNote, setInstrNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setInstructions(query.data.ai_teacher_instructions);
    }
  }, [query.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (what: string, body: Parameters<typeof lmsApi.patchGroup>[1]) => {
    setBusy(what);
    try {
      const next = await lmsApi.patchGroup(groupId, body);
      query.mutate(next);
      invalidateQuery('teacher.dashboard');
      return true;
    } catch (e) {
      throw new Error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page
      eyebrow="Study group"
      title={query.data?.name ?? 'Group'}
      subtitle={query.data ? `${query.data.subject} · ${query.data.students_count} students · Invite code ${query.data.invite_code}` : undefined}
      right={<Button label="Lessons" variant="secondary" size="sm" icon="book" onPress={() => router.push('/teacher/lessons' as never)} />}
    >
      <AsyncView query={query}>
        {(g) => {
          const flagged = [...g.knowledge_map]
            .map((r) => ({ id: r.topic_id, ratio: r.struggling / Math.max(1, r.mastered + r.learning + r.struggling + r.unseen) }))
            .sort((a, b) => b.ratio - a.ratio)
            .slice(0, 2)
            .filter((x) => x.ratio > 0.2)
            .map((x) => x.id);

          return (
            <Bento>
              <Cell span={12}>
                <Row wrap gap={24} align="flex-end">
                  <View style={{ flexGrow: 1, flexBasis: 280, gap: 6 }}>
                    <Text variant="label" color="muted">Current lecture topic</Text>
                    <Select
                      value={String(g.current_topic_id)}
                      options={g.topics.map((t) => ({ value: String(t.id), label: t.title }))}
                      onChange={(v) => void patch('topic', { current_topic_id: Number(v) }).catch((e: Error) => setInstrNote({ ok: false, text: e.message }))}
                    />
                  </View>
                  <Row gap={12} style={{ minHeight: 48 }}>
                    <Text variant="bodyStrong">AI tutor {g.ai_active ? 'active' : 'paused'}</Text>
                    <Toggle
                      label="AI tutor active"
                      value={g.ai_active}
                      onChange={(v) => {
                        query.mutate({ ...g, ai_active: v });
                        void patch('ai', { ai_active: v }).catch(() => query.mutate(g));
                      }}
                    />
                  </Row>
                </Row>
              </Cell>

              <Cell span={12}>
                <Section title="Group knowledge map" subtitle="What to repeat in the next live lecture" />
                <Row wrap>
                  <Chip label="Mastered" tone="ok" />
                  <Chip label="Learning" tone="warn" />
                  <Chip label="Weak spot" tone="bad" />
                  <Chip label="Not started" />
                </Row>
                <Stack gap={14}>
                  {g.knowledge_map.map((r) => {
                    const total = r.mastered + r.learning + r.struggling + r.unseen;
                    return (
                      <View key={r.topic_id} style={{ gap: 6 }}>
                        <Row justify="space-between" wrap>
                          <Text variant="bodyStrong">{r.title}</Text>
                          <Row gap={8}>
                            {flagged.includes(r.topic_id) ? <Chip label="Repeat in next lecture" tone="bad" icon="flag" /> : null}
                            <Text variant="small" color="muted">{r.struggling} of {total} struggling</Text>
                          </Row>
                        </Row>
                        <MapBar row={r} />
                      </View>
                    );
                  })}
                </Stack>
              </Cell>

              <Cell span={12}>
                <Section title="AI instructions" subtitle="How the tutor explains. Applies to every student in this group." />
                <TextField label="Instructions for the AI tutor" multiline rows={5} value={instructions} onChangeText={setInstructions} autoCapitalize="sentences" />
                {instrNote ? <Text color={instrNote.ok ? 'ok' : 'bad'}>{instrNote.text}</Text> : null}
                <Button
                  label="Save instructions"
                  loading={busy === 'instr'}
                  onPress={() => {
                    setInstrNote(null);
                    patch('instr', { ai_teacher_instructions: instructions })
                      .then(() => setInstrNote({ ok: true, text: 'Saved.' }))
                      .catch((e: Error) => setInstrNote({ ok: false, text: e.message }));
                  }}
                />
              </Cell>

              <Cell span={8}>
                <Row justify="space-between" wrap>
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text variant="h3">Gradebook · {g.gradebook.title}</Text>
                    <Text color="muted">Checked automatically by AI</Text>
                  </View>
                  <Chip label={`${g.gradebook.checked} of ${g.gradebook.total} checked`} tone="accent" />
                </Row>
                <List>
                  {g.gradebook.rows.map((r) => (
                    <View key={r.student_id} style={{ paddingVertical: 14 }}>
                      <Row wrap gap={12} justify="space-between">
                        <Text variant="bodyStrong" style={{ minWidth: 110, flexGrow: 1 }}>{r.name}</Text>
                        <Text variant="bodyStrong" style={{ minWidth: 48 }}>{r.score_percent === null ? '—' : `${r.score_percent}%`}</Text>
                        <Text color="muted" style={{ minWidth: 120, flexGrow: 1 }}>{r.weakest_topic ?? '—'}</Text>
                        <Chip label={STATE[r.state].label} tone={STATE[r.state].tone} />
                      </Row>
                    </View>
                  ))}
                </List>
                <Text variant="small" color="muted">Showing {g.gradebook.rows.length} of {g.students_count} students</Text>
              </Cell>

              <Cell span={4}>
                <Section title="Most common mistakes" subtitle="This homework" />
                <List>
                  {g.common_mistakes.map((m) => (
                    <View key={m.text} style={{ paddingVertical: 14 }}>
                      <Row align="flex-start" gap={12}>
                        <Text variant="bodyStrong" color="bad" style={{ minWidth: 28 }}>{m.count}</Text>
                        <Text style={{ flex: 1 }}>{m.text}</Text>
                      </Row>
                    </View>
                  ))}
                </List>
              </Cell>
            </Bento>
          );
        }}
      </AsyncView>
    </Page>
  );
}
