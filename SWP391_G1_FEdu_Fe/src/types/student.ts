// Khớp chính xác với BE StudentInClassResponse
export interface StudentInClass {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  joinedAt?: string;
}

export interface AddStudentRequest {
  email: string;
}
