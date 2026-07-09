import { http } from './http';
import type { ClassroomGraphResponse, NodeContentResponse, LiveSessionState } from './learningPath.service';

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
  /** Hạn nộp CHUNG cả lớp của đề phát trong buổi live; null = chỉ tính giờ theo durationMinutes. */
  releaseEndsAt?: string | null;
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
  nodeId?: number;
  studentId: number;
  studentName: string;
  content?: string;
  fileUrl?: string;
  status: string;
  grade?: number | null;
  feedback?: string | null;
  gradedById?: number | null;
  gradedByName?: string | null;
  submittedAt: string;
  gradedAt?: string | null;
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

  // Đánh dấu hoàn thành một node không có bài test
  completeNode: (nodeId: number) =>
    http.post<void>(`/student/learning-nodes/${nodeId}/complete`, {}),

  // Đánh dấu hoàn thành một học liệu
  completeMaterial: (materialId: number) =>
    http.post<void>(`/student/learning-materials/${materialId}/complete`, {}),

  // Lấy danh sách ID các học liệu đã hoàn thành
  getCompletedMaterials: () =>
    http.get<number[]>('/student/learning-materials/completed'),

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

  // Chống gian lận: ghi nhận 1 lần rời tab khi đang làm bài; trả về tổng số lần của lượt thi.
  recordTabOut: (testId: number, attemptId: number) =>
    http.patch<number>(`/student/tests/${testId}/attempts/${attemptId}/tab-out`),

  getTestHistory: () =>
    http.get<StudentTestAttemptHistoryResponse[]>('/student/tests/attempts/history'),

  // Buổi học live: polling trạng thái ~5s (tài liệu mới, đề đang phát + hạn nộp chung)
  getLiveState: (csId: number, nodeId: number) =>
    http.get<LiveSessionState>(`/student/classroom-subjects/${csId}/learning-nodes/${nodeId}/live-state`),

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

  submitExercise: (exerciseId: number, contentOrFormData?: string | FormData, file?: File) => {
    if (contentOrFormData instanceof FormData) {
      return http.post<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions`, contentOrFormData);
    }
    const formData = new FormData();
    if (contentOrFormData) {
      formData.append('content', contentOrFormData);
    }
    if (file) {
      formData.append('file', file);
    }
    return http.post<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions`, formData);
  },

  getMyExerciseSubmission: (exerciseId: number) =>
    http.get<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions/me`),

  getStudentSchedule: () =>
    http.get<StudentScheduleEntry[]>('/student/schedule'),
};

export interface StudentScheduleEntry {
  nodeId: number;
  title: string;
  description: string;
  studyDate: string;
  slotId?: number;
  slotName?: string;
  startTime?: string;
  endTime?: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  classroomSubjectId: number;
  status: 'LOCKED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
}
