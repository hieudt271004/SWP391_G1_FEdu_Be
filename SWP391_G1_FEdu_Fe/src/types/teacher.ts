export interface Classroom {
  classroomSubjectId?: number;
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
  subjectCode?: string;
  subjectName?: string;
  studentCount?: number;
}

