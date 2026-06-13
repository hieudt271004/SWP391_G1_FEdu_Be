export interface Classroom {
  classroomId: number;
  classroomCode: string;
  classroomName: string;
  subjectId: number;
  teacherId: number;
  semester?: string;
  year?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

