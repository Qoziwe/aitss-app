import { KEYS, getItem } from '@/storage/storage';
import { ApiError } from '../errors';
import type {
  AuthResponse,
  CreateTaskBody,
  GroupLessonsResponse,
  LessonDetail,
  QuestionDraft,
  ReviseLessonBody,
  ReviseLessonResponse,
  TeacherTask,
  UpdateLessonBody,
  UpdateTaskBody,
  CalendarResponse,
  CheckedTask,
  Consultation,
  ScheduleConsultationBody,
  EscalationTicket,
  GradeBody,
  GradeResponse,
  GroupDetail,
  HomeworkListResponse,
  KnowledgeGraphResponse,
  LoginBody,
  MasteryStatus,
  OfflineBundle,
  PatchGroupBody,
  ProfileResponse,
  ProvidersConfig,
  ProviderKey,
  QuestionResult,
  RegisterBody,
  Role,
  StudentDashboard,
  Subject,
  TaskDetail,
  TeacherDashboard,
  TopicItem,
  TutorChatBody,
  TutorChatResponse,
  TutorEscalateBody,
  TutorEscalateResponse,
  TutorSessionBody,
  TutorSessionResponse,
  UpdateProfileBody,
  User,
  WeakNode,
} from '../types';
import {
  CHECKED,
  COMMON_MISTAKES,
  EDGES,
  ESCALATIONS,
  GRADEBOOK,
  GROUPS,
  MAP_BASE,
  MEMORY,
  SUBJECTS,
  TASKS,
  TOPICS,
  USERS,
  day,
  type SeedTask,
} from './seed';

// In-memory backend. It answers the same paths and shapes as the real API,
// so the app code does not change when USE_MOCK is switched off.

const at = (daysFromNow: number, hour: number, minute: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const state = {
  consultations: [
    { id: 1, escalation_id: 101, student_name: 'Aliya K.', teacher_name: 'Hakim Rahman', group_name: 'Math-101', topic_title: 'Fractions', starts_at: at(1, 14, 30), duration_min: 30, place: 'Room B2-14', note: 'Bring your notebook with the fractions exercises.' },
    { id: 2, escalation_id: 102, student_name: 'Daniyar S.', teacher_name: 'Hakim Rahman', group_name: 'Algebra-Adv', topic_title: 'Discriminant', starts_at: at(2, 10, 0), duration_min: 30, place: 'Room B2-14', note: '' },
    { id: 3, escalation_id: 105, student_name: 'Sara H.', teacher_name: 'Hakim Rahman', group_name: 'Math-101', topic_title: 'Word Problems', starts_at: at(2, 15, 0), duration_min: 45, place: 'Online: meet.example.com/rahman', note: 'Motion problems.' },
  ] as Consultation[],
  users: { student: { ...USERS.student }, teacher: { ...USERS.teacher } } as Record<Role, User>,
  topics: TOPICS.map((t) => ({ ...t })),
  tasks: TASKS.map((t) => ({ ...t })) as SeedTask[],
  submitted: new Set<number>(),
  checked: CHECKED.map((c) => ({ ...c })) as { id: number; title: string; subject: string; posted_days_ago: number; score_percent: number }[],
  escalations: ESCALATIONS.map((e) => ({ ...e })),
  studentTicket: null as EscalationTicket | null,
  groups: GROUPS.map((g) => ({ ...g, ai_active: true, instructions: 'Never give the final answer. Ask guiding questions. Use short examples with small numbers.' })),
  provider: 'gemini' as ProviderKey,
  sessions: new Map<string, number>(),
  nextId: 500,
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}

async function currentRole(): Promise<Role> {
  const token = await getItem<string | null>(KEYS.token, null);
  if (!token) fail(401, 'Please sign in');
  return token.includes('teacher') ? 'teacher' : 'student';
}

/* ---------- builders ---------- */

function topicItem(id: number): TopicItem {
  const t = state.topics.find((x) => x.id === id);
  if (!t) fail(404, 'Topic not found');
  const subject = SUBJECTS.find((s) => s.id === t.subject_id);
  const prerequisites = EDGES.filter(([, target]) => target === id).map(([pre]) => {
    const p = state.topics.find((x) => x.id === pre)!;
    return { topic_id: p.id, title: p.title, status: p.status, mastery_score: p.score };
  });
  return {
    id: t.id,
    title: t.title,
    order_index: state.topics.filter((x) => x.subject_id === t.subject_id).findIndex((x) => x.id === t.id) + 1,
    difficulty_level: t.difficulty,
    status: t.status,
    mastery_score: t.score,
    lecture_notes_markdown: t.notes,
    teacher_name: subject?.teacher ?? null,
    prerequisites,
  };
}

function subjectsList(): Subject[] {
  return SUBJECTS.map((s) => {
    const topics = state.topics.filter((t) => t.subject_id === s.id);
    const mastered = topics.filter((t) => t.status === 'mastered').length;
    return {
      id: s.id,
      title: s.title,
      slug: s.slug,
      progress: topics.length ? Math.round((mastered / topics.length) * 100) : 0,
      topics: topics.map((t) => topicItem(t.id)),
    };
  });
}

function taskDetail(t: SeedTask): TaskDetail {
  return {
    id: t.id,
    title: t.title,
    subject: t.subject,
    topic_id: t.topic_id,
    topic: t.topic,
    type: t.type,
    posted_at: day(t.posted_days_ago),
    questions: t.questions.map((q) => ({ id: q.id, prompt: q.prompt })),
  };
}

function ticketFor(topicId: number, attempts: number): EscalationTicket {
  const t = state.topics.find((x) => x.id === topicId)!;
  return {
    id: state.nextId++,
    teacher_name: 'Hakim Rahman',
    group_name: 'Math-101',
    topic_id: t.id,
    topic_title: t.title,
    attempts_with_ai: attempts,
    ai_diagnostic_summary: t.weakness ?? 'The student needs a personal explanation.',
    status: 'pending_teacher',
    created_at: new Date().toISOString(),
  };
}

function groupDetail(id: number): GroupDetail {
  const g = state.groups.find((x) => x.id === id);
  if (!g) fail(404, 'Group not found');
  return {
    id: g.id,
    name: g.name,
    subject: g.subject,
    students_count: g.students,
    invite_code: g.invite_code,
    ai_active: g.ai_active,
    ai_teacher_instructions: g.instructions,
    current_topic_id: g.topic_id,
    topics: MAP_BASE.map((m) => ({ id: m.topic_id, title: m.title })),
    knowledge_map: MAP_BASE.map((m) => ({ topic_id: m.topic_id, title: m.title, mastered: m.m, learning: m.l, struggling: m.s, unseen: m.u })),
    gradebook: { title: 'Linear Equations: practice set', checked: g.checked, total: g.students, rows: clone(GRADEBOOK) },
    common_mistakes: clone(COMMON_MISTAKES),
  };
}

function studentShortName(): string {
  return state.users.student.full_name.replace(/ (\w)\w+$/, ' $1.');
}

function consultationFor(escalationId: number): Consultation | null {
  return state.consultations.find((c) => c.escalation_id === escalationId) ?? null;
}


/* ---------- lessons ---------- */

function lessonDetail(topicId: number): LessonDetail {
  const t = state.topics.find((x) => x.id === topicId);
  if (!t) fail(404, 'Lesson not found');
  return {
    topic_id: t.id,
    title: t.title,
    subject_title: SUBJECTS.find((s) => s.id === t.subject_id)?.title ?? '',
    lecture_notes_markdown: t.notes,
    tasks: state.tasks.filter((x) => x.topic_id === topicId).map(teacherTask),
  };
}

function teacherTask(t: SeedTask): TeacherTask {
  return {
    id: t.id,
    title: t.title,
    type: t.type,
    posted_at: day(t.posted_days_ago),
    questions: t.questions.map((q) => ({ id: q.id, prompt: q.prompt, answer: q.answer })),
  };
}

const GENERATED: QuestionDraft[] = [
  { prompt: 'Solve for x: x + 3 = 8', answer: '5' },
  { prompt: 'Solve for x: 2x = 10', answer: '5' },
  { prompt: 'Solve for x: x − 4 = 1', answer: '5' },
  { prompt: 'Solve for x: 3x + 2 = 14', answer: '4' },
];

/** Stand-in for the AI. The real backend asks the model; the shape of the answer is the same. */
function reviseNotes(instruction: string, current: string): { summary: string; text: string } {
  const q = instruction.toLowerCase();
  if (/simple|easier|easy|clear/.test(q)) {
    return {
      summary: 'Added a short explanation in simple words at the top. The rest is unchanged.',
      text: `## In simple words\nThink of an equation as a balance scale. Whatever you do on one side, do the same on the other.\n\n${current}`,
    };
  }
  if (/example/.test(q)) {
    return {
      summary: 'Added one more worked example at the end.',
      text: `${current}\n\n## One more example\n\`\`\`example\n3x − 4 = 11\n3x = 11 + 4\nx = 15 ÷ 3 = 5\n\`\`\``,
    };
  }
  if (/short|brief|less/.test(q)) {
    return { summary: 'Kept the main idea and the first steps. Removed the rest.', text: current.split('\n\n').slice(0, 3).join('\n\n') };
  }
  return { summary: 'Added your remark as a note at the end.', text: `${current}\n\n## Note\n${instruction.trim()}` };
}

function reviseQuestions(instruction: string, current: QuestionDraft[]): { summary: string; questions: QuestionDraft[] } {
  const q = instruction.toLowerCase();
  if (/easier|simple|easy/.test(q)) {
    return { summary: 'Replaced the questions with three easier ones that use small numbers.', questions: GENERATED.slice(0, 3) };
  }
  if (/more|add|extra|another/.test(q)) {
    return { summary: 'Kept all questions and added two new ones.', questions: [...current, ...GENERATED.slice(2, 4)] };
  }
  return { summary: 'Kept all questions and added one new one.', questions: [...current, GENERATED[3]!] };
}

/* ---------- grading ---------- */

const norm = (s: string) => s.replace(/\s+/g, '').replace('−', '-').replace(/^x=/i, '').toLowerCase();

function grade(body: GradeBody): GradeResponse {
  const task = state.tasks.find((t) => t.id === body.task_id);
  if (!task) fail(404, 'Task not found');
  const questions: QuestionResult[] = task.questions.map((q) => {
    const given = body.answers.find((a) => a.question_id === q.id);
    const correct = !!given && norm(given.final_answer) === norm(q.answer);
    if (correct) return { question_id: q.id, correct: true };
    return {
      question_id: q.id,
      correct: false,
      feedback: given?.final_answer ? 'Check the signs when a term moves across the equals sign.' : 'No answer was given.',
      correction: given?.final_answer ? { wrong: given.final_answer, right: q.answer } : undefined,
    };
  });
  const correct = questions.filter((q) => q.correct).length;
  const score = Math.round((correct / questions.length) * 100);

  const topic = state.topics.find((t) => t.id === task.topic_id);
  const weak = score < 70 && topic ? [{ topic_id: topic.id, title: topic.title, note: topic.weakness ?? 'Needs more practice.' }] : [];
  if (topic) {
    topic.score = Math.max(0, Math.min(100, Math.round((topic.score + score) / 2)));
    topic.status = (topic.score >= 80 ? 'mastered' : topic.score >= 40 ? 'learning' : 'struggling') as MasteryStatus;
  }

  state.submitted.add(task.id);
  state.checked.unshift({ id: task.id, title: task.title, subject: task.subject, posted_days_ago: task.posted_days_ago, score_percent: score });

  return {
    score_percent: score,
    correct_count: correct,
    total: questions.length,
    ai_feedback_summary:
      score >= 80
        ? 'Good work. Your method is clear and the steps are in the right order.'
        : 'You know the method, but a few steps lose a sign. Rewrite each step on its own line and check the sign before you move on.',
    questions,
    detected_weak_topics: weak,
  };
}

/* ---------- router ---------- */

const TUTOR_REPLIES = [
  'Let us look at it step by step. What happens to a term when it moves to the other side of the equals sign?',
  'Try a smaller example: 2 + 3 = 5. Move the 3 to the right side. What do you get on the left?',
  'Think of a balance scale. Whatever you do on one side, you must do on the other. Which operation undoes "+ 3"?',
];

type Handler = (args: { params: string[]; body: any; role: Role }) => unknown;
type Route = { method: string; pattern: RegExp; handler: Handler; roles?: Role[] };

const routes: Route[] = [
  {
    method: 'POST',
    pattern: /^\/lms\/auth\/register$/,
    handler: ({ body }) => {
      const b = body as RegisterBody;
      const role: Role = b.role === 'teacher' ? 'teacher' : 'student';
      const user: User = {
        ...state.users[role],
        id: state.nextId++,
        full_name: b.full_name,
        email: b.email,
        country: b.country,
        school_name: b.school_name ?? null,
        learning_level: b.learning_level ?? 'beginner',
        preferred_language: b.preferred_language,
      };
      state.users[role] = user;
      return { token: `mock-token-${role}`, user } satisfies AuthResponse;
    },
  },
  {
    method: 'POST',
    pattern: /^\/lms\/auth\/login$/,
    handler: ({ body }) => {
      const b = body as LoginBody;
      if (!b.email || !b.password) fail(400, 'Enter email and password');
      // Mock rule: an email that contains "teacher" or matches seed teacher email signs in as a teacher.
      const emailLower = b.email.toLowerCase();
      const role: Role =
        emailLower.includes('teacher') ||
        emailLower === state.users.teacher.email.toLowerCase()
          ? 'teacher'
          : 'student';
      return { token: `mock-token-${role}`, user: state.users[role] } satisfies AuthResponse;
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/profile$/,
    handler: ({ role }) => {
      const user = state.users[role];
      const res: ProfileResponse = { user, groups: [] };
      if (role === 'student') {
        res.groups = SUBJECTS.map((s, i) => ({ id: i + 1, name: s.group, subject: s.title, teacher_name: s.teacher, students_count: 30 + i }));
        res.student_stats = {
          topics_mastered: state.topics.filter((t) => t.status === 'mastered').length,
          topics_total: state.topics.length,
          homework_checked: state.checked.length,
          tutor_sessions: 14,
        };
      } else {
        res.groups = state.groups.map((g) => ({ id: g.id, name: g.name, subject: g.subject, students_count: g.students, invite_code: g.invite_code }));
        res.teacher_stats = {
          students: state.groups.reduce((n, g) => n + g.students, 0),
          homework_checked: state.groups.reduce((n, g) => n + g.checked, 0),
          escalations_pending: state.escalations.length,
        };
      }
      return res;
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/lms\/profile$/,
    handler: ({ body, role }) => {
      state.users[role] = { ...state.users[role], ...(body as UpdateProfileBody) };
      return routes[2]!.handler({ params: [], body: undefined, role });
    },
  },
  {
    method: 'POST',
    pattern: /^\/lms\/profile\/password$/,
    handler: ({ body }) => {
      if (!body?.new_password || body.new_password.length < 6) fail(400, 'Password must have at least 6 characters');
      return undefined;
    },
  },
  {
    method: 'POST',
    pattern: /^\/lms\/groups\/join$/,
    roles: ['student'],
    handler: ({ body, role }) => {
      if (!body?.invite_code || String(body.invite_code).trim().length < 4) fail(404, 'Invite code not found');
      return routes[2]!.handler({ params: [], body: undefined, role });
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/student\/dashboard$/,
    roles: ['student'],
    handler: () => {
      const weak: WeakNode[] = state.topics
        .filter((t) => t.subject_id === 1 && (t.status === 'struggling' || (t.status === 'learning' && t.struggle > 0)))
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
        .map((t) => ({
          topic_id: t.id,
          title: t.title,
          subject: 'Mathematics',
          mastery_score: t.score,
          status: t.status,
          note: t.weakness ?? '',
        }));
      const mastered = state.topics.filter((t) => t.status === 'mastered').length;
      const res: StudentDashboard = {
        ai_summary: `You have mastered ${mastered} topics. Fractions and Linear Equations need attention. Start with Prime Factors, then come back to Fractions.`,
        subjects: SUBJECTS.map((s) => {
          const topics = state.topics.filter((t) => t.subject_id === s.id);
          return { id: s.id, title: s.title, mastered_topics: topics.filter((t) => t.status === 'mastered').length, total_topics: topics.length };
        }),
        weak_nodes: weak,
        pending_tasks: state.tasks
          .filter((t) => !state.submitted.has(t.id))
          .map((t) => ({ id: t.id, title: t.title, subject: t.subject, topic: t.topic, type: t.type, posted_at: day(t.posted_days_ago) })),
        active_escalation: state.studentTicket,
        consultations: state.consultations
          .filter((c) => c.student_name === studentShortName() && new Date(c.starts_at).getTime() + c.duration_min * 60000 > Date.now())
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      };
      return res;
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/student\/knowledge-graph$/,
    roles: ['student'],
    handler: () => {
      const res: KnowledgeGraphResponse = {
        subjects: SUBJECTS.map((s) => ({ id: s.id, title: s.title })),
        nodes: state.topics.map((t) => ({
          topic_id: t.id,
          subject_id: t.subject_id,
          title: t.title,
          mastery_score: t.score,
          status: t.status,
          struggle_count: t.struggle,
          last_weakness_note: t.weakness,
        })),
        edges: EDGES.map(([a, b]) => ({ prerequisite_topic_id: a, target_topic_id: b })),
        memory: clone(MEMORY),
      };
      return res;
    },
  },
  { method: 'GET', pattern: /^\/lms\/subjects$/, handler: () => ({ subjects: subjectsList() }) },
  {
    method: 'GET',
    pattern: /^\/lms\/student\/homework$/,
    roles: ['student'],
    handler: () => {
      const res: HomeworkListResponse = {
        todo: state.tasks.filter((t) => !state.submitted.has(t.id)).map(taskDetail),
        checked: state.checked.map(
          (c): CheckedTask => ({ id: c.id, title: c.title, subject: c.subject, posted_at: day(c.posted_days_ago), score_percent: c.score_percent }),
        ),
      };
      return res;
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/topics\/(\d+)\/offline-bundle$/,
    handler: ({ params }) => {
      const id = Number(params[0]);
      const topic = topicItem(id);
      const t = state.topics.find((x) => x.id === id)!;
      const subject = SUBJECTS.find((s) => s.id === t.subject_id)!;
      const res: OfflineBundle = {
        topic,
        subject_title: subject.title,
        tasks: state.tasks.filter((x) => x.topic_id === id && !state.submitted.has(x.id)).map(taskDetail),
      };
      return res;
    },
  },
  {
    method: 'POST',
    pattern: /^\/lms\/offline\/sync$/,
    handler: ({ body }) => {
      let synced = 0;
      for (const s of (body?.submissions ?? []) as GradeBody[]) {
        if (state.submitted.has(s.task_id)) continue;
        grade(s);
        synced += 1;
      }
      return { synced, graph_updated: synced > 0 };
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/teacher\/dashboard$/,
    roles: ['teacher'],
    handler: () => {
      const res: TeacherDashboard = {
        summary: {
          students: state.groups.reduce((n, g) => n + g.students, 0),
          homework_checked: state.groups.reduce((n, g) => n + g.checked, 0),
          questions_answered: state.groups.reduce((n, g) => n + g.answered, 0),
          hours_saved: 38,
          escalations_pending: state.escalations.length,
        },
        groups: state.groups.map((g) => ({
          id: g.id,
          name: g.name,
          subject: g.subject,
          students_count: g.students,
          homework_checked: g.checked,
          questions_answered: g.answered,
          current_topic_title: state.topics.find((t) => t.id === g.topic_id)?.title ?? '',
          escalations_pending: state.escalations.filter((e) => e.group_id === g.id).length,
        })),
        escalations: state.escalations.map((e) => ({
          ...e,
          group_name: state.groups.find((g) => g.id === e.group_id)?.name ?? '',
          consultation: consultationFor(e.id),
        })),
      };
      return res;
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/teacher\/groups\/(\d+)$/,
    roles: ['teacher'],
    handler: ({ params }) => groupDetail(Number(params[0])),
  },
  {
    method: 'PATCH',
    pattern: /^\/lms\/teacher\/groups\/(\d+)$/,
    roles: ['teacher'],
    handler: ({ params, body }) => {
      const id = Number(params[0]);
      const g = state.groups.find((x) => x.id === id);
      if (!g) fail(404, 'Group not found');
      const b = body as PatchGroupBody;
      if (b.ai_teacher_instructions !== undefined) g.instructions = b.ai_teacher_instructions;
      if (b.current_topic_id !== undefined) g.topic_id = b.current_topic_id;
      if (b.ai_active !== undefined) g.ai_active = b.ai_active;
      return groupDetail(id);
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/teacher\/groups\/(\d+)\/lessons$/,
    roles: ['teacher'],
    handler: ({ params }) => {
      const g = state.groups.find((x) => x.id === Number(params[0]));
      if (!g) fail(404, 'Group not found');
      const subject = SUBJECTS.find((s) => s.title === g.subject);
      const topics = state.topics.filter((t) => t.subject_id === subject?.id);
      const res: GroupLessonsResponse = {
        group: { id: g.id, name: g.name, subject: g.subject },
        lessons: topics.map((t, i) => ({ topic_id: t.id, title: t.title, order_index: i + 1, tasks_count: state.tasks.filter((x) => x.topic_id === t.id).length })),
      };
      return res;
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/teacher\/lessons\/(\d+)$/,
    roles: ['teacher'],
    handler: ({ params }) => lessonDetail(Number(params[0])),
  },
  {
    method: 'PATCH',
    pattern: /^\/lms\/teacher\/lessons\/(\d+)$/,
    roles: ['teacher'],
    handler: ({ params, body }) => {
      const t = state.topics.find((x) => x.id === Number(params[0]));
      if (!t) fail(404, 'Lesson not found');
      const b = body as UpdateLessonBody;
      if (!b.lecture_notes_markdown?.trim()) fail(400, 'Lecture notes cannot be empty');
      t.notes = b.lecture_notes_markdown;
      return lessonDetail(t.id);
    },
  },
  {
    method: 'POST',
    pattern: /^\/lms\/teacher\/lessons\/(\d+)\/tasks$/,
    roles: ['teacher'],
    handler: ({ params, body }) => {
      const topic = state.topics.find((x) => x.id === Number(params[0]));
      if (!topic) fail(404, 'Lesson not found');
      const b = body as CreateTaskBody;
      const subject = SUBJECTS.find((s) => s.id === topic.subject_id)!;
      const drafts: QuestionDraft[] = b.generate_with_ai ? GENERATED.slice(0, 3) : [{ prompt: 'Write the first question here.', answer: '' }];
      state.tasks.unshift({
        id: state.nextId++,
        title: b.title?.trim() || `${topic.title}: ${b.type}`,
        subject: subject.title,
        topic_id: topic.id,
        topic: topic.title,
        type: b.type,
        posted_days_ago: 0,
        questions: drafts.map((d) => ({ id: state.nextId++, prompt: d.prompt, answer: d.answer })),
      });
      return lessonDetail(topic.id);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/lms\/teacher\/tasks\/(\d+)$/,
    roles: ['teacher'],
    handler: ({ params, body }) => {
      const task = state.tasks.find((x) => x.id === Number(params[0]));
      if (!task) fail(404, 'Task not found');
      const b = body as UpdateTaskBody;
      const clean = (b.questions ?? []).filter((q) => q.prompt.trim());
      if (clean.length === 0) fail(400, 'A task needs at least one question');
      if (b.title?.trim()) task.title = b.title.trim();
      task.questions = clean.map((q, i) => ({ id: task.questions[i]?.id ?? state.nextId++, prompt: q.prompt.trim(), answer: q.answer.trim() }));
      return teacherTask(task);
    },
  },
  {
    method: 'POST',
    pattern: /^\/ai\/lessons\/revise$/,
    roles: ['teacher'],
    handler: ({ body }) => {
      const b = body as ReviseLessonBody;
      if (!b.instruction?.trim()) fail(400, 'Tell the AI what to change');
      if (b.target === 'notes') {
        const t = state.topics.find((x) => x.id === b.topic_id);
        if (!t) fail(404, 'Lesson not found');
        const r = reviseNotes(b.instruction, t.notes);
        const res: ReviseLessonResponse = { target: 'notes', summary: r.summary, proposal_notes: r.text };
        return res;
      }
      const task = state.tasks.find((x) => x.id === b.task_id);
      if (!task) fail(404, 'Task not found');
      const r = reviseQuestions(b.instruction, task.questions.map((q) => ({ prompt: q.prompt, answer: q.answer })));
      const res: ReviseLessonResponse = { target: 'homework', summary: r.summary, proposal_questions: r.questions };
      return res;
    },
  },
  {
    method: 'POST',
    pattern: /^\/lms\/teacher\/escalations\/(\d+)\/schedule$/,
    roles: ['teacher'],
    handler: ({ params, body }) => {
      const id = Number(params[0]);
      const esc = state.escalations.find((e) => e.id === id);
      if (!esc) fail(404, 'Request not found');
      const b = body as ScheduleConsultationBody;
      if (!b.starts_at || Number.isNaN(new Date(b.starts_at).getTime())) fail(400, 'Choose a date and time');
      if (new Date(b.starts_at).getTime() < Date.now()) fail(400, 'The time is in the past');
      if (!b.place?.trim()) fail(400, 'Add a room or a link');
      const clash = state.consultations.find((c) => c.escalation_id !== id && c.starts_at === b.starts_at);
      if (clash) fail(409, 'You already have a meeting at this time');
      const next: Consultation = {
        id: consultationFor(id)?.id ?? state.nextId++,
        escalation_id: id,
        student_name: esc.student_name,
        teacher_name: state.users.teacher.full_name,
        group_name: state.groups.find((g) => g.id === esc.group_id)?.name ?? '',
        topic_title: esc.topic_title,
        starts_at: b.starts_at,
        duration_min: b.duration_min,
        place: b.place.trim(),
        note: b.note?.trim() ?? '',
      };
      state.consultations = [...state.consultations.filter((c) => c.escalation_id !== id), next];
      return next;
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/lms\/teacher\/consultations\/(\d+)$/,
    roles: ['teacher'],
    handler: ({ params }) => {
      const id = Number(params[0]);
      state.consultations = state.consultations.filter((c) => c.id !== id);
      return undefined;
    },
  },
  {
    method: 'GET',
    pattern: /^\/lms\/teacher\/calendar\?month=(\d{4})-(\d{2})$/,
    roles: ['teacher'],
    handler: ({ params }) => {
      const year = Number(params[0]);
      const month = Number(params[1]) - 1;
      const res: CalendarResponse = {
        consultations: state.consultations
          .filter((c) => {
            const d = new Date(c.starts_at);
            return d.getFullYear() === year && d.getMonth() === month;
          })
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      };
      return res;
    },
  },
  {
    method: 'POST',
    pattern: /^\/lms\/teacher\/escalations\/(\d+)\/resolve$/,
    roles: ['teacher'],
    handler: ({ params }) => {
      const id = Number(params[0]);
      state.escalations = state.escalations.filter((e) => e.id !== id);
      if (state.studentTicket?.id === id) state.studentTicket = null;
      return undefined;
    },
  },
  {
    method: 'POST',
    pattern: /^\/ai\/tutor\/session$/,
    roles: ['student'],
    handler: ({ body }) => {
      const b = body as TutorSessionBody;
      const topic = state.topics.find((t) => t.id === b.topic_id);
      if (!topic) fail(404, 'Topic not found');
      const session_id = `s-${state.nextId++}`;
      state.sessions.set(session_id, 0);
      const res: TutorSessionResponse = {
        session_id,
        greeting: `Hi! Let us work on ${topic.title}. Tell me what part is unclear, and I will explain it step by step.`,
      };
      return res;
    },
  },
  {
    method: 'POST',
    pattern: /^\/ai\/tutor\/chat$/,
    roles: ['student'],
    handler: ({ body }) => {
      const b = body as TutorChatBody;
      const attempts = (state.sessions.get(b.session_id) ?? 0) + 1;
      state.sessions.set(b.session_id, attempts);
      const should = attempts >= 3;
      const res: TutorChatResponse = {
        reply: should
          ? 'I have tried three different explanations and it is still not clear. I will send a note to your teacher so they can help you in person.'
          : TUTOR_REPLIES[Math.min(attempts - 1, TUTOR_REPLIES.length - 1)]!,
        attempts: Math.min(attempts, 3),
        should_escalate: should,
      };
      if (should) {
        const ticket = ticketFor(b.topic_id, attempts);
        state.studentTicket = ticket;
        state.escalations.unshift({
          id: ticket.id,
          student_name: studentShortName(),
          group_id: 1,
          topic_title: ticket.topic_title,
          attempts_with_ai: attempts,
          ai_diagnostic_summary: ticket.ai_diagnostic_summary,
        });
        res.escalation = ticket;
      }
      return res;
    },
  },
  {
    method: 'POST',
    pattern: /^\/ai\/tutor\/escalate$/,
    roles: ['student'],
    handler: ({ body }) => {
      const b = body as TutorEscalateBody;
      const attempts = Math.max(state.sessions.get(b.session_id) ?? 1, 1);
      const ticket = ticketFor(b.topic_id, attempts);
      state.studentTicket = ticket;
      state.escalations.unshift({
        id: ticket.id,
        student_name: studentShortName(),
        group_id: 1,
        topic_title: ticket.topic_title,
        attempts_with_ai: attempts,
        ai_diagnostic_summary: ticket.ai_diagnostic_summary,
      });
      const res: TutorEscalateResponse = {
        reply: 'Done. I sent a note to your teacher with what we already tried.',
        escalation: ticket,
      };
      return res;
    },
  },
  {
    method: 'POST',
    pattern: /^\/ai\/homework\/grade$/,
    roles: ['student'],
    handler: ({ body }) => grade(body as GradeBody),
  },
  {
    method: 'POST',
    pattern: /^\/ai\/quiz\/generate$/,
    roles: ['student'],
    handler: ({ body }) => {
      const ids: number[] = body?.topic_ids?.length
        ? body.topic_ids
        : state.topics.filter((t) => t.status === 'struggling' && t.subject_id === 1).map((t) => t.id);
      const first = state.topics.find((t) => t.id === (ids[0] ?? 3))!;
      const task: SeedTask = {
        id: state.nextId++,
        title: `Practice quiz: ${first.title}`,
        subject: SUBJECTS.find((s) => s.id === first.subject_id)!.title,
        topic_id: first.id,
        topic: first.title,
        type: 'quiz',
        posted_days_ago: 0,
        questions: [
          { id: state.nextId++, prompt: 'Add: 1/4 + 1/6', answer: '5/12' },
          { id: state.nextId++, prompt: 'Add: 2/3 + 1/9', answer: '7/9' },
          { id: state.nextId++, prompt: 'Simplify: 12/18', answer: '2/3' },
        ],
      };
      state.tasks.unshift(task);
      return { task: taskDetail(task) };
    },
  },
  {
    method: 'GET',
    pattern: /^\/ai\/providers\/config$/,
    handler: () => providers(),
  },
  {
    method: 'POST',
    pattern: /^\/ai\/providers\/config$/,
    roles: ['teacher'],
    handler: ({ body }) => {
      state.provider = body.active as ProviderKey;
      return providers();
    },
  },
];

function providers(): ProvidersConfig {
  return {
    active: state.provider,
    available: [
      { key: 'gemini', title: 'Gemini', subtitle: 'Fast, good for explanations' },
      { key: 'openrouter', title: 'OpenRouter', subtitle: 'Many models through one key' },
      { key: 'tokenrouter', title: 'TokenRouter', subtitle: 'Lowest cost per request' },
      { key: 'ollama', title: 'Ollama', subtitle: 'Runs on the school server' },
    ],
  };
}

export async function mockRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  await wait(250 + Math.random() * 250);

  const isAuth = path.startsWith('/lms/auth/');
  const role = isAuth ? 'student' : await currentRole();

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.pattern.exec(path);
    if (!m) continue;
    if (r.roles && !r.roles.includes(role)) fail(403, 'This section is not available for your role');
    return clone(r.handler({ params: m.slice(1), body, role }) as T);
  }
  return fail(404, `No mock for ${method} ${path}`);
}
