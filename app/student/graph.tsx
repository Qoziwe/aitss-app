import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { aiApi, lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { invalidateQuery, useQuery } from '@/api/useQuery';
import type { GraphEdge, GraphNode, KnowledgeGraphResponse } from '@/api/types';
import { AsyncView, Bento, Button, Cell, Chip, List, Page, Row, Section, Text } from '@/components/ui';
import { radius, useTheme } from '@/theme';
import { STATUS_ICON, STATUS_LABEL, STATUS_TONE, toneColors } from '@/utils/mastery';

const NODE_W = 172;
const NODE_H = 68;
const COL_GAP = 72;
const ROW_GAP = 20;
const PAD = 12;

type Placed = GraphNode & { x: number; y: number };

/** Columns = longest chain of prerequisites before a topic. Rows = order inside a column. */
function layout(nodes: GraphNode[], edges: GraphEdge[]) {
  const ids = new Set(nodes.map((n) => n.topic_id));
  const local = edges.filter((e) => ids.has(e.prerequisite_topic_id) && ids.has(e.target_topic_id));
  const depth = new Map<number, number>();
  const calc = (id: number, seen: Set<number>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const pre = local.filter((e) => e.target_topic_id === id).map((e) => calc(e.prerequisite_topic_id, seen) + 1);
    const d = pre.length ? Math.max(...pre) : 0;
    depth.set(id, d);
    return d;
  };
  nodes.forEach((n) => calc(n.topic_id, new Set()));

  const cols = new Map<number, GraphNode[]>();
  nodes.forEach((n) => {
    const d = depth.get(n.topic_id) ?? 0;
    cols.set(d, [...(cols.get(d) ?? []), n]);
  });

  const placed: Placed[] = [];
  let maxRows = 0;
  cols.forEach((list, d) => {
    maxRows = Math.max(maxRows, list.length);
    list.forEach((n, row) => placed.push({ ...n, x: PAD + d * (NODE_W + COL_GAP), y: PAD + row * (NODE_H + ROW_GAP) }));
  });
  const colCount = cols.size ? Math.max(...cols.keys()) + 1 : 1;
  return {
    placed,
    edges: local,
    width: PAD * 2 + colCount * NODE_W + (colCount - 1) * COL_GAP,
    height: PAD * 2 + maxRows * NODE_H + (maxRows - 1) * ROW_GAP,
  };
}

const MEMORY_LABEL = { weakness: 'Weakness', misconception: 'Misconception', learning_style: 'Learning style', strength: 'Strength' } as const;

export default function GraphScreen() {
  const { colors } = useTheme();
  const query = useQuery<KnowledgeGraphResponse>('student.graph', lmsApi.knowledgeGraph);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = query.data;
  const currentSubject = subjectId ?? data?.subjects[0]?.id ?? null;
  const nodes = useMemo(() => (data ? data.nodes.filter((n) => n.subject_id === currentSubject) : []), [data, currentSubject]);
  const graph = useMemo(() => layout(nodes, data?.edges ?? []), [nodes, data]);
  const selected = nodes.find((n) => n.topic_id === selectedId) ?? nodes.find((n) => n.status === 'struggling') ?? nodes[0];
  const nodeById = new Map(graph.placed.map((n) => [n.topic_id, n]));

  const quiz = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await aiApi.generateQuiz({ topic_ids: [selected.topic_id] });
      invalidateQuery('student.homework');
      invalidateQuery('student.dashboard');
      router.push('/student/homework' as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Knowledge Graph" subtitle="Each topic depends on the ones before it. Start where the arrows begin.">
      <AsyncView query={query}>
        {(g) => (
          <Bento>
            <Cell span={12}>
              <Row wrap>
                {g.subjects.map((s) => (
                  <Button key={s.id} label={s.title} variant="secondary" size="sm" selected={s.id === currentSubject} onPress={() => { setSubjectId(s.id); setSelectedId(null); }} />
                ))}
              </Row>
              <Row wrap>
                {(['mastered', 'learning', 'struggling', 'unseen'] as const).map((st) => (
                  <Chip key={st} label={STATUS_LABEL[st]} tone={STATUS_TONE[st]} icon={STATUS_ICON[st]} />
                ))}
              </Row>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View style={{ width: graph.width, height: graph.height }}>
                  <Svg width={graph.width} height={graph.height} style={{ position: 'absolute' }}>
                    {graph.edges.map((e) => {
                      const a = nodeById.get(e.prerequisite_topic_id);
                      const b = nodeById.get(e.target_topic_id);
                      if (!a || !b) return null;
                      const x1 = a.x + NODE_W;
                      const y1 = a.y + NODE_H / 2;
                      const x2 = b.x;
                      const y2 = b.y + NODE_H / 2;
                      const mx = (x1 + x2) / 2;
                      return (
                        <React.Fragment key={`${e.prerequisite_topic_id}-${e.target_topic_id}`}>
                          <Path d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2 - 4} ${y2}`} stroke={colors.line} strokeWidth={2} fill="none" />
                          <Path d={`M${x2 - 9} ${y2 - 5} L${x2 - 1} ${y2} L${x2 - 9} ${y2 + 5}`} stroke={colors.muted} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </React.Fragment>
                      );
                    })}
                  </Svg>
                  {graph.placed.map((n) => {
                    const tone = toneColors(colors, STATUS_TONE[n.status]);
                    const active = n.topic_id === selected?.topic_id;
                    return (
                      <Pressable
                        key={n.topic_id}
                        accessibilityRole="button"
                        accessibilityLabel={`${n.title}, ${STATUS_LABEL[n.status]}`}
                        onPress={() => setSelectedId(n.topic_id)}
                        style={{
                          position: 'absolute',
                          left: n.x,
                          top: n.y,
                          width: NODE_W,
                          height: NODE_H,
                          padding: 10,
                          justifyContent: 'center',
                          gap: 2,
                          borderRadius: radius.lg,
                          borderWidth: active ? 2 : 1.5,
                          borderStyle: n.status === 'unseen' ? 'dashed' : 'solid',
                          borderColor: active ? colors.accent : tone.bar,
                          backgroundColor: colors.card,
                        }}
                      >
                        <Text variant="bodyStrong" numberOfLines={1}>{n.title}</Text>
                        <Text variant="small" style={{ color: tone.fg }}>
                          {n.status === 'unseen' ? 'Not started' : `${STATUS_LABEL[n.status]} · ${n.mastery_score}%`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </Cell>

            <Cell span={7}>
              {selected ? (
                <>
                  <Text variant="eyebrow">Selected topic</Text>
                  <Text variant="h2">{selected.title}</Text>
                  <Row wrap>
                    <Chip label={STATUS_LABEL[selected.status]} tone={STATUS_TONE[selected.status]} icon={STATUS_ICON[selected.status]} />
                    {selected.status !== 'unseen' ? <Chip label={`${selected.mastery_score}%`} /> : null}
                    {selected.struggle_count > 0 ? <Chip label={`${selected.struggle_count} struggles`} tone="warn" /> : null}
                  </Row>
                  {selected.last_weakness_note ? <Text color="muted">{selected.last_weakness_note}</Text> : null}
                  {(() => {
                    const pre = g.edges.filter((e) => e.target_topic_id === selected.topic_id).map((e) => g.nodes.find((n) => n.topic_id === e.prerequisite_topic_id)).filter((n): n is GraphNode => !!n);
                    return pre.length ? (
                      <View style={{ gap: 6 }}>
                        <Text variant="eyebrow">Needs first</Text>
                        <Row wrap>
                          {pre.map((p) => (
                            <Chip key={p.topic_id} label={`${p.title} · ${p.mastery_score}%`} tone={STATUS_TONE[p.status]} />
                          ))}
                        </Row>
                      </View>
                    ) : null;
                  })()}
                  <Row wrap>
                    <Button label="Ask the AI tutor" icon="chat" onPress={() => router.push(`/student/tutor?topic=${selected.topic_id}` as never)} />
                    <Button label="Generate practice quiz" icon="bolt" variant="secondary" loading={busy} onPress={() => void quiz()} />
                  </Row>
                  {error ? <Text color="bad">{error}</Text> : null}
                </>
              ) : null}
            </Cell>

            <Cell span={5}>
              <Section title="What the AI remembers about you" />
              <List>
                {g.memory.map((m) => (
                  <View key={m.id} style={{ paddingVertical: 12, gap: 2 }}>
                    <Text variant="small" color={m.memory_type === 'strength' ? 'ok' : m.memory_type === 'learning_style' ? 'accent' : 'muted'}>{MEMORY_LABEL[m.memory_type]}</Text>
                    <Text>{m.memory_fact}</Text>
                  </View>
                ))}
              </List>
            </Cell>
          </Bento>
        )}
      </AsyncView>
    </Page>
  );
}
