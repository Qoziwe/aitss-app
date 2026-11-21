import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { invalidateQuery, useQuery } from '@/api/useQuery';
import type { CalendarResponse, Consultation } from '@/api/types';
import { AsyncView, Bento, Button, Cell, Chip, List, Page, Row, Section, Text } from '@/components/ui';
import { radius, useTheme } from '@/theme';
import { WEEK_HEADER, addMonths, dayLabel, monthKey, monthLabel, monthMatrix, sameDay, timeRange } from '@/utils/calendar';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = monthKey(month);
  const query = useQuery<CalendarResponse>(`teacher.calendar.${key}`, () => lmsApi.teacherCalendar(key));

  const cancel = async (c: Consultation) => {
    setBusyId(c.id);
    setError(null);
    try {
      await lmsApi.cancelConsultation(c.id);
      invalidateQuery('teacher.dashboard');
      await query.refetch();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const weeks = monthMatrix(month);

  return (
    <Page title="Calendar" subtitle="Consultations with students. New meetings appear here when you set a time.">
      <AsyncView query={query}>
        {(data) => {
          const forDay = (d: Date) => data.consultations.filter((c) => sameDay(new Date(c.starts_at), d));
          const dayList = forDay(selected);
          return (
            <Bento>
              <Cell span={7}>
                <Row justify="space-between">
                  <Text variant="h3">{monthLabel(month)}</Text>
                  <Row gap={8}>
                    <Button label="Prev" variant="secondary" size="sm" onPress={() => setMonth(addMonths(month, -1))} />
                    <Button label="Today" variant="ghost" size="sm" onPress={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }} />
                    <Button label="Next" variant="secondary" size="sm" onPress={() => setMonth(addMonths(month, 1))} />
                  </Row>
                </Row>

                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {WEEK_HEADER.map((w) => (
                      <View key={w} style={{ flex: 1, alignItems: 'center' }}>
                        <Text variant="small" color="muted">{w}</Text>
                      </View>
                    ))}
                  </View>
                  {weeks.map((week, wi) => (
                    <View key={wi} style={{ flexDirection: 'row', gap: 6 }}>
                      {week.map((d, di) => {
                        if (!d) return <View key={di} style={{ flex: 1, height: 56 }} />;
                        const count = forDay(d).length;
                        const isSel = sameDay(d, selected);
                        const isToday = sameDay(d, today);
                        return (
                          <Pressable
                            key={di}
                            accessibilityRole="button"
                            accessibilityLabel={`${dayLabel(d)}, ${count} meetings`}
                            accessibilityState={{ selected: isSel }}
                            onPress={() => setSelected(d)}
                            style={{
                              flex: 1,
                              height: 56,
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              borderRadius: radius.md,
                              borderWidth: isSel || isToday ? 1.5 : 1,
                              borderColor: isSel ? colors.accent : isToday ? colors.muted : colors.line,
                              backgroundColor: isSel ? colors.accentSoft : colors.card,
                            }}
                          >
                            <Text variant={isSel || isToday ? 'bodyStrong' : 'body'} color={isSel ? 'accent' : 'text'}>{d.getDate()}</Text>
                            <View style={{ flexDirection: 'row', gap: 3, height: 6 }}>
                              {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                                <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
                              ))}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </Cell>

              <Cell span={5}>
                <Section title={dayLabel(selected)} subtitle={dayList.length ? `${dayList.length} ${dayList.length === 1 ? 'meeting' : 'meetings'}` : undefined} />
                {dayList.length === 0 ? <Text color="muted">No meetings this day. Set times from the escalation queue on the dashboard.</Text> : null}
                <List>
                  {dayList.map((c) => (
                    <View key={c.id} style={{ paddingVertical: 14, gap: 6 }}>
                      <Row justify="space-between">
                        <Text variant="bodyStrong">{timeRange(c.starts_at, c.duration_min)}</Text>
                        <Chip label={c.group_name} />
                      </Row>
                      <Text>{c.student_name} · {c.topic_title}</Text>
                      <Text variant="small" color="muted">{c.place}</Text>
                      {c.note ? <Text variant="small" color="muted">{c.note}</Text> : null}
                      <Button label="Cancel meeting" variant="ghost" size="sm" loading={busyId === c.id} onPress={() => void cancel(c)} />
                    </View>
                  ))}
                </List>
                {error ? <Text color="bad">{error}</Text> : null}
              </Cell>
            </Bento>
          );
        }}
      </AsyncView>
    </Page>
  );
}
