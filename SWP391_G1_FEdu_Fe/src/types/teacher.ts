import type { ClassroomStatus, Term } from '../utils/classroom';

export interface Classroom {
  classroomSubjectId?: number;
  classroomId: number;
  classroomCode: string;
  classroomName: string;
  subjectId: number;
  teacherId: number;
  term?: Term;
  academicYear?: number;
  semesterLabel?: string;
  status?: ClassroomStatus;
  createdAt?: string;
  updatedAt?: string;
  subjectCode?: string;
  subjectName?: string;
  studentCount?: number;
}

