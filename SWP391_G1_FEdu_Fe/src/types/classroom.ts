export interface ClassroomResponse {
  classroomId: number;
  className: string;
  semester?: string;
  description?: string;
  subjectCount?: number;
  studentCount: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;

  
  
  subjectId?: number;
  subjectCode?: string;
  subjectName?: string;
  lecturerId?: number;
  lecturerName?: string;
  lecturerEmail?: string;
  lecturerFirstName?: string;
  lecturerLastName?: string;
}

export interface ClassroomRequest {
  className: string;
  semester?: string;
  description?: string;
  status?: string;
}
