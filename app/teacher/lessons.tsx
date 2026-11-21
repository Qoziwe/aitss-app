import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { invalidateQuery, invalidatePrefix, useQuery } from '@/api/useQuery';
import type { GroupLessonsResponse, LessonDetail, QuestionDraft, TeacherDashboard, TeacherTask } from '@/api/types';
import { AsyncView, Bento, Button, Cell, Markdown, Page, Row, Section, Segmented, Select, Text, TextField } from '@/components/ui';
import { AiAssistant, type AssistantTarget } from '@/screens/lessons/AiAssistant';
import { HomeworkPanel } from '@/screens/lessons/HomeworkPanel';

type Tab = 'notes' | 'homework';

function LessonEditor({ topicId, groupId }: { topicId: number; groupId: number }) {
  const lesson = useQuery<LessonDetail>(`teacher.lesson.${topicId}`, () => lmsApi.lesson(topicId));
  const [tab, setTab] = useState<Tab>('notes');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<number | null>(null);

  useEffect(() => {
    setEditing(false);
    setTaskId(null);
    setError(null);
  }, [topicId]);

  const afterChange = () => {
    // Students read the same lesson: refresh what they see.
    invalidateQuery('subjects');
    invalidateQuery('student.homework');
    invalidateQuery('student.dashboard');
  };

  const saveNotes = async (text: string) => {
    const next = await lmsApi.updateLesson(topicId, { lecture_notes_markdown: text });
    lesson.mutate(next);
    afterChange();
  };

  const saveQuestions = async (id: number, questions: QuestionDraft[]) => {
    const updated = await lmsApi.updateTask(id, { questions });
    patchTask(updated);
  };

  const patchTask = (updated: TeacherTask) => {
    lesson.mutate((prev) => (prev ? { ...prev, tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)) } : (prev as unknown as LessonDetail)));
    afterChange();
  };

  return (
    <AsyncView query={lesson}>
      {(l) => {
        const selectedTask = l.tasks.find((t) => t.id === taskId) ?? l.tasks[0] ?? null;
        const target: AssistantTarget = tab === 'notes' ? { kind: 'notes' } : { kind: 'homework', task: selectedTask };

        return (
          <>
            <Cell span={12}>
              <Row justify="space-between" wrap>
                <View style={{ gap: 2 }}>
                  <Text variant="eyebrow">{l.subject_title}</Text>
                  <Text variant="title">{l.title}</Text>
                </View>
                <View style={{ minWidth: 260 }}>
                  <Segmented<Tab>
                    options={[
                      { value: 'notes', label: 'Lecture notes', icon: 'book' },
                      { value: 'homework', label: 'Homework', icon: 'task' },
                    ]}
                    value={tab}
                    onChange={setTab}
                  />
                </View>
              </Row>

              {tab === 'notes' ? (
                <View style={{ gap: 16 }}>
                  {editing ? (
                    <>
                      <TextField value={draft} onChangeText={setDraft} multiline rows={12} autoCapitalize="sentences" />
                      <Text variant="small" color="muted">Use "## Heading", "1." or "-" lists, and a block that starts with ```example.</Text>
                      {error ? <Text color="bad">{error}</Text> : null}
                      <Row wrap>
                        <Button
                          label="Save"
                          icon="check"
                          loading={saving}
                          onPress={async () => {
                            setSaving(true);
                            setError(null);
                            try {
                              await saveNotes(draft);
                              setEditing(false);
                            } catch (e) {
                              setError(errorMessage(e));
                            } finally {
                              setSaving(false);
                            }
                          }}
                        />
                        <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
                      </Row>
                    </>
                  ) : (
                    <>
                      <Markdown source={l.lecture_notes_markdown} />
                      <Button
                        label="Edit manually"
                        variant="secondary"
                        size="sm"
                        onPress={() => {
                          setDraft(l.lecture_notes_markdown);
                          setEditing(true);
                        }}
                      />
                    </>
                  )}
                </View>
              ) : (
                <HomeworkPanel
                  tasks={l.tasks}
                  groupId={groupId}
                  topicId={topicId}
                  selectedTaskId={selectedTask?.id ?? null}
                  onSelectTask={setTaskId}
                  onTaskSaved={patchTask}
                  onCreated={async () => {
                    await lesson.refetch();
                    invalidatePrefix('teacher.lessons.');
                    afterChange();
                  }}
                />
              )}
            </Cell>

            <Cell span={12}>
              <AiAssistant topicId={topicId} target={target} onApplyNotes={saveNotes} onApplyQuestions={saveQuestions} />
            </Cell>
          </>
        );
      }}
    </AsyncView>
  );
}

function GroupLessons({ groupId }: { groupId: number }) {
  const query = useQuery<GroupLessonsResponse>(`teacher.lessons.${groupId}`, () => lmsApi.groupLessons(groupId));
  const [topicId, setTopicId] = useState<number | null>(null);

  return (
    <AsyncView query={query}>
      {(data) => {
        const current = data.lessons.find((l) => l.topic_id === topicId) ?? data.lessons[0];
        return (
          <Bento>
            <Cell span={12}>
              <Section title="Lesson" subtitle={`${data.group.subject} · ${data.group.name}`} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {data.lessons.map((l) => (
                  <Button
                    key={l.topic_id}
                    label={`${l.order_index}. ${l.title}`}
                    variant="secondary"
                    selected={l.topic_id === current?.topic_id}
                    onPress={() => setTopicId(l.topic_id)}
                  />
                ))}
              </ScrollView>
            </Cell>
            {current ? <LessonEditor topicId={current.topic_id} groupId={groupId} /> : null}
          </Bento>
        );
      }}
    </AsyncView>
  );
}

export default function LessonsScreen() {
  const dash = useQuery<TeacherDashboard>('teacher.dashboard', lmsApi.teacherDashboard);
  const [groupId, setGroupId] = useState<number | null>(null);

  return (
    <Page title="Lessons" subtitle="Edit lectures and homework. Ask the AI for changes and apply the ones you like.">
      <AsyncView query={dash}>
        {(d) => {
          const id = groupId ?? d.groups[0]?.id;
          if (id === undefined) return <Text color="muted">You have no groups yet.</Text>;
          return (
            <View style={{ gap: 24 }}>
              <View style={{ maxWidth: 360 }}>
                <Select label="Group" value={String(id)} options={d.groups.map((g) => ({ value: String(g.id), label: `${g.name} · ${g.subject}` }))} onChange={(v) => setGroupId(Number(v))} />
              </View>
              <GroupLessons groupId={id} />
            </View>
          );
        }}
      </AsyncView>
    </Page>
  );
}
