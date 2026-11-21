import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { useQuery } from '@/api/useQuery';
import type { SubjectsResponse, TopicItem } from '@/api/types';
import { AsyncView, Bento, Button, Card, Cell, Chip, List, ListRow, Markdown, Page, Row, Section, Text } from '@/components/ui';
import { downloadBundle, getBundles, removeBundle } from '@/offline/store';
import { STATUS_LABEL, STATUS_TONE } from '@/utils/mastery';

const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

export default function SubjectsScreen() {
  const query = useQuery<SubjectsResponse>('subjects', lmsApi.subjects);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void getBundles().then((b) => setDownloaded(b.map((x) => x.topic.id)));
  }, []);

  return (
    <Page title="My Subjects">
      <AsyncView query={query}>
        {(data) => {
          const subject = data.subjects.find((s) => s.id === subjectId) ?? data.subjects[0];
          if (!subject) return <Text color="muted">No subjects yet.</Text>;
          const topic: TopicItem | undefined = subject.topics.find((t) => t.id === topicId) ?? subject.topics.find((t) => t.status !== 'mastered') ?? subject.topics[0];
          const weakPre = topic?.prerequisites.filter((p) => p.status !== 'mastered').sort((a, b) => a.mastery_score - b.mastery_score)[0];
          const isDownloaded = !!topic && downloaded.includes(topic.id);

          const toggleDownload = async () => {
            if (!topic) return;
            setBusy(true);
            setNote(null);
            try {
              if (isDownloaded) {
                await removeBundle(topic.id);
                setDownloaded((d) => d.filter((x) => x !== topic.id));
              } else {
                await downloadBundle(topic.id);
                setDownloaded((d) => [...d, topic.id]);
              }
            } catch (e) {
              setNote(errorMessage(e));
            } finally {
              setBusy(false);
            }
          };

          return (
            <View style={{ gap: 24 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {data.subjects.map((s) => (
                  <Button
                    key={s.id}
                    label={s.title}
                    variant="secondary"
                    selected={s.id === subject.id}
                    onPress={() => {
                      setSubjectId(s.id);
                      setTopicId(null);
                    }}
                  />
                ))}
              </ScrollView>

              <Bento>
                <Cell span={5}>
                  <Section title={subject.title} subtitle={`${subject.topics.length} topics · ${subject.progress}% mastered`} />
                  <List>
                    {subject.topics.map((t, idx) => (
                      <ListRow
                        key={t.id}
                        title={`${idx + 1}. ${t.title}`}
                        subtitle={LEVEL_LABEL[t.difficulty_level]}
                        selected={t.id === topic?.id}
                        onPress={() => setTopicId(t.id)}
                        right={<Chip label={STATUS_LABEL[t.status]} tone={STATUS_TONE[t.status]} />}
                      />
                    ))}
                  </List>
                </Cell>

                <Cell span={7}>
                  {topic ? (
                    <>
                      <Text variant="eyebrow">Lecture notes{topic.teacher_name ? ` · ${topic.teacher_name}` : ''}</Text>
                      <Text variant="title">{topic.title}</Text>
                      <Row wrap>
                        <Chip label={`${STATUS_LABEL[topic.status]}${topic.status === 'unseen' ? '' : ` · ${topic.mastery_score}%`}`} tone={STATUS_TONE[topic.status]} />
                        <Chip label={LEVEL_LABEL[topic.difficulty_level]} />
                        {isDownloaded ? <Chip label="Available offline" tone="ok" icon="down" /> : null}
                      </Row>
                      {weakPre ? (
                        <Card tone="warn" padded>
                          <Text variant="bodyStrong">Weak prerequisite: {weakPre.title}</Text>
                          <Text color="muted">Your AI tutor will start with this topic before going further.</Text>
                        </Card>
                      ) : null}
                      <Markdown source={topic.lecture_notes_markdown} />
                      <Row wrap>
                        <Button label="Ask the AI tutor" icon="chat" onPress={() => router.push(`/student/tutor?topic=${topic.id}` as never)} />
                        <Button label={isDownloaded ? 'Remove download' : 'Download for offline'} icon="down" variant="secondary" loading={busy} onPress={() => void toggleDownload()} />
                      </Row>
                      {note ? <Text color="bad">{note}</Text> : null}
                    </>
                  ) : null}
                </Cell>
              </Bento>
            </View>
          );
        }}
      </AsyncView>
    </Page>
  );
}
