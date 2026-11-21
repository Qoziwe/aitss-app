import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { errorMessage } from '@/api/errors';
import { invalidateQuery, useQuery } from '@/api/useQuery';
import type { AnswerItem, GradeResponse, HomeworkListResponse, TaskDetail } from '@/api/types';
import { AsyncView, Bar, Bento, Button, Card, Cell, Chip, Icon, List, ListRow, Page, Row, Section, Stack, Text, TextField } from '@/components/ui';
import { getQueue, homeworkWithFallback, submitWithFallback, syncQueue } from '@/offline/store';
import { radius, useTheme } from '@/theme';
import { sentLabel, shortDate } from '@/utils/format';

type HomeworkData = HomeworkListResponse & { offline: boolean };
type Draft = Record<number, { steps: string; final: string }>;

export default function HomeworkScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ task?: string }>();
  const query = useQuery<HomeworkData>('student.homework', homeworkWithFallback);

  const [taskId, setTaskId] = useState<number | null>(params.task ? Number(params.task) : null);
  const [qIndex, setQIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [queuedNotice, setQueuedNotice] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.task) {
      setTaskId(Number(params.task));
      setQIndex(0);
      setResult(null);
      setQueuedNotice(false);
    }
  }, [params.task]);

  const refreshQueue = useCallback(async () => setQueueCount((await getQueue()).length), []);
  useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  const open = (id: number) => {
    setTaskId(id);
    setQIndex(0);
    setResult(null);
    setQueuedNotice(false);
    setError(null);
  };

  const submit = async (task: TaskDetail) => {
    setBusy(true);
    setError(null);
    const answers: AnswerItem[] = task.questions.map((q) => ({
      question_id: q.id,
      steps: draft[q.id]?.steps ?? '',
      final_answer: draft[q.id]?.final ?? '',
    }));
    try {
      const r = await submitWithFallback({ task_id: task.id, answers });
      if (r.kind === 'graded') {
        setResult(r.result);
        invalidateQuery('student.dashboard');
        invalidateQuery('student.graph');
        invalidateQuery('subjects');
        await query.refetch();
      } else {
        setQueuedNotice(true);
        await refreshQueue();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true);
    setError(null);
    try {
      await syncQueue();
      invalidateQuery('student.dashboard');
      invalidateQuery('student.graph');
      await refreshQueue();
      await query.refetch();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Homework" subtitle="Write your steps, then your final answer. The AI will check them.">
      <AsyncView query={query}>
        {(data) => {
          const task = data.todo.find((t) => t.id === taskId);
          const question = task?.questions[qIndex];
          const d = question ? draft[question.id] ?? { steps: '', final: '' } : { steps: '', final: '' };
          const setField = (key: 'steps' | 'final', v: string) => {
            if (!question) return;
            setDraft((p) => ({ ...p, [question.id]: { ...d, [key]: v } }));
          };

          return (
            <Stack gap={16}>
              {data.offline ? (
                <Card tone="warn">
                  <Row>
                    <Icon name="wifiOff" size={20} color={colors.warn} />
                    <Text style={{ flex: 1 }}>You are offline. Showing downloaded lessons. Answers will be sent when you sync.</Text>
                  </Row>
                </Card>
              ) : null}

              {queueCount > 0 ? (
                <Card>
                  <Row justify="space-between" wrap>
                    <Text style={{ flex: 1 }}>{queueCount} {queueCount === 1 ? 'answer sheet is' : 'answer sheets are'} waiting to be sent.</Text>
                    <Button label="Sync now" icon="sync" size="sm" loading={busy} onPress={() => void sync()} />
                  </Row>
                </Card>
              ) : null}

              <Bento>
                <Cell span={5}>
                  <Section title="To do" />
                  {data.todo.length === 0 ? <Text color="muted">Nothing to do right now.</Text> : null}
                  <List>
                    {data.todo.map((t) => (
                      <ListRow
                        key={t.id}
                        title={t.title}
                        subtitle={`${t.subject} · ${t.topic} · ${sentLabel(t.posted_at).replace('Sent', 'Posted')}`}
                        selected={t.id === taskId}
                        onPress={() => open(t.id)}
                        right={<Chip label={t.type === 'quiz' ? 'Quiz' : 'Homework'} />}
                      />
                    ))}
                  </List>

                  {data.checked.length > 0 ? (
                    <>
                      <Section title="Checked" />
                      <List>
                        {data.checked.map((c) => (
                          <ListRow
                            key={c.id}
                            title={c.title}
                            subtitle={`${c.subject} · ${shortDate(c.posted_at)}`}
                            right={<Chip label={`${c.score_percent}%`} tone={c.score_percent >= 80 ? 'ok' : c.score_percent >= 60 ? 'warn' : 'bad'} />}
                          />
                        ))}
                      </List>
                    </>
                  ) : null}
                </Cell>

                <Cell span={7}>
                  {result ? (
                    <ResultView result={result} onDone={() => { setTaskId(null); setResult(null); }} />
                  ) : queuedNotice ? (
                    <>
                      <Chip label="Saved on this device" tone="accent" icon="wifiOff" />
                      <Text variant="h2">Your answers are saved</Text>
                      <Text color="muted">They will be checked as soon as you are online. Tap "Sync now" then.</Text>
                      <Button label="Back to tasks" variant="secondary" onPress={() => { setTaskId(null); setQueuedNotice(false); }} />
                    </>
                  ) : task && question ? (
                    <>
                      <Text variant="eyebrow">{task.subject} · {task.topic}</Text>
                      <Text variant="title">{task.title}</Text>
                      <Row wrap gap={8}>
                        {task.questions.map((q, i) => {
                          const done = !!draft[q.id]?.final;
                          const active = i === qIndex;
                          return (
                            <Pressable
                              key={q.id}
                              accessibilityRole="button"
                              accessibilityLabel={`Question ${i + 1}`}
                              onPress={() => setQIndex(i)}
                              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: active ? colors.accent : done ? colors.okBar : colors.line, backgroundColor: done ? colors.okSoft : colors.card }}
                            >
                              <Text variant="smallStrong" color={active ? 'accent' : done ? 'ok' : 'muted'}>{i + 1}</Text>
                            </Pressable>
                          );
                        })}
                      </Row>
                      <Card tone="fill">
                        <Text variant="eyebrow">Question {qIndex + 1} of {task.questions.length}</Text>
                        <Text variant="h3">{question.prompt}</Text>
                      </Card>
                      <TextField label="Your steps" multiline rows={4} value={d.steps} onChangeText={(v) => setField('steps', v)} placeholder="Write each step on its own line" autoCapitalize="sentences" />
                      <TextField label="Final answer" value={d.final} onChangeText={(v) => setField('final', v)} placeholder="x = " />
                      {error ? <Text color="bad">{error}</Text> : null}
                      <Row wrap>
                        {qIndex > 0 ? <Button label="Previous" variant="secondary" onPress={() => setQIndex(qIndex - 1)} /> : null}
                        {qIndex < task.questions.length - 1 ? (
                          <Button label="Next" iconRight="arrow" onPress={() => setQIndex(qIndex + 1)} />
                        ) : (
                          <Button label="Submit for checking" icon="check" loading={busy} onPress={() => void submit(task)} />
                        )}
                      </Row>
                    </>
                  ) : (
                    <>
                      <Text variant="h2">Pick a task</Text>
                      <Text color="muted">Choose a homework or quiz from the list to start.</Text>
                    </>
                  )}
                </Cell>
              </Bento>
            </Stack>
          );
        }}
      </AsyncView>
    </Page>
  );
}

function ResultView({ result, onDone }: { result: GradeResponse; onDone: () => void }) {
  const { colors } = useTheme();
  const tone = result.score_percent >= 80 ? 'ok' : result.score_percent >= 60 ? 'warn' : 'bad';
  return (
    <>
      <Text variant="eyebrow">Result</Text>
      <Row align="flex-end" gap={12}>
        <Text variant="numLg">{result.score_percent}%</Text>
        <Text color="muted" style={{ paddingBottom: 6 }}>{result.correct_count} of {result.total} correct</Text>
      </Row>
      <Bar value={result.score_percent} tone={tone} />
      <Text>{result.ai_feedback_summary}</Text>

      <List>
        {result.questions.map((q, i) => (
          <View key={q.question_id} style={{ paddingVertical: 14, gap: 6 }}>
            <Row justify="space-between">
              <Text variant="bodyStrong">Question {i + 1}</Text>
              <Chip label={q.correct ? 'Correct' : 'Check this'} tone={q.correct ? 'ok' : 'bad'} icon={q.correct ? 'check' : 'alert'} />
            </Row>
            {q.feedback ? <Text color="muted">{q.feedback}</Text> : null}
            {q.correction ? (
              <Row gap={8} wrap>
                <Text color="bad" style={{ textDecorationLine: 'line-through' }}>{q.correction.wrong}</Text>
                <Icon name="arrow" size={16} color={colors.muted} />
                <Text color="ok">{q.correction.right}</Text>
              </Row>
            ) : null}
          </View>
        ))}
      </List>

      {result.detected_weak_topics.length > 0 ? (
        <Card tone="warn">
          <Text variant="bodyStrong">Weak topics found</Text>
          {result.detected_weak_topics.map((w) => (
            <Text key={w.topic_id} color="muted">
              <Text variant="bodyStrong">{w.title}.</Text> {w.note}
            </Text>
          ))}
        </Card>
      ) : null}
      <Button label="Back to tasks" variant="secondary" onPress={onDone} />
    </>
  );
}
