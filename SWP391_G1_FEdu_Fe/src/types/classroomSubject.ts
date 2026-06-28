// Lớp-môn (ClassroomSubject): mỗi (lớp, môn) là một lớp học độc lập
// — giảng viên, sinh viên, lộ trình riêng. Khớp BE ClassroomSubjectResponse.
export interface ClassroomSubjectResponse {
  classroomSubjectId: number;
  classroomId: number;
  className: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  lecturerId: number;
  lecturerName: string;
  displayName: string; // "Tên lớp - Mã môn", vd "SE1801 - PRJ301"
  studentCount: number;
  isSubmentor?: boolean;
}

export interface AddClassroomSubjectRequest {
  subjectId: number;
  lecturerId: number;
}

export interface ChangeLecturerRequest {
  lecturerId: number;
}
