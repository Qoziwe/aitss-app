import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { aiApi, lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { invalidateQuery, useQuery } from '@/api/useQuery';
import type { DownloadedBundle, ProvidersConfig, Role } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { AsyncView, Bento, Button, Cell, Icon, List, ListRow, Page, Row, Section, Segmented, Select, Stack, Text } from '@/components/ui';
import { LANGUAGES } from '@/constants';
import { getBundles, getQueue, removeBundle, syncQueue } from '@/offline/store';
import { KEYS, setItem } from '@/storage/storage';
import { radius, useTheme, type ThemeMode } from '@/theme';
import { shortDate } from '@/utils/format';

function ThemeCell() {
  const { mode, setMode } = useTheme();
  return (
    <Cell span={6}>
      <Section title="Theme" subtitle="Appearance" />
      <Segmented<ThemeMode>
        options={[
          { value: 'light', label: 'Light', icon: 'sun' },
          { value: 'dark', label: 'Dark', icon: 'moon' },
          { value: 'system', label: 'System', icon: 'auto' },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Text variant="small" color="muted">System follows your device. The choice is saved on this device.</Text>
    </Cell>
  );
}

function LanguageCell({ title }: { title: string }) {
  const { user, updateUser } = useAuth();
  const [value, setValue] = useState(user?.preferred_language ?? 'en');
  const [error, setError] = useState<string | null>(null);

  const change = async (next: string) => {
    setValue(next);
    setError(null);
    await setItem(KEYS.language, next);
    try {
      const res = await lmsApi.updateProfile({ preferred_language: next });
      updateUser(res.user);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Cell span={6}>
      <Section title={title} subtitle="Language" />
      <Select label="Language" value={value} options={LANGUAGES} onChange={(v) => void change(v)} />
      {error ? <Text color="bad">{error}</Text> : null}
    </Cell>
  );
}

function OfflineCell() {
  const [bundles, setBundles] = useState<DownloadedBundle[]>([]);
  const [queue, setQueue] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setBundles(await getBundles());
    setQueue((await getQueue()).length);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sync = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await syncQueue();
      invalidateQuery('student.homework');
      invalidateQuery('student.dashboard');
      invalidateQuery('student.graph');
      setMessage({ ok: true, text: r.synced ? `${r.synced} answer sheet(s) sent and checked.` : 'Nothing to send.' });
      await load();
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Cell span={12}>
      <Section
        title="Downloaded lessons"
        subtitle="Offline learning"
        right={<Button label={queue ? `Sync (${queue} waiting)` : 'Sync'} icon="sync" variant="secondary" size="sm" loading={busy} onPress={() => void sync()} />}
      />
      {bundles.length === 0 ? <Text color="muted">No lessons yet. Open a topic in Subjects and tap "Download for offline".</Text> : null}
      <List>
        {bundles.map((b) => (
          <ListRow
            key={b.topic.id}
            title={b.topic.title}
            subtitle={`${b.subject_title} · Lecture notes + ${b.tasks.length} task(s) · ${shortDate(b.downloaded_at)}`}
            right={<Button label="Remove" variant="ghost" size="sm" onPress={async () => { await removeBundle(b.topic.id); await load(); }} />}
          />
        ))}
      </List>
      {message ? <Text color={message.ok ? 'ok' : 'bad'}>{message.text}</Text> : null}
    </Cell>
  );
}

function ProviderCell() {
  const { colors } = useTheme();
  const query = useQuery<ProvidersConfig>('ai.providers', aiApi.providers);
  const [error, setError] = useState<string | null>(null);

  return (
    <Cell span={12}>
      <Section title="Which model answers your students" subtitle="AI provider" />
      <AsyncView query={query}>
        {(cfg) => (
          <Stack gap={12}>
            <Row wrap gap={12} align="stretch">
              {cfg.available.map((p) => {
                const active = p.key === cfg.active;
                return (
                  <Pressable
                    key={p.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={async () => {
                      setError(null);
                      query.mutate({ ...cfg, active: p.key });
                      try {
                        query.mutate(await aiApi.setProvider(p.key));
                      } catch (e) {
                        query.mutate(cfg);
                        setError(errorMessage(e));
                      }
                    }}
                    style={{ flexGrow: 1, flexBasis: 220, gap: 6, padding: 18, borderRadius: radius.lg, borderWidth: active ? 2 : 1, borderColor: active ? colors.accent : colors.line, backgroundColor: active ? colors.accentSoft : colors.card }}
                  >
                    <Row justify="space-between">
                      <Row gap={8}>
                        <Icon name="cpu" size={18} color={active ? colors.accent : colors.muted} />
                        <Text variant="bodyStrong">{p.title}</Text>
                      </Row>
                      {active ? <Icon name="check" size={18} color={colors.accent} /> : null}
                    </Row>
                    <Text variant="small" color="muted">{p.subtitle}</Text>
                  </Pressable>
                );
              })}
            </Row>
            {error ? <Text color="bad">{error}</Text> : null}
          </Stack>
        )}
      </AsyncView>
    </Cell>
  );
}

export function SettingsScreen({ role }: { role: Role }) {
  return (
    <Page title={role === 'student' ? 'Settings & Offline' : 'Settings'}>
      <Bento>
        <ThemeCell />
        <LanguageCell title={role === 'student' ? 'Learning language' : 'Interface language'} />
        {role === 'student' ? <OfflineCell /> : <ProviderCell />}
      </Bento>
    </Page>
  );
}
