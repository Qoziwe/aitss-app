# AITSS app (Expo: iOS, Android, Web)

One TypeScript codebase for the student and teacher apps.
UI follows the approved design (bento cards, light and dark theme). English interface.

## Setup

1. Create a clean Expo project:

   ```bash
   npx create-expo-app@latest aitss-app --template blank-typescript
   cd aitss-app
   ```

2. Copy `app/`, `src/`, `docs/`, `app.json`, `tsconfig.json`, `.env.example` from this archive into the project (overwrite).
   Delete `App.tsx` and `index.ts` created by the template.

3. Install dependencies (`expo install` picks versions that match your Expo SDK):

   ```bash
   npx expo install expo-router expo-linking expo-constants expo-status-bar \
     react-native-safe-area-context react-native-screens react-native-svg \
     react-native-web react-dom @expo/metro-runtime \
     @react-native-async-storage/async-storage expo-font expo-clipboard \
     @expo-google-fonts/inter @expo-google-fonts/space-grotesk
   ```

4. In `package.json` set the entry point:

   ```json
   "main": "expo-router/entry"
   ```

5. Copy `.env.example` to `.env`.

6. Run:

   ```bash
   npx expo start
   ```

   Press `w` for web, or scan the QR code with Expo Go.

## Try it without a backend

`EXPO_PUBLIC_USE_MOCK=true` (default) uses the built-in mock server with sample data.

- Sign in with any email and password. An email that contains `teacher` opens the teacher side, anything else opens the student side.
- Or press "Get started" and create an account as Student or Teacher.
- Theme switch: Settings (not in the header).
- Offline lessons: Subjects -> a topic -> "Download for offline". Settings shows them and has "Sync".

## Connect your backend

1. Set `EXPO_PUBLIC_USE_MOCK=false` and `EXPO_PUBLIC_API_URL=http://<your-host>:<port>` in `.env`.
2. Build the endpoints from `docs/BACKEND_API.md`. It lists every screen, endpoint and field.
3. Types are in `src/api/types.ts`, calls in `src/api/endpoints.ts`. `src/api/mock/server.ts` shows the exact response shapes.

Screens never call `fetch`. They call `lmsApi` / `aiApi` through `useQuery`, so the UI does not change when the backend appears.

## Structure

```
app/                  Routes (expo-router). One file = one screen.
  index.tsx           Landing
  auth.tsx            Sign in / Sign up (Student or Teacher)
  student/            dashboard, subjects, tutor, graph, homework, profile, settings
  teacher/            dashboard, groups/[id], profile, settings
src/
  theme/              Tokens, ThemeProvider (light / dark / system), useThemedStyles
  components/ui/      UI kit: Text, Card, Bento/Cell, Button, Chip, Bar, Icon, TextField, Select, ...
  components/         AppShell (side menu / bottom tabs), RoleLayout (role guard)
  screens/            Profile and Settings (shared by both roles)
  api/                types, client, endpoints, useQuery, mock server
  auth/               AuthProvider (session on the device)
  offline/            Saved lessons and the sync queue
  storage/            AsyncStorage wrapper
docs/BACKEND_API.md   Backend contract
```

## Rules

- Colors, spacing, radius and fonts come only from `src/theme`. No hardcoded colors in screens.
- Styles: `useThemedStyles((c) => ({ ... }))` or `useTheme().colors`.
- Import with the `@/` alias: `import { useTheme } from '@/theme'`.
- Only React Native components. No HTML tags and no CSS files, so the same code runs on web and phone.
- Layout switches at 900 px: side menu on wide screens, bottom tabs on phones. Tiles use a 12-column grid and stack below 600 px.
