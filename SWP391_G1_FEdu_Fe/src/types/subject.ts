

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
  status?: string;
  learningpathLength?: number;
}

export interface SubjectRequest {
  subjectCode: string;
  subjectName: string;
  description?: string;
  status?: string;
  learningpathLength?: number;
}
