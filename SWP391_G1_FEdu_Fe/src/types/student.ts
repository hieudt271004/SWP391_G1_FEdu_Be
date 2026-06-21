// Khớp chính xác với BE StudentInClassResponse
export interface StudentInClass {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  joinedAt?: string;
  currentLevel?: number;
  assignedPathName?: string;
}

export interface AddStudentRequest {
  email: string;
}

// Khớp BE ImportRowError / ImportStudentsResult
export interface ImportRowError {
  rowNumber: number;
  email: string;
  reason: string;
}

export interface ImportStudentsResult {
  totalRows: number;
  created: number;
  enrolled: number;
  skipped: number;
  failed: number;
  errors: ImportRowError[];
}
