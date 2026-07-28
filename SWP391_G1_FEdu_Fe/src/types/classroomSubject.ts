import type { ClassroomStatus, Term } from '../utils/classroom';

export interface ClassroomSubjectResponse {
  classroomSubjectId: number;
  classroomId: number;
  className: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  lecturerId: number;
  lecturerName: string;
  displayName: string;
  studentCount: number;
  isSubmentor?: boolean;

  // Trạng thái + "Kì học" của lớp cha (backend trả kèm để list giảng viên hiển thị đúng).
  status?: ClassroomStatus;
  term?: Term;
  academicYear?: number;
  semesterLabel?: string;

  // % tiến độ lộ trình của học sinh (chỉ có ở API by-student). null = chưa publish lộ trình.
  progressPercent?: number | null;
}

export interface AddClassroomSubjectRequest {
  subjectId: number;
  lecturerId: number;
}

export interface ChangeLecturerRequest {
  lecturerId: number;
}
