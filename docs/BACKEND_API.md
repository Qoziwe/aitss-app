# Backend contract

Everything the app sends and receives. Types live in `src/api/types.ts`, calls in `src/api/endpoints.ts`.
Base URL: `EXPO_PUBLIC_API_URL` + `/api/v1`. Two modules: **Flask** `/lms/*` and **FastAPI** `/ai/*`.

## Rules

- Auth: `Authorization: Bearer <token>` on every request except register and login.
- Body and response: JSON, `snake_case`. Dates are ISO 8601 strings.
- Errors: any non-2xx status with JSON `{ "message": "..." }` (`detail` and `error` also work). The app shows `message` to the user.
- `401` sends the user back to sign in. `403` means wrong role. Network failures are handled by the offline layer.
- Roles: `student` and `teacher` only.
- To switch from mock to real backend set `EXPO_PUBLIC_USE_MOCK=false`. No screen code changes.

## Screen -> endpoints

| Screen | Calls |
|---|---|
| Sign in / Sign up | `POST /lms/auth/login`, `POST /lms/auth/register` |
| Student home | `GET /lms/student/dashboard` |
| Subjects (+ notes) | `GET /lms/subjects`, `GET /lms/topics/:id/offline-bundle` (Download) |
| AI Tutor | `GET /lms/subjects` (topic list), `GET /lms/student/knowledge-graph` (memory), `POST /ai/tutor/session`, `POST /ai/tutor/chat`, `POST /ai/tutor/escalate` |
| Knowledge Graph | `GET /lms/student/knowledge-graph`, `POST /ai/quiz/generate` |
| Homework | `GET /lms/student/homework`, `POST /ai/homework/grade`, `POST /lms/offline/sync` |
| Student / Teacher profile | `GET /lms/profile`, `PATCH /lms/profile`, `POST /lms/profile/password`, `POST /lms/groups/join` (student) |
| Student settings | `PATCH /lms/profile` (language), `GET /lms/topics/:id/offline-bundle`, `POST /lms/offline/sync` |
| Teacher dashboard | `GET /lms/teacher/dashboard`, `POST /lms/teacher/escalations/:id/resolve` |
| Teacher group | `GET /lms/teacher/groups/:id`, `PATCH /lms/teacher/groups/:id` |
| Teacher settings | `PATCH /lms/profile` (language), `GET /ai/providers/config`, `POST /ai/providers/config` |

## Endpoints

Fields are given as TypeScript. `?` = optional.

### Auth

`POST /lms/auth/register`
```ts
{ role: 'student'|'teacher', full_name, email, password, country, school_name?, learning_level?, preferred_language }
-> { token: string, user: User }
```
`POST /lms/auth/login` `{ email, password } -> { token, user }`

`User = { id, full_name, email, role, country, school_name: string|null, learning_level: 'beginner'|'intermediate'|'advanced', preferred_language }`
(`users` table. For a teacher `school_name` is the school; for a student, school or study group.)

### Profile

- `GET /lms/profile -> { user, groups: ProfileGroup[], student_stats?, teacher_stats? }`
  - `ProfileGroup = { id, name, subject, teacher_name?, students_count?, invite_code? }` (`invite_code` only for teachers)
  - `student_stats = { topics_mastered, topics_total, homework_checked, tutor_sessions }`
  - `teacher_stats = { students, homework_checked, escalations_pending }`
- `PATCH /lms/profile` body: any of `full_name, email, country, school_name, learning_level, preferred_language` -> same as GET.
- `POST /lms/profile/password` `{ new_password } -> 204`
- `POST /lms/groups/join` `{ invite_code } -> same as GET /lms/profile`. `404` if the code is unknown. Student only.

### Student

`GET /lms/student/dashboard`
```ts
{
  ai_summary: string,                       // 1-2 sentences from the AI, built from the knowledge graph
  subjects: { id, title, mastered_topics, total_topics }[],
  weak_nodes: { topic_id, title, subject, mastery_score, status, note }[],   // up to 3, lowest score first
  pending_tasks: { id, title, subject, topic, type: 'homework'|'quiz', posted_at }[],
  active_escalation: EscalationTicket | null
}
```
`EscalationTicket = { id, teacher_name, group_name, topic_id, topic_title, attempts_with_ai, ai_diagnostic_summary, status: 'pending_teacher'|'resolved', created_at }` (`teacher_escalations` table)

`GET /lms/subjects -> { subjects: Subject[] }`
```ts
Subject = { id, title, slug, progress /*0-100*/, topics: TopicItem[] }
TopicItem = { id, title, order_index, difficulty_level, status, mastery_score, lecture_notes_markdown,
              teacher_name: string|null, prerequisites: { topic_id, title, status, mastery_score }[] }
```
`status` comes from `student_knowledge_graph` for the signed-in student: `unseen | learning | struggling | mastered`.
`prerequisites` come from `knowledge_graph_edges`. `lecture_notes_markdown` supports `#`, `##`, `1.` lists, `-` lists, `**bold**` and fenced blocks with the word `example`.

`GET /lms/student/knowledge-graph`
```ts
{
  subjects: { id, title }[],
  nodes: { topic_id, subject_id, title, mastery_score, status, struggle_count, last_weakness_note: string|null }[],
  edges: { prerequisite_topic_id, target_topic_id }[],
  memory: { id, subject_id: number|null, memory_type: 'weakness'|'misconception'|'learning_style'|'strength', memory_fact }[]   // student_ai_memory
}
```

`GET /lms/student/homework`
```ts
{ todo: TaskDetail[], checked: { id, title, subject, posted_at, score_percent }[] }
TaskDetail = { id, title, subject, topic_id, topic, type: 'homework'|'quiz', posted_at, questions: { id, prompt }[] }
```
Questions never include the right answer.

### Offline

`GET /lms/topics/:id/offline-bundle -> { topic: TopicItem, subject_title, tasks: TaskDetail[] }`
The app saves it on the device.

`POST /lms/offline/sync` `{ submissions: GradeBody[] } -> { synced: number, graph_updated: boolean }`
Same body as `/ai/homework/grade`, one item per saved sheet. The server grades each, updates the knowledge graph and skips tasks that were already submitted.

### AI tutor (FastAPI)

- `POST /ai/tutor/session` `{ topic_id } -> { session_id, greeting }`
- `POST /ai/tutor/chat` `{ session_id, topic_id, message } -> { reply, attempts, should_escalate, escalation?: EscalationTicket }`
  - `attempts` counts how many explanations the AI gave in this session (the UI shows 3 dots).
  - Rule from the product: at the 3rd failed explanation, set `should_escalate: true`, create the ticket and return it in `escalation`.
- `POST /ai/tutor/escalate` `{ session_id, topic_id } -> { reply, escalation: EscalationTicket }` (button "I still don't understand")
  - `ai_diagnostic_summary` must contain what the AI tried and the gap from the knowledge graph.
  - The AI must follow `study_groups.ai_teacher_instructions` of the student's group.

### Homework check (FastAPI)

`POST /ai/homework/grade`
```ts
{ task_id, answers: { question_id, steps, final_answer }[], completed_offline?: boolean }
-> {
  score_percent, correct_count, total, ai_feedback_summary,
  questions: { question_id, correct, feedback?, correction?: { wrong, right } }[],
  detected_weak_topics: { topic_id, title, note }[]
}
```
After grading the server updates `student_knowledge_graph` and `student_ai_memory`.

`POST /ai/quiz/generate` `{ topic_ids?: number[] } -> { task: TaskDetail }`
If `topic_ids` is empty, pick the student's weakest topics. The new task must then appear in `GET /lms/student/homework`.

### Teacher

`GET /lms/teacher/dashboard`
```ts
{
  summary: { students, homework_checked, questions_answered, hours_saved, escalations_pending },
  groups: { id, name, subject, students_count, homework_checked, questions_answered, current_topic_title, escalations_pending }[],
  escalations: { id, student_name, group_id, group_name, topic_title, attempts_with_ai, ai_diagnostic_summary }[]
}
```
`POST /lms/teacher/escalations/:id/resolve -> 204`

`GET /lms/teacher/groups/:id`
```ts
{
  id, name, subject, students_count, invite_code, ai_active, ai_teacher_instructions, current_topic_id,
  topics: { id, title }[],
  knowledge_map: { topic_id, title, mastered, learning, struggling, unseen }[],     // counts of students
  gradebook: { title, checked, total, rows: { student_id, name, score_percent: number|null, weakest_topic: string|null, state: 'checked'|'escalated'|'missing' }[] },
  common_mistakes: { text, count }[]
}
```
`PATCH /lms/teacher/groups/:id` (all fields optional, returns the same object as GET)
```ts
{ ai_teacher_instructions?, current_topic_id?, ai_active?,
  new_homework?: { title, topic_id, type: 'homework'|'quiz', generate_with_ai: boolean } }
```
`new_homework` creates a task for every student of the group.

### AI provider (teacher settings)

- `GET /ai/providers/config -> { active: 'gemini'|'openrouter'|'tokenrouter'|'ollama', available: { key, title, subtitle }[] }`
- `POST /ai/providers/config` `{ active } -> same as GET`. Teacher only.

## Endpoints that are new compared with the first draft

These did not exist in the original schema notes and are needed by the UI:

| Endpoint | Why |
|---|---|
| `GET/PATCH /lms/profile`, `POST /lms/profile/password` | Profile screens |
| `POST /lms/groups/join` | Student joins a group with an invite code |
| `GET /lms/student/homework` | Homework list (todo and checked) |
| `GET /lms/topics/:id/offline-bundle`, `POST /lms/offline/sync` | Offline lessons |
| `POST /ai/quiz/generate` | "Generate practice quiz" on the graph |
| `POST /ai/tutor/escalate` | Manual "I still don't understand" |
| `GET/POST /ai/providers/config` | AI provider switch in teacher settings |

## Database fields the UI depends on

- `users`: `full_name, email, role, country, school_name, learning_level, preferred_language`
- `study_groups`: `name, invite_code, ai_teacher_instructions, current_topic_id, ai_active` (the last one is new)
- `topics`: `lecture_notes_markdown, difficulty_level, order_index`
- Tasks table: `type` (`homework` or `quiz`), `topic_id`, `title`, plus a questions list (the UI needs `questions[]` with `id` and `prompt`)
- `teacher_escalations`: `attempts_with_ai, ai_diagnostic_summary, status`

## Mock mode

`src/api/mock/server.ts` answers every path above with sample data and a 250-500 ms delay.
Sign in with any email and password. An email containing `teacher` opens the teacher side.
Use it as a reference for the exact response shapes.
