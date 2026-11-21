// Types of every request and response. Names follow the database schema (snake_case),
// so the backend can return its rows almost as they are.

export type Role = 'student' | 'teacher';
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';
export type MasteryStatus = 'unseen' | 'learning' | 'struggling' | 'mastered';
export type MemoryType = 'weakness' | 'misconception' | 'learning_style' | 'strength';
export type TaskType = 'homework' | 'quiz';
export type EscalationStatus = 'pending_teacher' | 'resolved';
export type ProviderKey = 'gemini' | 'openrouter' | 'tokenrouter' | 'ollama';

/* ---------- auth and profile ---------- */

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  country: string;
  /** Student: school or study group code. Teacher: school name. */
  school_name: string | null;
  learning_level: LearningLevel;
  preferred_language: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  role: Role;
  full_name: string;
  email: string;
  password: string;
  country: string;
  school_name?: string;
  learning_level?: LearningLevel;
  preferred_language: string;
}

export interface ProfileGroup {
  id: number;
  name: string;
  subject: string;
  teacher_name?: string;
  students_count?: number;
  /** Teachers only. */
  invite_code?: string;
}

export interface StudentStats {
  topics_mastered: number;
  topics_total: number;
  homework_checked: number;
  tutor_sessions: number;
}

export interface TeacherStats {
  students: number;
  homework_checked: number;
  escalations_pending: number;
}

export interface ProfileResponse {
  user: User;
  groups: ProfileGroup[];
  student_stats?: StudentStats;
  teacher_stats?: TeacherStats;
}

export type UpdateProfileBody = Partial<
  Pick<User, 'full_name' | 'email' | 'country' | 'school_name' | 'learning_level' | 'preferred_language'>
>;

export interface ChangePasswordBody {
  new_password: string;
}

export interface JoinGroupBody {
  invite_code: string;
}

/* ---------- student: dashboard, subjects, graph ---------- */

export interface SubjectProgress {
  id: number;
  title: string;
  mastered_topics: number;
  total_topics: number;
}

export interface WeakNode {
  topic_id: number;
  title: string;
  subject: string;
  mastery_score: number;
  status: MasteryStatus;
  note: string;
}

export interface TaskSummary {
  id: number;
  title: string;
  subject: string;
  topic: string;
  type: TaskType;
  /** ISO date. */
  posted_at: string;
}

export interface EscalationTicket {
  id: number;
  teacher_name: string;
  group_name: string;
  topic_id: number;
  topic_title: string;
  attempts_with_ai: number;
  ai_diagnostic_summary: string;
  status: EscalationStatus;
  /** ISO date. */
  created_at: string;
}

/** A meeting set by a teacher for a student who needs help in person. */
export interface Consultation {
  id: number;
  escalation_id: number;
  student_name: string;
  teacher_name: string;
  group_name: string;
  topic_title: string;
  /** ISO date and time. */
  starts_at: string;
  duration_min: number;
  /** Room, or a meeting link. */
  place: string;
  note: string;
}

export interface ScheduleConsultationBody {
  starts_at: string;
  duration_min: number;
  place: string;
  note?: string;
}

export interface CalendarResponse {
  consultations: Consultation[];
}

export interface StudentDashboard {
  ai_summary: string;
  subjects: SubjectProgress[];
  weak_nodes: WeakNode[];
  pending_tasks: TaskSummary[];
  active_escalation: EscalationTicket | null;
  /** Upcoming consultations of this student, soonest first. */
  consultations: Consultation[];
}

export interface Prerequisite {
  topic_id: number;
  title: string;
  status: MasteryStatus;
  mastery_score: number;
}

export interface TopicItem {
  id: number;
  title: string;
  order_index: number;
  difficulty_level: LearningLevel;
  status: MasteryStatus;
  mastery_score: number;
  lecture_notes_markdown: string;
  teacher_name: string | null;
  prerequisites: Prerequisite[];
}

export interface Subject {
  id: number;
  title: string;
  slug: string;
  /** 0-100, share of mastered topics. */
  progress: number;
  topics: TopicItem[];
}

export interface SubjectsResponse {
  subjects: Subject[];
}

export interface GraphNode {
  topic_id: number;
  subject_id: number;
  title: string;
  mastery_score: number;
  status: MasteryStatus;
  struggle_count: number;
  last_weakness_note: string | null;
}

export interface GraphEdge {
  prerequisite_topic_id: number;
  target_topic_id: number;
}

export interface MemoryNote {
  id: number;
  subject_id: number | null;
  memory_type: MemoryType;
  memory_fact: string;
}

export interface KnowledgeGraphResponse {
  subjects: { id: number; title: string }[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  memory: MemoryNote[];
}

/* ---------- student: homework and quizzes ---------- */

export interface TaskQuestion {
  id: number;
  prompt: string;
}

export interface TaskDetail {
  id: number;
  title: string;
  subject: string;
  topic_id: number;
  topic: string;
  type: TaskType;
  posted_at: string;
  questions: TaskQuestion[];
}

export interface CheckedTask {
  id: number;
  title: string;
  subject: string;
  posted_at: string;
  score_percent: number;
}

export interface HomeworkListResponse {
  todo: TaskDetail[];
  checked: CheckedTask[];
}

export interface AnswerItem {
  question_id: number;
  steps: string;
  final_answer: string;
}

export interface GradeBody {
  task_id: number;
  answers: AnswerItem[];
  completed_offline?: boolean;
}

export interface QuestionResult {
  question_id: number;
  correct: boolean;
  feedback?: string;
  correction?: { wrong: string; right: string };
}

export interface WeakTopicHit {
  topic_id: number;
  title: string;
  note: string;
}

export interface GradeResponse {
  score_percent: number;
  correct_count: number;
  total: number;
  ai_feedback_summary: string;
  questions: QuestionResult[];
  detected_weak_topics: WeakTopicHit[];
}

export interface QuizGenerateBody {
  /** Weak topics are chosen by the backend from the student knowledge graph when omitted. */
  topic_ids?: number[];
}

export interface QuizGenerateResponse {
  task: TaskDetail;
}

/* ---------- AI tutor ---------- */

export interface TutorSessionBody {
  topic_id: number;
}

export interface TutorSessionResponse {
  session_id: string;
  greeting: string;
}

export interface TutorChatBody {
  session_id: string;
  topic_id: number;
  message: string;
}

export interface TutorChatResponse {
  reply: string;
  /** How many explanations the AI has tried so far (escalation at 3). */
  attempts: number;
  should_escalate: boolean;
  /** Present when the backend created a ticket for this answer. */
  escalation?: EscalationTicket;
}

export interface TutorEscalateBody {
  session_id: string;
  topic_id: number;
}

export interface TutorEscalateResponse {
  reply: string;
  escalation: EscalationTicket;
}

/* ---------- offline ---------- */

export interface OfflineBundle {
  topic: TopicItem;
  subject_title: string;
  tasks: TaskDetail[];
}

export interface DownloadedBundle extends OfflineBundle {
  downloaded_at: string;
}

export interface OfflineSyncBody {
  submissions: GradeBody[];
}

export interface OfflineSyncResponse {
  synced: number;
  graph_updated: boolean;
}

/* ---------- teacher ---------- */

export interface TeacherSummary {
  students: number;
  homework_checked: number;
  questions_answered: number;
  hours_saved: number;
  escalations_pending: number;
}

export interface TeacherGroupSummary {
  id: number;
  name: string;
  subject: string;
  students_count: number;
  homework_checked: number;
  questions_answered: number;
  current_topic_title: string;
  escalations_pending: number;
}

export interface TeacherEscalation {
  id: number;
  student_name: string;
  group_id: number;
  group_name: string;
  topic_title: string;
  attempts_with_ai: number;
  ai_diagnostic_summary: string;
  consultation: Consultation | null;
}

export interface TeacherDashboard {
  summary: TeacherSummary;
  groups: TeacherGroupSummary[];
  escalations: TeacherEscalation[];
}

export interface KnowledgeMapRow {
  topic_id: number;
  title: string;
  mastered: number;
  learning: number;
  struggling: number;
  unseen: number;
}

export type GradebookState = 'checked' | 'escalated' | 'missing';

export interface GradebookRow {
  student_id: number;
  name: string;
  score_percent: number | null;
  weakest_topic: string | null;
  state: GradebookState;
}

export interface CommonMistake {
  text: string;
  count: number;
}

export interface GroupDetail {
  id: number;
  name: string;
  subject: string;
  students_count: number;
  invite_code: string;
  ai_active: boolean;
  ai_teacher_instructions: string;
  current_topic_id: number;
  topics: { id: number; title: string }[];
  knowledge_map: KnowledgeMapRow[];
  gradebook: { title: string; checked: number; total: number; rows: GradebookRow[] };
  common_mistakes: CommonMistake[];
}

export interface PatchGroupBody {
  ai_teacher_instructions?: string;
  current_topic_id?: number;
  ai_active?: boolean;
}

/* ---------- AI provider ---------- */

export interface ProviderOption {
  key: ProviderKey;
  title: string;
  subtitle: string;
}

export interface ProvidersConfig {
  active: ProviderKey;
  available: ProviderOption[];
}

/* ---------- teacher: lessons and homework ---------- */

export interface LessonSummary {
  topic_id: number;
  title: string;
  order_index: number;
  tasks_count: number;
}

export interface GroupLessonsResponse {
  group: { id: number; name: string; subject: string };
  lessons: LessonSummary[];
}

/** Question as the teacher sees it: with the right answer. */
export interface TeacherQuestion {
  id: number;
  prompt: string;
  answer: string;
}

export interface TeacherTask {
  id: number;
  title: string;
  type: TaskType;
  posted_at: string;
  questions: TeacherQuestion[];
}

export interface LessonDetail {
  topic_id: number;
  title: string;
  subject_title: string;
  lecture_notes_markdown: string;
  tasks: TeacherTask[];
}

export interface UpdateLessonBody {
  lecture_notes_markdown: string;
}

export interface CreateTaskBody {
  group_id: number;
  title: string;
  type: TaskType;
  generate_with_ai: boolean;
}

export interface QuestionDraft {
  prompt: string;
  answer: string;
}

export interface UpdateTaskBody {
  title?: string;
  questions: QuestionDraft[];
}

export type ReviseTarget = 'notes' | 'homework';

export interface ReviseLessonBody {
  topic_id: number;
  target: ReviseTarget;
  /** Needed when target is homework. */
  task_id?: number;
  /** What the teacher asked for, in plain words. */
  instruction: string;
}

/** The AI never saves anything. It returns a proposal and the teacher applies it. */
export interface ReviseLessonResponse {
  target: ReviseTarget;
  summary: string;
  proposal_notes?: string;
  proposal_questions?: QuestionDraft[];
}
