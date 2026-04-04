export type ContentSubjectSummary = {
  id: number;
  category: string;
  level: string | null;
  name: string;
  slug: string;
  description: string | null;
};

export type MaterialSummary = {
  id: number;
  slug: string;
  title: string;
  category: string;
  level: string | null;
  subject: string | null;
  summary: string | null;
  sectionCount: number;
  itemCount: number;
  tags: string[];
  sourcePath: string;
};

export type MaterialSection = {
  order: number;
  title: string;
  body: string;
};

export type MaterialDetail = MaterialSummary & {
  description: string | null;
  sections: MaterialSection[];
};

export type QuestionSetSummary = {
  id: number;
  slug: string;
  title: string;
  category: string;
  level: string | null;
  subject: string | null;
  sourceKind: "practice" | "tryout";
  mode: string | null;
  focus: string | null;
  description: string | null;
  itemCount: number;
  durationMinutes: number | null;
  tags: string[];
  sourcePath: string;
};

export type QuestionOption = {
  key: string;
  text: string;
  order: number;
};

export type QuestionDetail = {
  id: number;
  questionCode: string | null;
  order: number;
  text: string;
  answerKey: string;
  explanation: string | null;
  tip: string | null;
  topic: string | null;
  difficulty: string | null;
  level: string | null;
  options: QuestionOption[];
};

export type QuestionSetDetail = QuestionSetSummary & {
  questions: QuestionDetail[];
};
