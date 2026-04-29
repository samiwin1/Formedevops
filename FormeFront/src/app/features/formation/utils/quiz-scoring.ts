/**
 * Structured format for quiz/exam content with auto-scoring.
 * When content is valid JSON: { "questions": [ { "text": "...", "options": ["A","B","C"], "correctIndex": 0 } ] }
 * Plain text content falls back to no auto-scoring (returns null).
 */
export interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface StructuredContent {
  questions: QuizQuestion[];
}

interface RawQuestion {
  text?: string;
  options?: unknown;
  correctIndex?: number;
}

export function parseStructuredContent(content: string | undefined): StructuredContent | null {
  if (!content?.trim()) return null;
  try {
    const parsed = JSON.parse(content.trim()) as { questions?: unknown[] };
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) return null;
    const questions: QuizQuestion[] = parsed.questions
      .filter((q): q is RawQuestion => {
        const r = q as RawQuestion;
        return r != null && typeof r === 'object' && Array.isArray(r.options) && typeof r.correctIndex === 'number';
      })
      .map(q => ({
        text: String(q.text ?? ''),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correctIndex: Number(q.correctIndex)
      }))
      .filter(q => q.text && q.options.length > 0 && q.correctIndex >= 0 && q.correctIndex < q.options.length);
    return questions.length > 0 ? { questions } : null;
  } catch {
    return null;
  }
}

export function questionsToJson(questions: QuizQuestion[]): string {
  return JSON.stringify({ questions }, null, 2);
}

export function isStructuredContent(content: string | undefined): boolean {
  return parseStructuredContent(content) !== null;
}

/**
 * Score user answers for structured content.
 * answers: object mapping question index to selected option index, e.g. { "0": 1, "1": 0 }
 * Returns score 0-100 or null if content is not structured.
 */
export function scoreStructuredAnswers(
  content: string | undefined,
  answers: Record<number, number>
): number | null {
  const structured = parseStructuredContent(content);
  if (!structured) return null;
  const { questions } = structured;
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    const selected = answers[i];
    if (typeof selected === 'number' && selected === questions[i].correctIndex) {
      correct++;
    }
  }
  return questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
}
