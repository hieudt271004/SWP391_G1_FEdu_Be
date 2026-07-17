import { http } from './http';
import type { ClassroomGraphResponse, NodeContentResponse, LiveSessionState } from './learningPath.service';
import { uploadService } from './upload.service';



export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY';


export interface Answer {
  answerId: number;
  answerContent: string;
}


export interface Question {
  questionId: number;
  questionContent: string;
  questionType: QuestionType;
  score: number;
  answers: Answer[];
}


export interface StudentTestDetails {
  testId: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  passingPercentage?: number;
  
  releaseEndsAt?: string | null;
  questions: Question[];
}


export interface QuestionSubmission {
  questionId: number;
  selectedAnswerIds?: number[];
  responseText?: string;
}


export interface AttemptSubmission {
  submissions: QuestionSubmission[];
}


export interface StudentTestAttempt {
  attemptId: number;
}


export interface AttemptResult {
  attemptId: number;
  
  score: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string;
  passingPercentage: number;
  
  newLevel?: number | null;
  
  pendingManualGrading?: boolean | null;
}


export interface PlacementResult {
  testId: number;
  
  score: number | null;
  assignedLevel: number | null; 
  
  pendingManualGrading?: boolean | null;
}


export interface LevelHistoryEntry {
  id: number;
  oldLevel: number | null;
  newLevel: number;
  reason: string; 
  changedAt: string;
}


export interface PopQuizPendingResponse {
  assignmentId: number;
  title: string;
  durationMinutes: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  remainingSeconds?: number;
  score?: number;
}

export interface PopQuizPaperResponse {
  assignmentId: number;
  attemptId: number;
  title: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: Question[];
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
  exerciseTitle?: string;
}

export interface StudentTestAttemptHistoryResponse {
  attemptId: number;
  testId: number;
  classroomSubjectName: string;
  testTitle: string;
  testDescription: string;
  
  score: number | null;
  submittedAt: string;
}

export const studentService = {
  
  getClassroomSubjectGraph: (classroomSubjectId: number) =>
    http.get<ClassroomGraphResponse>(
      `/student/classroom-subjects/${classroomSubjectId}/graph`
    ),

  
  getNodeContent: (nodeId: number) =>
    http.get<NodeContentResponse>(`/student/learning-nodes/${nodeId}/content`),

  
  completeNode: (nodeId: number) =>
    http.post<void>(`/student/learning-nodes/${nodeId}/complete`, {}),

  
  completeMaterial: (materialId: number) =>
    http.post<void>(`/student/learning-materials/${materialId}/complete`, {}),

  
  getCompletedMaterials: () =>
    http.get<number[]>('/student/learning-materials/completed'),

  
  getTestDetails: (testId: number) =>
    http.get<StudentTestDetails>(`/student/tests/${testId}`),

  startAttempt: (testId: number) =>
    http.post<StudentTestAttempt>(`/student/tests/${testId}/attempts`),

  submitAttempt: (testId: number, attemptId: number, body: AttemptSubmission) =>
    http.post<AttemptResult>(
      `/student/tests/${testId}/attempts/${attemptId}/submit`,
      body
    ),

  
  recordTabOut: (testId: number, attemptId: number) =>
    http.patch<number>(`/student/tests/${testId}/attempts/${attemptId}/tab-out`),

  getTestHistory: () =>
    http.get<StudentTestAttemptHistoryResponse[]>('/student/tests/attempts/history'),

  
  getLiveState: (csId: number, nodeId: number) =>
    http.get<LiveSessionState>(`/student/classroom-subjects/${csId}/learning-nodes/${nodeId}/live-state`),

  
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

  
  
  
  submitExercise: async (exerciseId: number, contentOrFormData?: string | FormData, file?: File) => {
    const multipartHeaders = { 'Content-Type': 'multipart/form-data' };
    if (contentOrFormData instanceof FormData) {
      const fileInForm = contentOrFormData.get('file');
      if (fileInForm instanceof File) {
        const uploaded = await uploadService.uploadToCloudinary(fileInForm, 'submissions');
        contentOrFormData.delete('file');
        contentOrFormData.append('fileUrl', uploaded.url);
      }
      return http.post<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions`, contentOrFormData, multipartHeaders);
    }
    const formData = new FormData();
    if (contentOrFormData) {
      formData.append('content', contentOrFormData);
    }
    if (file) {
      const uploaded = await uploadService.uploadToCloudinary(file, 'submissions');
      formData.append('fileUrl', uploaded.url);
    }
    return http.post<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions`, formData, multipartHeaders);
  },

  getMyExerciseSubmission: (exerciseId: number) =>
    http.get<SubmissionResponse>(`/student/exercises/${exerciseId}/submissions/me`),


  getMySubmissionsForClassroomSubject: (classroomSubjectId: number) =>
    http.get<SubmissionResponse[]>(`/student/classroom-subjects/${classroomSubjectId}/my-submissions`),

  
  getPendingPopQuiz: (nodeId: number) =>
    http.get<PopQuizPendingResponse>(`/student/on-class/${nodeId}/pop-quiz/pending`),

  startPopQuizAttempt: (assignmentId: number) =>
    http.post<PopQuizPaperResponse>(`/student/pop-quiz/${assignmentId}/start`),

  getPopQuizPaper: (assignmentId: number) =>
    http.get<PopQuizPaperResponse>(`/student/pop-quiz/${assignmentId}/paper`),

  submitPopQuizAttempt: (assignmentId: number, body: AttemptSubmission) =>
    http.post<AttemptResult>(`/student/pop-quiz/${assignmentId}/submit`, body),

  getStudentSchedule: () =>
    http.get<StudentScheduleEntry[]>('/student/schedule'),

  createRetakeRequest: (body: RetakeRequestPayload) =>
    http.post<RetakeRequestResponse>('/student/retake-requests', body),

  getRetakeRequests: (csId: number) =>
    http.get<RetakeRequestResponse[]>(`/student/classroom-subjects/${csId}/retake-requests`),
};

export interface RetakeRequestResponse {
  id: number;
  studentId: number;
  studentEmail: string;
  studentName: string;
  classroomSubjectId: number;
  classroomSubjectName: string;
  testId: number;
  testTitle: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestReason?: string;
  rejectReason?: string;
  requestedAt: string;
  resolvedAt?: string;
  resolvedByName?: string;
}

export interface RetakeRequestPayload {
  classroomSubjectId: number;
  testId: number;
  requestReason?: string;
}

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
