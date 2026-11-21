import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { invalidatePrefix, useQuery } from '@/api/useQuery';
import type { ScheduleConsultationBody, TeacherDashboard } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { ScheduleForm } from '@/components/ScheduleForm';
import { AsyncView, Avatar, Bento, Button, Cell, Chip, List, ListRow, Page, Row, Section, StatStrip, Text } from '@/components/ui';
import { whenLabel } from '@/utils/calendar';
import { firstName, greeting, plural } from '@/utils/format';

const QUEUE_LIMIT = 3;

export default function TeacherDashboardScreen() {
  const { user } = useAuth();
  const query = useQuery<TeacherDashboard>('teacher.dashboard', lmsApi.teacherDashboard);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleBusy, setScheduleBusy] = useState(false);

  const schedule = async (id: number, body: ScheduleConsultationBody) => {
    setScheduleBusy(true);
    setScheduleError(null);
    try {
      const meeting = await lmsApi.scheduleConsultation(id, body);
      query.mutate((prev) => (prev ? { ...prev, escalations: prev.escalations.map((e) => (e.id === id ? { ...e, consultation: meeting } : e)) } : (prev as unknown as TeacherDashboard)));
      invalidatePrefix('teacher.calendar.');
      setSchedulingId(null);
    } catch (e) {
      setScheduleError(errorMessage(e));
    } finally {
      setScheduleBusy(false);
    }
  };

  const resolve = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await lmsApi.resolveEscalation(id);
      query.mutate((prev) =>
        prev
          ? {
              ...prev,
              summary: { ...prev.summary, escalations_pending: Math.max(0, prev.summary.escalations_pending - 1) },
              escalations: prev.escalations.filter((e) => e.id !== id),
              groups: prev.groups.map((g) => {
                const hit = prev.escalations.find((e) => e.id === id);
                return hit && hit.group_id === g.id ? { ...g, escalations_pending: Math.max(0, g.escalations_pending - 1) } : g;
              }),
            }
          : (prev as unknown as TeacherDashboard),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page
      title={`${greeting()}, ${firstName(user?.full_name ?? '')}`}
      subtitle={query.data ? `${query.data.groups.length} ${plural(query.data.groups.length, 'group', 'groups')} · ${query.data.summary.students} students` : undefined}
    >
      <AsyncView query={query}>
        {(d) => {
          const queue = showAll ? d.escalations : d.escalations.slice(0, QUEUE_LIMIT);
          const more = d.escalations.length - queue.length;
          return (
            <Bento>
              <Cell span={12}>
                <StatStrip
                  items={[
                    { label: 'Homework checked by AI', value: String(d.summary.homework_checked), hint: `of ${d.summary.students} students` },
                    { label: 'Questions answered by AI', value: String(d.groups.reduce((n, g) => n + g.questions_answered, 0)), hint: 'No teacher time needed' },
                    { label: 'Estimated time saved', value: `${d.summary.hours_saved} h`, hint: 'Grading and first-line help' },
                    { label: 'Need you in person', value: String(d.summary.escalations_pending), hint: `Out of ${d.summary.students} students`, color: d.summary.escalations_pending ? 'warn' : 'text' },
                  ]}
                />
              </Cell>

              <Cell span={7}>
                <Section title="Escalation queue" subtitle="Students who need a human teacher" />
                {d.escalations.length === 0 ? <Text color="muted">Queue is empty. Nobody is waiting for you.</Text> : null}
                <List>
                  {queue.map((e) => (
                    <View key={e.id} style={{ paddingVertical: 16, gap: 10 }}>
                      <Row>
                        <Avatar name={e.student_name} size={40} />
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyStrong">{e.student_name}</Text>
                          <Text variant="small" color="muted">{e.group_name} · {e.topic_title} · {e.attempts_with_ai} AI attempts</Text>
                        </View>
                      </Row>
                      <Text color="muted">{e.ai_diagnostic_summary}</Text>
                      {e.consultation ? <Chip label={whenLabel(e.consultation.starts_at, e.consultation.duration_min)} tone="accent" icon="calendar" /> : null}
                      {e.consultation ? <Text variant="small" color="muted">{e.consultation.place}</Text> : null}
                      {schedulingId === e.id ? (
                        <ScheduleForm
                          initial={e.consultation}
                          busy={scheduleBusy}
                          error={scheduleError}
                          onSubmit={(body) => void schedule(e.id, body)}
                          onCancel={() => setSchedulingId(null)}
                        />
                      ) : (
                        <Row wrap>
                          <Button
                            label={e.consultation ? 'Change time' : 'Set consultation time'}
                            icon="calendar"
                            size="sm"
                            variant={e.consultation ? 'secondary' : 'primary'}
                            onPress={() => {
                              setScheduleError(null);
                              setSchedulingId(e.id);
                            }}
                          />
                          <Button label="Mark as resolved" icon="check" variant="secondary" size="sm" loading={busyId === e.id} onPress={() => void resolve(e.id)} />
                        </Row>
                      )}
                    </View>
                  ))}
                </List>
                {more > 0 ? <Button label={`Show ${more} more`} variant="link" onPress={() => setShowAll(true)} /> : null}
                {showAll && d.escalations.length > QUEUE_LIMIT ? <Button label="Show less" variant="link" onPress={() => setShowAll(false)} /> : null}
                {error ? <Text color="bad">{error}</Text> : null}
              </Cell>

              <Cell span={5}>
                <Section title="My study groups" subtitle="Tap a group to manage it" />
                <List>
                  {d.groups.map((g) => (
                    <ListRow
                      key={g.id}
                      title={g.name}
                      subtitle={`${g.subject} · ${g.students_count} students · now: ${g.current_topic_title}`}
                      chevron
                      onPress={() => router.push(`/teacher/groups/${g.id}` as never)}
                      right={g.escalations_pending ? <Chip label={`${g.escalations_pending} waiting`} tone="warn" /> : undefined}
                    />
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
