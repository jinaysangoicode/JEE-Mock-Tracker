export type ExamType = 'JEE_MAINS' | 'JEE_ADVANCED';

export interface SubjectScore {
  marks: number;
  maxMarks: number;
  rank?: number;
  marksAvgRatio?: number; // e.g. 1.34 (marks scored / batch average)
  positiveMarks?: number;
  negativeMarks?: number;
  avgNegativeMarks?: number;
  totalQuestions?: number;
  attempted?: number;
  correct?: number;
  partialCorrect?: number;
}

export interface QuestionTypeBreakdown {
  typeName: string; // e.g. "Single Correct", "Single Digit Integer", "Double Digit Integer"
  physicsCorrectPct?: number;
  physicsIncorrectPct?: number;
  chemistryCorrectPct?: number;
  chemistryIncorrectPct?: number;
  mathsCorrectPct?: number;
  mathsIncorrectPct?: number;
}

export interface TestAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  cutoffEstimation?: string;
  batchComparison?: string;
  mustAttemptNotes?: string;
}

export interface MockTestEntry {
  id: string;
  title: string;
  examType: ExamType;
  date: string; // YYYY-MM-DD
  physics: SubjectScore;
  chemistry: SubjectScore;
  maths: SubjectScore;
  totalScore: number;
  maxMarks: number;
  negativeMarks?: number;
  positiveMarks?: number;
  accuracy?: number; // e.g. 79%
  percentileEstimate?: string;
  institute?: string; // e.g. "Bakliwal Tutorials", "Allen", "MathonGo"
  notes?: string;

  // Bakliwal Tutorials & Advanced Report Card Parameters
  studentName?: string;
  rollNo?: string;
  testMode?: string; // "Offline" | "Online"
  overallRank?: number;
  totalBatchStudents?: number;
  marksAvgRatio?: number; // e.g. 1.51 (Total Marks / Batch Average)
  batchAvgNegativeMarks?: number; // e.g. -17.76
  totalQuestions?: number; // e.g. 69 (23 per subject)
  totalAttempted?: number; // e.g. 61
  totalCorrect?: number; // e.g. 48

  questionTypeBreakdown?: QuestionTypeBreakdown[];
  analysis?: TestAnalysis;
  createdAt: number;
}

export type ViewFilter = 'ALL' | 'JEE_MAINS' | 'JEE_ADVANCED';
export type TrendMetric = 'ABSOLUTE' | 'PERCENTAGE';
