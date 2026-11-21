import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import type { LearningLevel, Role } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Card, Icon, Segmented, Select, Stack, Text, TextField } from '@/components/ui';
import { LANGUAGES, LEVELS } from '@/constants';
import { KEYS, setItem } from '@/storage/storage';
import { spacing, useTheme } from '@/theme';

export default function AuthScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const { user, ready, login, register } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'login' | 'signup'>(modeParam === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<Role>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [school, setSchool] = useState('');
  const [level, setLevel] = useState<LearningLevel>('beginner');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return null;
  if (user) return <Redirect href={`/${user.role}/dashboard` as never} />;

  const signup = mode === 'signup';

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) return setError('Enter your email and password.');
    if (signup && !fullName.trim()) return setError('Enter your full name.');
    if (signup && password.length < 6) return setError('Password must have at least 6 characters.');
    setBusy(true);
    try {
      const u = signup
        ? await register({
            role,
            full_name: fullName.trim(),
            email: email.trim(),
            password,
            country: country.trim(),
            school_name: school.trim() || undefined,
            learning_level: role === 'student' ? level : undefined,
            preferred_language: language,
          })
        : await login({ email: email.trim(), password });
      if (signup) await setItem(KEYS.language, language);
      router.replace(`/${u.role}/dashboard` as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 440, gap: spacing.xl }}>
          <Pressable onPress={() => router.replace('/')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bolt" size={18} color={colors.onAccent} />
            </View>
            <Text variant="h2">AITSS</Text>
          </Pressable>

          <Stack gap={4}>
            <Text variant="title">{signup ? 'Create your account' : 'Welcome back'}</Text>
            <Text color="muted">{signup ? 'It takes less than a minute.' : 'Sign in to continue.'}</Text>
          </Stack>

          <Card>
            <Segmented
              options={[
                { value: 'login', label: 'Sign in' },
                { value: 'signup', label: 'Sign up' },
              ]}
              value={mode}
              onChange={(v) => {
                setMode(v);
                setError(null);
              }}
            />

            {signup ? (
              <Segmented
                options={[
                  { value: 'student', label: 'Student', icon: 'user' },
                  { value: 'teacher', label: 'Teacher', icon: 'users' },
                ]}
                value={role}
                onChange={setRole}
              />
            ) : null}

            {signup ? <TextField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" /> : null}
            <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={() => void submit()} />

            {signup ? (
              <>
                <TextField label="Country" value={country} onChangeText={setCountry} autoCapitalize="words" />
                <TextField label={role === 'student' ? 'School or study group' : 'School'} value={school} onChangeText={setSchool} autoCapitalize="words" />
                {role === 'student' ? <Select label="Your level" value={level} options={LEVELS} onChange={(v) => setLevel(v as LearningLevel)} /> : null}
                <Select label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
              </>
            ) : null}

            {error ? <Text color="bad">{error}</Text> : null}
            <Button label={signup ? 'Create account' : 'Sign in'} full loading={busy} onPress={() => void submit()} />
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
