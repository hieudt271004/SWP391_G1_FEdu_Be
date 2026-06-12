export interface ClassroomResponse {
  classroomId: number;
  className: string;
  semester?: string;
  description?: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  lecturerId?: number;
  lecturerName?: string;
  lecturerEmail?: string;
  lecturerFirstName?: string;
  lecturerLastName?: string;
  studentCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassroomRequest {
  subjectId: number;
  className: string;
  semester?: string;
  description?: string;
  lecturerId?: number;
}

export interface AssignTeacherRequest {
  teacherId: number;
}
