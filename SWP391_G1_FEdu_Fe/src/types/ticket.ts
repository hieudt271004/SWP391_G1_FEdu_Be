export type TicketStatus = 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';

export interface SupportTicketResponse {
  ticketId: number;
  title: string;
  description: string;
  status: TicketStatus;
  studentName: string;
  studentEmail: string;
  className: string;
  subjectName: string;
  createdAt: string;
}

export interface TicketCommentResponse {
  commentId: number;
  commenterName: string;
  commenterEmail: string;
  content: string;
  createdAt: string;
}

export interface SupportTicketDetailResponse {
  ticketId: number;
  title: string;
  description: string;
  status: TicketStatus;
  studentName: string;
  studentEmail: string;
  className: string;
  subjectName: string;
  comments: TicketCommentResponse[];
  createdAt: string;
}
