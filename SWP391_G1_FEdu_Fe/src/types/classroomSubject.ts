

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
}

export interface AddClassroomSubjectRequest {
  subjectId: number;
  lecturerId: number;
}

export interface ChangeLecturerRequest {
  lecturerId: number;
}
