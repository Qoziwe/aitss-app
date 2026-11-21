import type { LearningLevel, MasteryStatus, MemoryType, Role, TaskType, User } from '../types';

// Sample data for the mock server. It matches the approved design.

export const day = (daysAgo: number): string => new Date(Date.now() - daysAgo * 86400000).toISOString();

export type SeedSubject = { id: number; title: string; slug: string; teacher: string; group: string };

export const SUBJECTS: SeedSubject[] = [
  { id: 1, title: 'Mathematics', slug: 'mathematics', teacher: 'Hakim Rahman', group: 'Math-101' },
  { id: 2, title: 'Science', slug: 'science', teacher: 'Mei Lee', group: 'Science-8B' },
  { id: 3, title: 'English', slug: 'english', teacher: 'Daniel Wong', group: 'English-8B' },
  { id: 4, title: 'History', slug: 'history', teacher: 'Sara Ismail', group: 'History-8B' },
  { id: 5, title: 'Computer Science', slug: 'computer-science', teacher: 'Hakim Rahman', group: 'CS-8B' },
];

export type SeedTopic = {
  id: number;
  subject_id: number;
  title: string;
  difficulty: LearningLevel;
  status: MasteryStatus;
  score: number;
  struggle: number;
  weakness: string | null;
  notes: string;
};

const generic = (title: string) =>
  `## ${title}\n\nLecture notes for this topic appear here when your teacher publishes them.`;

const LINEAR_NOTES = `## What is a linear equation?
An equation where the unknown appears only to the first power, for example 2x + 3 = 11. The goal is to find the value of x that makes both sides equal.

## Solving step by step
1. Expand brackets if there are any.
2. Move terms with x to one side. The sign changes when a term crosses the equals sign.
3. Divide both sides by the number next to x.

\`\`\`example
2x + 3 = 11
2x = 11 − 3
x = 8 ÷ 2 = 4
\`\`\``;

export const TOPICS: SeedTopic[] = [
  { id: 1, subject_id: 1, title: 'Integers & Signs', difficulty: 'beginner', status: 'mastered', score: 88, struggle: 0, weakness: null, notes: '## Integers & Signs\n\nPositive and negative whole numbers, and the rules for adding, subtracting and multiplying them.' },
  { id: 2, subject_id: 1, title: 'Prime Factors', difficulty: 'beginner', status: 'learning', score: 55, struggle: 2, weakness: 'Stops factoring before all factors are prime.', notes: '## Prime Factors\n\nBreaking a number into a product of primes. This is needed before fractions.' },
  { id: 3, subject_id: 1, title: 'Fractions', difficulty: 'intermediate', status: 'struggling', score: 32, struggle: 6, weakness: 'Cannot find a common denominator when the numbers share a factor.', notes: '## Fractions\n\nAdding and comparing fractions needs a common denominator. Use prime factors to find it.' },
  { id: 4, subject_id: 1, title: 'Linear Equations', difficulty: 'intermediate', status: 'learning', score: 48, struggle: 5, weakness: 'Keeps the sign when a term crosses the equals sign.', notes: LINEAR_NOTES },
  { id: 5, subject_id: 1, title: 'Linear Systems', difficulty: 'intermediate', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Linear Systems') },
  { id: 6, subject_id: 1, title: 'Quadratics', difficulty: 'advanced', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Quadratics') },
  { id: 7, subject_id: 1, title: 'Word Problems', difficulty: 'intermediate', status: 'struggling', score: 36, struggle: 4, weakness: 'Gets lost when geometry becomes a text problem.', notes: '## Word Problems\n\nTurn the text into an equation: name the unknown, write what is given, then solve.' },
  { id: 8, subject_id: 1, title: 'Geometry Basics', difficulty: 'beginner', status: 'mastered', score: 91, struggle: 0, weakness: null, notes: generic('Geometry Basics') },

  { id: 11, subject_id: 2, title: 'Units & Measurement', difficulty: 'beginner', status: 'mastered', score: 84, struggle: 0, weakness: null, notes: generic('Units & Measurement') },
  { id: 12, subject_id: 2, title: 'Unit Conversion', difficulty: 'beginner', status: 'struggling', score: 29, struggle: 5, weakness: 'Mixes up units when converting.', notes: generic('Unit Conversion') },
  { id: 13, subject_id: 2, title: "Newton's Laws", difficulty: 'intermediate', status: 'learning', score: 52, struggle: 1, weakness: null, notes: generic("Newton's Laws") },
  { id: 14, subject_id: 2, title: 'Energy', difficulty: 'intermediate', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Energy') },
  { id: 15, subject_id: 2, title: 'Waves', difficulty: 'advanced', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Waves') },

  { id: 21, subject_id: 3, title: 'Parts of Speech', difficulty: 'beginner', status: 'mastered', score: 90, struggle: 0, weakness: null, notes: generic('Parts of Speech') },
  { id: 22, subject_id: 3, title: 'Tenses', difficulty: 'intermediate', status: 'mastered', score: 82, struggle: 0, weakness: null, notes: generic('Tenses') },
  { id: 23, subject_id: 3, title: 'Essay Structure', difficulty: 'intermediate', status: 'learning', score: 61, struggle: 1, weakness: null, notes: generic('Essay Structure') },
  { id: 24, subject_id: 3, title: 'Reading Comprehension', difficulty: 'intermediate', status: 'learning', score: 58, struggle: 1, weakness: null, notes: generic('Reading Comprehension') },

  { id: 31, subject_id: 4, title: 'Ancient Trade Routes', difficulty: 'beginner', status: 'learning', score: 45, struggle: 1, weakness: null, notes: generic('Ancient Trade Routes') },
  { id: 32, subject_id: 4, title: 'Colonial Period', difficulty: 'intermediate', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Colonial Period') },
  { id: 33, subject_id: 4, title: 'Independence', difficulty: 'intermediate', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Independence') },

  { id: 41, subject_id: 5, title: 'Variables & Types', difficulty: 'beginner', status: 'mastered', score: 86, struggle: 0, weakness: null, notes: generic('Variables & Types') },
  { id: 42, subject_id: 5, title: 'Loops', difficulty: 'beginner', status: 'learning', score: 63, struggle: 1, weakness: null, notes: generic('Loops') },
  { id: 43, subject_id: 5, title: 'Functions', difficulty: 'intermediate', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Functions') },
  { id: 44, subject_id: 5, title: 'Lists & Dictionaries', difficulty: 'intermediate', status: 'unseen', score: 0, struggle: 0, weakness: null, notes: generic('Lists & Dictionaries') },
];

// [prerequisite, target]
export const EDGES: [number, number][] = [
  [2, 3], [3, 4], [1, 4], [4, 6], [4, 5], [4, 7], [8, 7],
  [11, 12], [12, 13], [13, 14], [14, 15],
  [21, 22], [22, 23], [21, 24],
  [31, 32], [32, 33],
  [41, 42], [42, 43], [42, 44],
];

export const MEMORY: { id: number; subject_id: number | null; memory_type: MemoryType; memory_fact: string }[] = [
  { id: 1, subject_id: 1, memory_type: 'weakness', memory_fact: 'Often loses the minus sign when expanding brackets.' },
  { id: 2, subject_id: 1, memory_type: 'misconception', memory_fact: 'Thinks a term keeps its sign when it moves across the equals sign.' },
  { id: 3, subject_id: 1, memory_type: 'weakness', memory_fact: 'Cannot find a common denominator when the numbers share a factor.' },
  { id: 4, subject_id: null, memory_type: 'learning_style', memory_fact: 'Understands faster with visual, step-by-step examples.' },
  { id: 5, subject_id: 1, memory_type: 'strength', memory_fact: 'Solves integer problems quickly and confidently.' },
  { id: 6, subject_id: 1, memory_type: 'strength', memory_fact: 'Strong in geometry, but gets lost when it turns into a word problem.' },
];

export const USERS: Record<Role, User> = {
  student: {
    id: 1,
    full_name: 'Aliya Karimova',
    email: 'aliya@example.com',
    role: 'student',
    country: 'Malaysia',
    school_name: 'Bukit Jalil Secondary School',
    learning_level: 'intermediate',
    preferred_language: 'en',
  },
  teacher: {
    id: 2,
    full_name: 'Hakim Rahman',
    email: 'rahman@school.edu',
    role: 'teacher',
    country: 'Malaysia',
    school_name: 'Bukit Jalil Secondary School',
    learning_level: 'intermediate',
    preferred_language: 'en',
  },
};

export type SeedTask = {
  id: number;
  title: string;
  subject: string;
  topic_id: number;
  topic: string;
  type: TaskType;
  posted_days_ago: number;
  questions: { id: number; prompt: string; answer: string }[];
};

export const TASKS: SeedTask[] = [
  {
    id: 1, title: 'Linear Equations: practice set', subject: 'Mathematics', topic_id: 4, topic: 'Linear Equations', type: 'homework', posted_days_ago: 2,
    questions: [
      { id: 101, prompt: 'Solve for x: x + 5 = 2', answer: '-3' },
      { id: 102, prompt: 'Solve for x: 3(x − 2) = 2x + 5', answer: '11' },
      { id: 103, prompt: 'Solve for x: 4x − 7 = 9', answer: '4' },
      { id: 104, prompt: 'Solve for x: 2(x + 3) = 14', answer: '4' },
      { id: 105, prompt: 'Solve for x: 5x = 3x + 8', answer: '4' },
    ],
  },
  {
    id: 2, title: 'Fractions check-in', subject: 'Mathematics', topic_id: 3, topic: 'Fractions', type: 'quiz', posted_days_ago: 3,
    questions: [
      { id: 201, prompt: 'Add: 1/2 + 1/3', answer: '5/6' },
      { id: 202, prompt: 'Simplify: 6/8', answer: '3/4' },
      { id: 203, prompt: 'Add: 2/5 + 3/10', answer: '7/10' },
    ],
  },
  {
    id: 3, title: 'Forces and motion', subject: 'Science', topic_id: 13, topic: "Newton's Laws", type: 'homework', posted_days_ago: 4,
    questions: [
      { id: 301, prompt: 'A 2 kg object accelerates at 3 m/s². What is the net force in newtons?', answer: '6' },
      { id: 302, prompt: 'A force of 10 N acts on a 5 kg object. What is its acceleration in m/s²?', answer: '2' },
    ],
  },
];

export const CHECKED = [
  { id: 90, title: 'Integers & signs', subject: 'Mathematics', posted_days_ago: 7, score_percent: 92 },
  { id: 91, title: 'Prime factors', subject: 'Mathematics', posted_days_ago: 11, score_percent: 70 },
];

export type SeedGroup = {
  id: number;
  name: string;
  subject: string;
  students: number;
  checked: number;
  answered: number;
  topic_id: number;
  invite_code: string;
};

export const GROUPS: SeedGroup[] = [
  { id: 1, name: 'Math-101', subject: 'Mathematics', students: 34, checked: 31, answered: 48, topic_id: 4, invite_code: 'M101-4F9Q' },
  { id: 2, name: 'Math-102', subject: 'Mathematics', students: 32, checked: 32, answered: 39, topic_id: 3, invite_code: 'M102-7K2D' },
  { id: 3, name: 'Algebra-Adv', subject: 'Mathematics', students: 30, checked: 25, answered: 52, topic_id: 6, invite_code: 'ALG-9T3X' },
  { id: 4, name: 'Geometry-101', subject: 'Mathematics', students: 35, checked: 33, answered: 41, topic_id: 8, invite_code: 'G101-2B8M' },
];

export const ESCALATIONS = [
  { id: 101, student_name: 'Aliya K.', group_id: 1, topic_title: 'Fractions', attempts_with_ai: 3, ai_diagnostic_summary: 'Cannot bring fractions to a common denominator after 3 attempts with the AI. Knowledge graph: gap in breaking numbers into prime factors.' },
  { id: 102, student_name: 'Daniyar S.', group_id: 3, topic_title: 'Discriminant', attempts_with_ai: 4, ai_diagnostic_summary: 'Uses the discriminant formula but flips the sign of b. Knowledge graph: weak in integers and signs.' },
  { id: 103, student_name: 'Mei L.', group_id: 3, topic_title: 'Factoring trinomials', attempts_with_ai: 3, ai_diagnostic_summary: 'Does not see how to split the middle term. Knowledge graph: gap in prime factors.' },
  { id: 104, student_name: 'Arman T.', group_id: 4, topic_title: 'Triangle Similarity', attempts_with_ai: 3, ai_diagnostic_summary: 'Matches the wrong pairs of sides when setting up the ratio.' },
  { id: 105, student_name: 'Sara H.', group_id: 1, topic_title: 'Word Problems', attempts_with_ai: 3, ai_diagnostic_summary: 'Understands the equation but cannot translate the text of a motion problem into one.' },
  { id: 106, student_name: 'Ivan P.', group_id: 3, topic_title: 'Systems of Equations', attempts_with_ai: 3, ai_diagnostic_summary: 'Substitutes correctly, then makes sign errors when subtracting equations.' },
];

// Group knowledge map for 34 students: mastered, learning, struggling, unseen.
export const MAP_BASE: { topic_id: number; title: string; m: number; l: number; s: number; u: number }[] = [
  { topic_id: 1, title: 'Integers & Signs', m: 27, l: 5, s: 2, u: 0 },
  { topic_id: 2, title: 'Prime Factors', m: 18, l: 10, s: 5, u: 1 },
  { topic_id: 3, title: 'Fractions', m: 8, l: 10, s: 14, u: 2 },
  { topic_id: 4, title: 'Linear Equations', m: 6, l: 17, s: 9, u: 2 },
  { topic_id: 5, title: 'Linear Systems', m: 0, l: 2, s: 1, u: 31 },
  { topic_id: 6, title: 'Quadratics', m: 0, l: 0, s: 0, u: 34 },
  { topic_id: 7, title: 'Word Problems', m: 5, l: 9, s: 12, u: 8 },
  { topic_id: 8, title: 'Geometry Basics', m: 24, l: 8, s: 2, u: 0 },
];

export const GRADEBOOK = [
  { student_id: 11, name: 'Aliya K.', score_percent: 80, weakest_topic: 'Fractions', state: 'escalated' as const },
  { student_id: 12, name: 'Timur B.', score_percent: 100, weakest_topic: null, state: 'checked' as const },
  { student_id: 13, name: 'Sara H.', score_percent: 60, weakest_topic: 'Word Problems', state: 'escalated' as const },
  { student_id: 14, name: 'Elena V.', score_percent: 90, weakest_topic: 'Linear Equations', state: 'checked' as const },
  { student_id: 15, name: 'Nurlan A.', score_percent: 70, weakest_topic: 'Linear Equations', state: 'checked' as const },
  { student_id: 16, name: 'Chloe W.', score_percent: null, weakest_topic: null, state: 'missing' as const },
  { student_id: 17, name: 'Amir Z.', score_percent: 85, weakest_topic: 'Fractions', state: 'checked' as const },
];

export const COMMON_MISTAKES = [
  { text: 'Sign not changed when a term crosses "="', count: 14 },
  { text: 'Minus not applied to every term in brackets', count: 9 },
  { text: 'Only one side divided by the coefficient', count: 5 },
];
