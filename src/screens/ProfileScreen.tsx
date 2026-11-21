import React, { useState } from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { lmsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { useQuery } from '@/api/useQuery';
import type { LearningLevel, ProfileResponse, Role, User } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { AsyncView, Avatar, Bar, Bento, Button, Cell, Chip, Divider, List, Page, Row, Section, Select, Text, TextField } from '@/components/ui';
import { LANGUAGES, LEVELS } from '@/constants';
import { KEYS, setItem } from '@/storage/storage';

const COUNTRIES = ['Malaysia', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Other'];

function ProfileForm({ profile, role, onSaved }: { profile: ProfileResponse; role: Role; onSaved: (p: ProfileResponse) => void }) {
  const { updateUser } = useAuth();
  const u = profile.user;
  const [fullName, setFullName] = useState(u.full_name);
  const [email, setEmail] = useState(u.email);
  const [country, setCountry] = useState(u.country || 'Malaysia');
  const [language, setLanguage] = useState(u.preferred_language);
  const [school, setSchool] = useState(u.school_name ?? '');
  const [level, setLevel] = useState<LearningLevel>(u.learning_level);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const countryOptions = (COUNTRIES.includes(country) ? COUNTRIES : [country, ...COUNTRIES]).map((c) => ({ value: c, label: c }));

  const reset = () => {
    setFullName(u.full_name);
    setEmail(u.email);
    setCountry(u.country || 'Malaysia');
    setLanguage(u.preferred_language);
    setSchool(u.school_name ?? '');
    setLevel(u.learning_level);
    setMessage(null);
  };

  const save = async () => {
    if (!fullName.trim() || !email.trim()) return setMessage({ ok: false, text: 'Name and email are required.' });
    setBusy(true);
    setMessage(null);
    try {
      const res = await lmsApi.updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        country,
        school_name: school.trim() || null,
        preferred_language: language,
        ...(role === 'student' ? { learning_level: level } : {}),
      });
      updateUser(res.user as User);
      await setItem(KEYS.language, language);
      onSaved(res);
      setMessage({ ok: true, text: 'Saved.' });
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TextField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Select label="Country" value={country} options={countryOptions} onChange={setCountry} />
      <Select label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
      <TextField label="School" value={school} onChangeText={setSchool} autoCapitalize="words" />
      {role === 'student' ? <Select label="Learning level" value={level} options={LEVELS} onChange={(v) => setLevel(v as LearningLevel)} /> : null}
      {message ? <Text color={message.ok ? 'ok' : 'bad'}>{message.text}</Text> : null}
      <Row wrap>
        <Button label="Save changes" loading={busy} onPress={() => void save()} />
        <Button label="Cancel" variant="secondary" onPress={reset} />
      </Row>
    </>
  );
}

function PasswordForm() {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const change = async () => {
    if (value.length < 6) return setMessage({ ok: false, text: 'Password must have at least 6 characters.' });
    setBusy(true);
    setMessage(null);
    try {
      await lmsApi.changePassword({ new_password: value });
      setValue('');
      setMessage({ ok: true, text: 'Password changed.' });
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Section title="Password" />
      <TextField label="New password" value={value} onChangeText={setValue} secureTextEntry />
      {message ? <Text color={message.ok ? 'ok' : 'bad'}>{message.text}</Text> : null}
      <Button label="Change password" variant="secondary" loading={busy} onPress={() => void change()} />
    </>
  );
}

function JoinGroup({ onJoined }: { onJoined: (p: ProfileResponse) => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const join = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await lmsApi.joinGroup({ invite_code: code.trim() });
      onJoined(res);
      setCode('');
      setMessage({ ok: true, text: 'You joined the group.' });
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TextField label="Invite code" value={code} onChangeText={setCode} placeholder="For example M101-4F9Q" autoCapitalize="characters" />
      {message ? <Text color={message.ok ? 'ok' : 'bad'}>{message.text}</Text> : null}
      <Button label="Join a group" icon="plus" variant="secondary" disabled={code.trim().length < 4} loading={busy} onPress={() => void join()} />
    </>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      label={copied ? 'Copied' : code}
      variant="secondary"
      size="sm"
      onPress={async () => {
        await Clipboard.setStringAsync(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    />
  );
}

export function ProfileScreen({ role }: { role: Role }) {
  const { logout } = useAuth();
  const query = useQuery<ProfileResponse>(`profile.${role}`, lmsApi.profile);

  const signOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <Page title="Profile" right={<Button label="Log out" variant="secondary" size="sm" icon="logout" onPress={() => void signOut()} />}>
      <AsyncView query={query}>
        {(p) => (
          <Bento>
            <Cell span={12}>
              <Row gap={16}>
                <Avatar name={p.user.full_name} size={64} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text variant="title">{p.user.full_name}</Text>
                  <Row wrap gap={8}>
                    <Chip label={role === 'student' ? 'Student' : 'Teacher'} tone="accent" />
                    {role === 'student' && p.groups[0] ? <Chip label={p.groups[0].name} /> : null}
                    {role === 'student' ? <Chip label={LEVELS.find((l) => l.value === p.user.learning_level)?.label ?? ''} /> : null}
                    {p.user.school_name ? <Chip label={p.user.school_name} /> : null}
                  </Row>
                </View>
              </Row>
            </Cell>

            <Cell span={7}>
              <Section title="Personal details" />
              <ProfileForm profile={p} role={role} onSaved={(next) => query.mutate(next)} />
              <Divider />
              <PasswordForm />
            </Cell>

            <Cell span={5}>
              {role === 'student' && p.student_stats ? (
                <>
                  <Section title="My progress" />
                  <Row justify="space-between">
                    <Text color="muted">Topics mastered</Text>
                    <Text variant="bodyStrong">{p.student_stats.topics_mastered} of {p.student_stats.topics_total}</Text>
                  </Row>
                  <Bar value={(p.student_stats.topics_mastered / Math.max(1, p.student_stats.topics_total)) * 100} tone="ok" />
                  <Row justify="space-between">
                    <Text color="muted">Homework checked</Text>
                    <Text variant="bodyStrong">{p.student_stats.homework_checked}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text color="muted">Tutor sessions</Text>
                    <Text variant="bodyStrong">{p.student_stats.tutor_sessions}</Text>
                  </Row>
                </>
              ) : null}
              {role === 'teacher' && p.teacher_stats ? (
                <>
                  <Section title="My work" />
                  <Row justify="space-between">
                    <Text color="muted">Students</Text>
                    <Text variant="bodyStrong">{p.teacher_stats.students}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text color="muted">Homework checked by AI</Text>
                    <Text variant="bodyStrong">{p.teacher_stats.homework_checked}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text color="muted">Waiting for you</Text>
                    <Text variant="bodyStrong">{p.teacher_stats.escalations_pending}</Text>
                  </Row>
                </>
              ) : null}
              <Divider />
              <Section title={role === 'student' ? 'My groups' : 'My study groups'} />
              <List>
                {p.groups.map((g) => (
                  <View key={g.id} style={{ paddingVertical: 12 }}>
                    <Row justify="space-between">
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{g.name}</Text>
                        <Text variant="small" color="muted">
                          {g.subject}{g.teacher_name ? ` · ${g.teacher_name}` : ''}{g.students_count ? ` · ${g.students_count} students` : ''}
                        </Text>
                      </View>
                      {role === 'teacher' && g.invite_code ? <CopyCode code={g.invite_code} /> : null}
                    </Row>
                  </View>
                ))}
              </List>
              {role === 'student' ? <JoinGroup onJoined={(next) => query.mutate(next)} /> : <Text variant="small" color="muted">Tap an invite code to copy it. Students use it to join your group.</Text>}
            </Cell>
          </Bento>
        )}
      </AsyncView>
    </Page>
  );
}
