// Khớp chính xác với BE Subject entity JSON response
// subjectId, subjectCode, subjectName, description, isDeleted, createdAt, updatedAt
export interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  description?: string;
  isDeleted?: boolean;
  createdBy?: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectRequest {
  subjectCode: string;
  subjectName: string;
  description?: string;
}
