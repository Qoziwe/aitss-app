import React, { useState } from 'react';
import { View } from 'react-native';
import { aiApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { QuestionDraft, ReviseLessonResponse, TeacherTask } from '@/api/types';
import { Button, Card, Chip, List, Markdown, Row, Section, Text, TextField } from '@/components/ui';

export type AssistantTarget = { kind: 'notes' } | { kind: 'homework'; task: TeacherTask | null };

type Props = {
  topicId: number;
  target: AssistantTarget;
  /** Called when the teacher accepts. The parent saves it. */
  onApplyNotes: (text: string) => Promise<void>;
  onApplyQuestions: (taskId: number, questions: QuestionDraft[]) => Promise<void>;
};

const NOTES_IDEAS = ['Make it simpler', 'Add one more example', 'Make it shorter'];
const HOMEWORK_IDEAS = ['Make the questions easier', 'Add two more questions', 'Add one harder question'];

/**
 * The AI only proposes. Nothing changes until the teacher taps Apply.
 */
export function AiAssistant({ topicId, target, onApplyNotes, onApplyQuestions }: Props) {
  const [instruction, setInstruction] = useState('');
  const [proposal, setProposal] = useState<ReviseLessonResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNotes = target.kind === 'notes';
  const task = target.kind === 'homework' ? target.task : null;
  const disabled = !isNotes && !task;
  const ideas = isNotes ? NOTES_IDEAS : HOMEWORK_IDEAS;
  const targetLabel = isNotes ? 'Lecture notes' : task ? `Homework: ${task.title}` : 'Homework';

  const ask = async () => {
    if (!instruction.trim() || disabled) return;
    setBusy(true);
    setError(null);
    setProposal(null);
    try {
      setProposal(
        await aiApi.reviseLesson({
          topic_id: topicId,
          target: isNotes ? 'notes' : 'homework',
          task_id: task?.id,
          instruction: instruction.trim(),
        }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!proposal) return;
    setApplying(true);
    setError(null);
    try {
      if (proposal.target === 'notes' && proposal.proposal_notes) await onApplyNotes(proposal.proposal_notes);
      if (proposal.target === 'homework' && proposal.proposal_questions && task) await onApplyQuestions(task.id, proposal.proposal_questions);
      setProposal(null);
      setInstruction('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setApplying(false);
    }
  };

  const oldPrompts = new Set((task?.questions ?? []).map((q) => q.prompt));

  return (
    <>
      <Section title="AI assistant" subtitle={`Changing: ${targetLabel}. The AI suggests, you decide.`} />
      {disabled ? <Text color="muted">Open a homework task and tap "Change with AI".</Text> : null}
      <Row wrap gap={8}>
        {ideas.map((i) => (
          <Button key={i} label={i} variant="secondary" size="sm" disabled={disabled} onPress={() => setInstruction(i)} />
        ))}
      </Row>
      <TextField
        label="What should change?"
        value={instruction}
        onChangeText={setInstruction}
        multiline
        rows={2}
        editable={!disabled}
        placeholder={isNotes ? 'For example: explain it for students who struggle with signs' : 'For example: add questions with negative numbers'}
        autoCapitalize="sentences"
      />
      <Button label="Suggest changes" icon="bolt" loading={busy} disabled={disabled || !instruction.trim()} onPress={() => void ask()} />
      {error ? <Text color="bad">{error}</Text> : null}

      {proposal ? (
        <Card tone="fill">
          <Chip label="Suggestion" tone="accent" icon="bolt" />
          <Text variant="bodyStrong">{proposal.summary}</Text>
          {proposal.proposal_notes ? <Markdown source={proposal.proposal_notes} /> : null}
          {proposal.proposal_questions ? (
            <List>
              {proposal.proposal_questions.map((q, i) => (
                <View key={i} style={{ paddingVertical: 12, gap: 4 }}>
                  <Row justify="space-between">
                    <Text variant="bodyStrong" style={{ flex: 1 }}>{i + 1}. {q.prompt}</Text>
                    {oldPrompts.has(q.prompt) ? null : <Chip label="New" tone="ok" />}
                  </Row>
                  <Text variant="small" color="muted">Answer: {q.answer || '—'}</Text>
                </View>
              ))}
            </List>
          ) : null}
          <Row wrap>
            <Button label="Apply" icon="check" loading={applying} onPress={() => void apply()} />
            <Button label="Discard" variant="ghost" onPress={() => setProposal(null)} />
          </Row>
        </Card>
      ) : null}
    </>
  );
}
