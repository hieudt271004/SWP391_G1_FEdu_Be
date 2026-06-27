export interface SubMentorStudentAssignmentResponse {
  id: number;
  subMentorCssId: number;
  subMentorName: string;
  subMentorEmail: string;
  studentCssId: number;
  studentName: string;
  studentEmail: string;
  assignedAt: string;
}

export interface SubMentorStudentAssignmentRequest {
  subMentorCssId: number;
  studentCssId: number;
}

export interface SupportTicketResponse {
  ticketId: number;
  classroomSubjectStudentId: number;
  studentName: string;
  studentEmail: string;
  messageStudent: string;
  messageResponse?: string;
  status: 'NONE' | 'DONE' | 'SEND';
  createdAt: string;
  updatedAt: string;
}

export interface RespondTicketRequest {
  messageResponse: string;
}
