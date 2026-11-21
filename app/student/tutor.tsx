import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { aiApi, lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { useQuery } from '@/api/useQuery';
import type { EscalationTicket, KnowledgeGraphResponse, SubjectsResponse } from '@/api/types';
import { AsyncView, Bento, Button, Card, Cell, Chip, Page, Row, Select, Stack, Text, TextField } from '@/components/ui';
import { useTheme, radius } from '@/theme';
import { sentLabel } from '@/utils/format';
import { STATUS_LABEL, STATUS_TONE } from '@/utils/mastery';

type Message = { id: number; from: 'ai' | 'me'; text: string };

const MAX_ATTEMPTS = 3;

export default function TutorScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ topic?: string }>();
  const subjects = useQuery<SubjectsResponse>('subjects', lmsApi.subjects);
  const graph = useQuery<KnowledgeGraphResponse>('student.graph', lmsApi.knowledgeGraph);

  const [topicId, setTopicId] = useState<number | null>(params.topic ? Number(params.topic) : null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [ticket, setTicket] = useState<EscalationTicket | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (params.topic) setTopicId(Number(params.topic));
  }, [params.topic]);

  const topics = (subjects.data?.subjects ?? []).flatMap((s) => s.topics.map((t) => ({ ...t, subject: s.title })));
  // Default topic: the weakest one that is not finished.
  const fallbackTopic = [...topics].filter((t) => t.status === 'struggling' || t.status === 'learning').sort((a, b) => a.mastery_score - b.mastery_score)[0] ?? topics[0];
  const activeTopic = topics.find((t) => t.id === topicId) ?? fallbackTopic;
  const activeId = activeTopic?.id;

  const startSession = useCallback(async (id: number) => {
    setBusy(true);
    setError(null);
    setMessages([]);
    setAttempts(0);
    setTicket(null);
    setSessionId(null);
    try {
      const s = await aiApi.tutorSession({ topic_id: id });
      setSessionId(s.session_id);
      setMessages([{ id: nextId.current++, from: 'ai', text: s.greeting }]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (activeId !== undefined) void startSession(activeId);
  }, [activeId, startSession]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !sessionId || activeId === undefined || busy) return;
    setDraft('');
    setMessages((m) => [...m, { id: nextId.current++, from: 'me', text }]);
    setBusy(true);
    setError(null);
    try {
      const r = await aiApi.tutorChat({ session_id: sessionId, topic_id: activeId, message: text });
      setMessages((m) => [...m, { id: nextId.current++, from: 'ai', text: r.reply }]);
      setAttempts(r.attempts);
      if (r.escalation) setTicket(r.escalation);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const escalate = async () => {
    if (!sessionId || activeId === undefined || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await aiApi.tutorEscalate({ session_id: sessionId, topic_id: activeId });
      setMessages((m) => [...m, { id: nextId.current++, from: 'ai', text: r.reply }]);
      setTicket(r.escalation);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const memory = (graph.data?.memory ?? []).filter((m) => m.memory_type !== 'strength').slice(0, 3);

  return (
    <Page title="AI Tutor" subtitle="Ask a question. The tutor explains step by step.">
      <AsyncView query={subjects}>
        {() => (
          <Bento>
            <Cell span={8}>
              <Row justify="space-between" wrap>
                <Row gap={8}>
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i < attempts ? colors.warnBar : colors.line }} />
                  ))}
                  <Text variant="small" color="muted">Attempt {Math.min(attempts, MAX_ATTEMPTS)} of {MAX_ATTEMPTS}</Text>
                </Row>
                {!ticket ? <Button label="I still don't understand" variant="secondary" size="sm" icon="flag" disabled={!sessionId || attempts === 0} onPress={() => void escalate()} /> : null}
              </Row>

              <Stack gap={10}>
                {messages.map((m) => (
                  <View
                    key={m.id}
                    style={{
                      alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: radius.lg,
                      backgroundColor: m.from === 'me' ? colors.accent : colors.fill,
                    }}
                  >
                    <Text style={{ color: m.from === 'me' ? colors.onAccent : colors.text }}>{m.text}</Text>
                  </View>
                ))}
                {busy && messages.length > 0 ? <Text variant="small" color="muted">Tutor is typing…</Text> : null}
              </Stack>

              {ticket ? (
                <Card tone="warn">
                  <Chip label="Sent to your teacher" tone="warn" icon="flag" />
                  <Text color="warn">
                    {ticket.teacher_name} has a short summary of what you tried. Go and see them in person.
                  </Text>
                </Card>
              ) : (
                <Row align="flex-end" gap={8}>
                  <View style={{ flex: 1 }}>
                    <TextField value={draft} onChangeText={setDraft} placeholder="Type your question" autoCapitalize="sentences" onSubmitEditing={() => void send()} />
                  </View>
                  <Button icon="send" label="Send" disabled={!draft.trim() || !sessionId} loading={busy && !!draft} onPress={() => void send()} />
                </Row>
              )}
              {error ? <Text color="bad">{error}</Text> : null}
            </Cell>

            <Cell span={4}>
              <Text variant="eyebrow">Topic</Text>
              <Select
                value={String(activeId ?? '')}
                options={topics.map((t) => ({ value: String(t.id), label: `${t.subject} · ${t.title}` }))}
                onChange={(v) => setTopicId(Number(v))}
              />
              {activeTopic ? (
                <Row wrap>
                  <Chip label={`${STATUS_LABEL[activeTopic.status]}${activeTopic.status === 'unseen' ? '' : ` · ${activeTopic.mastery_score}%`}`} tone={STATUS_TONE[activeTopic.status]} />
                </Row>
              ) : null}
              {ticket ? <Text variant="small" color="muted">{sentLabel(ticket.created_at)}</Text> : null}

              <Text variant="eyebrow" style={{ marginTop: 12 }}>What the tutor remembers</Text>
              {memory.length === 0 ? <Text color="muted">Nothing yet.</Text> : null}
              {memory.map((m) => (
                <Text key={m.id} color="muted">• {m.memory_fact}</Text>
              ))}
            </Cell>
          </Bento>
        )}
      </AsyncView>
    </Page>
  );
}
