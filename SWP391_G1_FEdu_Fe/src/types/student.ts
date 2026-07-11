
export interface StudentInClass {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  joinedAt?: string;
  currentLevel?: number;
  assignedPathName?: string;
  classroomSubjectStudentId?: number;
  isSubmentor?: boolean;
}

export interface AddStudentRequest {
  email: string;
}


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
