import { http } from './http';
import type { Subject } from '../types/subject';
import type { ClassroomResponse } from '../types/classroom';
import type { StudentInClass } from '../types/student';
import type { ClassroomSubjectResponse } from '../types/classroomSubject';
import type {
  SubMentorStudentAssignmentResponse,
  SubMentorStudentAssignmentRequest,
  SupportTicketResponse,
  RespondTicketRequest,
} from '../types/submentor';
import type { SubmissionResponse } from './student.service';

// ── Pop Quiz types ──────────────────────────────────────────────────────────
export interface CreatePopQuizRequest {
  title: string;
  durationMinutes?: number;
  closeAt?: string;
  studentIds: number[];
  questions?: {
    questionContent: string;
    questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE';
    score: number;
    answers: {
      answerContent: string;
      isCorrect: boolean;
    }[];
  }[];
  existingTestId?: number;
}

export interface PopQuizAssignmentResponse {
  assignmentId: number;
  testId: number;
  nodeId: number;
  classroomSubjectId: number;
  status: 'OPEN' | 'CLOSED';
}

export interface PopQuizResultsResponse {
  assignmentId: number;
  title: string;
  status: 'OPEN' | 'CLOSED';
  students: {
    studentId: number;
    studentName: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    score?: number;
    tabOutCount?: number;
  }[];
}

export const teacherService = {
  getSubjectsByTeacher: (teacherId: number) =>
    http.get<Subject[]>(`/teacher/subjects/${teacherId}`),
  getClassroomsByTeacher: (teacherId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/teacher/classrooms/${teacherId}`),
  getClassroomById: (classroomId: number) =>
    http.get<ClassroomResponse>(`/classrooms/${classroomId}`),
  getClassroomSubjectById: (classroomSubjectId: number) =>
    http.get<ClassroomSubjectResponse>(`/teacher/classroom-subjects/${classroomSubjectId}`),
  getStudentsInClassroom: (classroomId: number) =>
    http.get<StudentInClass[]>(`/classrooms/${classroomId}/students`),
  getClassroomsBySubject: (subjectId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/subject/${subjectId}`),
  getSubjectById: (subjectId: number) =>
    http.get<Subject>(`/subjects/${subjectId}`),
  cancelStudentPlacement: (csId: number, studentId: number) =>
    http.post<void>(`/teacher-manage/classroom-subjects/${csId}/students/${studentId}/placement/cancel`),

  // ─── Sub-mentor & Support Tickets ──────────────────────────────────────────
  enableSubMentor: (classroomSubjectId: number, cssId: number) =>
    http.post<void>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/sub-mentors/${cssId}/enable`),

  disableSubMentor: (classroomSubjectId: number, cssId: number) =>
    http.post<void>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/sub-mentors/${cssId}/disable`),

  listAssignments: (classroomSubjectId: number) =>
    http.get<SubMentorStudentAssignmentResponse[]>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/assignments`),

  createAssignment: (classroomSubjectId: number, req: SubMentorStudentAssignmentRequest) =>
    http.post<SubMentorStudentAssignmentResponse>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/assignments`, req),

  deleteAssignment: (classroomSubjectId: number, assignmentId: number) =>
    http.delete<void>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/assignments/${assignmentId}`),

  listEscalatedTickets: (classroomSubjectId: number) =>
    http.get<SupportTicketResponse[]>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/tickets/escalated`),

  respondAsTeacher: (classroomSubjectId: number, ticketId: number, req: RespondTicketRequest) =>
    http.put<SupportTicketResponse>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/tickets/${ticketId}/respond`, req),

  listSubmissions: (exerciseId: number) =>
    http.get<SubmissionResponse[]>(`/teacher-manage/exercises/${exerciseId}/submissions`),

  gradeSubmission: (submissionId: number, grade: number, feedback?: string) =>
    http.put<SubmissionResponse>(`/teacher-manage/submissions/${submissionId}/grade`, { grade, feedback }),

  // ─── Pop Quiz ──────────────────────────────────────────────────────────────
  getActivePopQuiz: (nodeId: number) =>
    http.get<PopQuizAssignmentResponse>(`/teacher-manage/on-class/${nodeId}/pop-quiz/active`),

  createPopQuiz: (nodeId: number, req: CreatePopQuizRequest) =>
    http.post<PopQuizAssignmentResponse>(`/teacher-manage/on-class/${nodeId}/pop-quiz`, req),

  getPopQuizResults: (assignmentId: number) =>
    http.get<PopQuizResultsResponse>(`/teacher-manage/pop-quiz/${assignmentId}/results`),

  resetPopQuizStudent: (assignmentId: number, cssId: number) =>
    http.post<void>(`/teacher-manage/pop-quiz/${assignmentId}/students/${cssId}/reset`, {}),

  closePopQuiz: (assignmentId: number) =>
    http.post<void>(`/teacher-manage/pop-quiz/${assignmentId}/close`, {}),
};