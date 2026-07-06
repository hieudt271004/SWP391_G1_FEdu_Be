import { http } from './http';
import type { ClassroomGraphResponse, NodeContentResponse } from './learningPath.service';

// ── Test-taking types (khớp DTO backend) ─────────────────────────────────────

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY';

// AnswerResponse — backend ẩn isCorrect với học sinh nên không khai báo ở đây.
export interface Answer {
  answerId: number;
  answerContent: string;
}

// QuestionResponse
export interface Question {
  questionId: number;
  questionContent: string;
  questionType: QuestionType;
  score: number;
  answers: Answer[];
}

// StudentTestDetailsResponse — dùng chung cho node test và placement quiz
export interface StudentTestDetails {
  testId: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  passingPercentage?: number;
  questions: Question[];
}

// Một câu trả lời trong payload nộp bài
export interface QuestionSubmission {
  questionId: number;
  selectedAnswerIds?: number[];
  responseText?: string;
}

// AttemptSubmissionRequest
export interface AttemptSubmission {
  submissions: QuestionSubmission[];
}

// StudentTestAttempt (response khi start) — chỉ cần attemptId để nộp bài
export interface StudentTestAttempt {
  attemptId: number;
}

// AttemptSubmissionResultResponse — kết quả chấm node test
export interface AttemptResult {
  attemptId: number;
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
  passingPercentage: number;
}

// PlacementResultResponse — kết quả phân loại
export interface PlacementResult {
  testId: number;
  score: number;
  assignedLevel: number; // 1=yếu, 2=trung bình, 3=khá
}

// StudentLevelHistoryResponse
export interface LevelHistoryEntry {
  id: number;
  oldLevel: number | null;
  newLevel: number;
  reason: string; // PLACEMENT | GATE
  changedAt: string;
}

export interface SubmissionResponse {
  submissionId: number;
  exerciseId: number;
  nodeId: number;
  studentId: number;
  studentName: string;
  content?: string;
  fileUrl?: string;
  status: 'PENDING' | 'GRADED';
  grade?: number;
  feedback?: string;
  gradedById?: number;
  gradedByName?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface StudentTestAttemptHistoryResponse {
  attemptId: number;
  testId: number;
  classroomSubjectName: string;
  testTitle: string;
  testDescription: string;
  score: number;
  submittedAt: string;
}

export const studentService = {
  // Đồ thị lộ trình của một lớp-môn (kèm tiến độ học của SV hiện tại)
  getClassroomSubjectGraph: (classroomSubjectId: number) =>
    http.get<ClassroomGraphResponse>(
      `/student/classroom-subjects/${classroomSubjectId}/graph`
    ),

  // Nội dung 1 node (chỉ xem được node đã mở khóa)
  getNodeContent: (nodeId: number) =>
    http.get<NodeContentResponse>(`/student/learning-nodes/${nodeId}/content`),

  // ── Node test ──────────────────────────────────────────────────────────
  getTestDetails: (testId: number) =>
    http.get<StudentTestDetails>(`/student/tests/${testId}`),

  startAttempt: (testId: number) =>
    http.post<StudentTestAttempt>(`/student/tests/${testId}/attempts`),

  submitAttempt: (testId: number, attemptId: number, body: AttemptSubmission) =>
    http.post<AttemptResult>(
      `/student/tests/${testId}/attempts/${attemptId}/submit`,
      body
    ),

  getTestHistory: () =>
    http.get<StudentTestAttemptHistoryResponse[]>('/student/tests/attempts/history'),

  // ── Placement quiz (thi phân loại đầu vào) ───────────────────────────────
  getPlacementQuiz: (csId: number) =>
    http.get<StudentTestDetails>(
      `/student/classroom-subjects/${csId}/placement-quiz`
    ),

  startPlacementAttempt: (csId: number) =>
    http.post<StudentTestAttempt>(
      `/student/classroom-subjects/${csId}/placement-quiz/attempts`
    ),

  submitPlacement: (csId: number, attemptId: number, body: AttemptSubmission) =>
    http.post<PlacementResult>(
      `/student/classroom-subjects/${csId}/placement-quiz/attempts/${attemptId}/submit`,
      body
    ),

  getLevelHistory: (csId: number) =>
    http.get<LevelHistoryEntry[]>(
      `/student/classroom-subjects/${csId}/level-history`
    ),

  // ── Sub-mentor Support Q&A ───────────────────────────────
  listAssignedTickets: (csId: number) =>
    http.get<any[]>(
      `/student/support-tickets/assigned?classroomSubjectId=${csId}`
    ),

  respondSupportTicket: (ticketId: number, body: { messageResponse: string }) =>
    http.put<any>(
      `/student/support-tickets/${ticketId}/respond`,
      body
    ),

  escalateSupportTicket: (ticketId: number) =>
    http.post<any>(
      `/student/support-tickets/${ticketId}/escalate`,
      {}
    ),

  createSupportTicket: (body: { classroomSubjectId: number; messageStudent: string }) =>
    http.post<any>(
      `/student/support-tickets`,
      body
    ),

  listMyTickets: (csId: number) =>
    http.get<any[]>(
      `/student/support-tickets?classroomSubjectId=${csId}`
    ),

  submitExercise: (exerciseId: number, content?: string, file?: File) => {
    const formData = new FormData();
    if (content) {
      formData.append('content', content);
    }
    if (file) {
      formData.append('file', file);
    }
    return http.post<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions`, formData, {
      'Content-Type': 'multipart/form-data',
    });
  },

  getMySubmission: (exerciseId: number) =>
    http.get<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions/me`),
};
