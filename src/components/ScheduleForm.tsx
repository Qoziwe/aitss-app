import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Consultation, ScheduleConsultationBody } from '@/api/types';
import { Button, Row, Segmented, Text, TextField } from '@/components/ui';
import { TIME_SLOTS, dayLabel, slotLabel, timeLabel } from '@/utils/calendar';

type Props = {
  /** Fill the form from an existing meeting when rescheduling. */
  initial?: Consultation | null;
  busy: boolean;
  error: string | null;
  onSubmit: (body: ScheduleConsultationBody) => void;
  onCancel: () => void;
};

const DURATIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Pick a day, a time, a place. Uses only basic components, no date library. */
export function ScheduleForm({ initial, busy, error, onSubmit, onCancel }: Props) {
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  }, []);

  const initialStart = initial ? new Date(initial.starts_at) : null;
  const [day, setDay] = useState<Date | null>(initialStart ? startOfDay(initialStart) : null);
  const [slot, setSlot] = useState<string | null>(initial ? timeLabel(initial.starts_at) : null);
  const [duration, setDuration] = useState(String(initial?.duration_min ?? 30));
  const [place, setPlace] = useState(initial?.place ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

  const now = Date.now();
  const isFuture = (d: Date, [h, m]: [number, number]) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime() > now;
  const ready = !!day && !!slot && place.trim().length > 0;

  const submit = () => {
    if (!day || !slot) return;
    const [h, m] = slot.split(':').map(Number) as [number, number];
    onSubmit({
      starts_at: new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).toISOString(),
      duration_min: Number(duration),
      place: place.trim(),
      note: note.trim() || undefined,
    });
  };

  return (
    <View style={{ gap: 20, paddingTop: 4 }}>
      <View style={{ gap: 8 }}>
        <Text variant="label" color="muted">Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((d) => (
            <Button
              key={d.toISOString()}
              label={dayLabel(d).replace(',', '')}
              variant="secondary"
              size="sm"
              selected={!!day && d.getTime() === day.getTime()}
              onPress={() => {
                setDay(d);
                if (slot) {
                  const [h, m] = slot.split(':').map(Number) as [number, number];
                  if (!isFuture(d, [h, m])) setSlot(null);
                }
              }}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="label" color="muted">Time</Text>
        <Row wrap gap={8}>
          {TIME_SLOTS.map((t) => {
            const label = slotLabel(t);
            const disabled = !day || !isFuture(day, t);
            return <Button key={label} label={label} variant="secondary" size="sm" disabled={disabled} selected={slot === label} onPress={() => setSlot(label)} />;
          })}
        </Row>
        {!day ? <Text variant="small" color="muted">Choose a day first.</Text> : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="label" color="muted">Length</Text>
        <Segmented options={DURATIONS} value={duration} onChange={setDuration} />
      </View>

      <TextField label="Room or meeting link" value={place} onChangeText={setPlace} placeholder="For example: Room B2-14" autoCapitalize="sentences" />
      <TextField label="Note for the student (optional)" value={note} onChangeText={setNote} multiline rows={2} autoCapitalize="sentences" />

      {error ? <Text color="bad">{error}</Text> : null}
      <Row wrap>
        <Button label={initial ? 'Save new time' : 'Schedule'} icon="calendar" disabled={!ready} loading={busy} onPress={submit} />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </Row>
    </View>
  );
}
