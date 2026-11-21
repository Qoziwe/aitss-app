import React, { useState } from 'react';
import { View } from 'react-native';
import { lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { QuestionDraft, TaskType, TeacherTask } from '@/api/types';
import { Button, Card, Chip, Divider, List, Row, Section, Segmented, Text, TextField, Toggle } from '@/components/ui';
import { shortDate } from '@/utils/format';

function TaskEditor({ task, onSaved, onCancel }: { task: TeacherTask; onSaved: (t: TeacherTask) => void; onCancel: () => void }) {
  const [drafts, setDrafts] = useState<QuestionDraft[]>(task.questions.map((q) => ({ prompt: q.prompt, answer: q.answer })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (i: number, key: keyof QuestionDraft, v: string) => setDrafts((d) => d.map((q, k) => (k === i ? { ...q, [key]: v } : q)));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await lmsApi.updateTask(task.id, { questions: drafts }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      {drafts.map((q, i) => (
        <View key={i} style={{ gap: 8 }}>
          <Row justify="space-between">
            <Text variant="label" color="muted">Question {i + 1}</Text>
            {drafts.length > 1 ? <Button label="Remove" variant="ghost" size="sm" onPress={() => setDrafts((d) => d.filter((_, k) => k !== i))} /> : null}
          </Row>
          <TextField value={q.prompt} onChangeText={(v) => set(i, 'prompt', v)} placeholder="Question" autoCapitalize="sentences" />
          <TextField value={q.answer} onChangeText={(v) => set(i, 'answer', v)} placeholder="Right answer" />
        </View>
      ))}
      <Button label="Add question" icon="plus" variant="secondary" size="sm" onPress={() => setDrafts((d) => [...d, { prompt: '', answer: '' }])} />
      {error ? <Text color="bad">{error}</Text> : null}
      <Row wrap>
        <Button label="Save" icon="check" loading={busy} onPress={() => void save()} />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </Row>
    </View>
  );
}

type Props = {
  tasks: TeacherTask[];
  groupId: number;
  topicId: number;
  selectedTaskId: number | null;
  onSelectTask: (id: number) => void;
  onTaskSaved: (t: TeacherTask) => void;
  onCreated: () => Promise<void>;
};

export function HomeworkPanel({ tasks, groupId, topicId, selectedTaskId, onSelectTask, onTaskSaved, onCreated }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('homework');
  const [generate, setGenerate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      await lmsApi.createTask(topicId, { group_id: groupId, title: title.trim(), type, generate_with_ai: generate });
      setTitle('');
      setAdding(false);
      await onCreated();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 20 }}>
      <Section
        title="Homework for this lesson"
        subtitle="Students in the group see it right away."
        right={!adding ? <Button label="Add homework" icon="plus" size="sm" onPress={() => setAdding(true)} /> : undefined}
      />

      {adding ? (
        <Card tone="fill">
          <TextField label="Title" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
          <Segmented<TaskType>
            options={[
              { value: 'homework', label: 'Homework' },
              { value: 'quiz', label: 'Quiz' },
            ]}
            value={type}
            onChange={setType}
          />
          <Row justify="space-between">
            <Text>Write the questions with AI</Text>
            <Toggle label="Write the questions with AI" value={generate} onChange={setGenerate} />
          </Row>
          {error ? <Text color="bad">{error}</Text> : null}
          <Row wrap>
            <Button label="Send to the group" icon="send" loading={busy} onPress={() => void create()} />
            <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} />
          </Row>
        </Card>
      ) : null}

      {tasks.length === 0 && !adding ? <Text color="muted">No homework for this lesson yet.</Text> : null}

      <List>
        {tasks.map((t) => (
          <View key={t.id} style={{ paddingVertical: 18, gap: 12 }}>
            <Row justify="space-between" wrap>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{t.title}</Text>
                <Text variant="small" color="muted">Posted {shortDate(t.posted_at)} · {t.questions.length} questions</Text>
              </View>
              <Chip label={t.type === 'quiz' ? 'Quiz' : 'Homework'} />
            </Row>

            {editingId === t.id ? (
              <TaskEditor
                task={t}
                onSaved={(next) => {
                  onTaskSaved(next);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <View style={{ gap: 8 }}>
                  {t.questions.map((q, i) => (
                    <View key={q.id} style={{ gap: 2 }}>
                      <Text>{i + 1}. {q.prompt}</Text>
                      <Text variant="small" color="muted">Answer: {q.answer || '—'}</Text>
                    </View>
                  ))}
                </View>
                <Divider />
                <Row wrap>
                  <Button label="Change with AI" icon="bolt" size="sm" variant="secondary" selected={selectedTaskId === t.id} onPress={() => onSelectTask(t.id)} />
                  <Button label="Edit questions" size="sm" variant="ghost" onPress={() => setEditingId(t.id)} />
                </Row>
              </>
            )}
          </View>
        ))}
      </List>
    </View>
  );
}
