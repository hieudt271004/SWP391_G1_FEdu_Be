import type { ClassroomStatus, Term } from '../utils/classroom';

export interface ClassroomResponse {
  classroomId: number;
  className: string;
  // "Kì học": id học kỳ đã liên kết (FK) + term/academicYear/nhãn suy ra từ nó.
  semesterId?: number;
  term?: Term;
  academicYear?: number;
  semesterLabel?: string;
  description?: string;
  subjectCount?: number;
  studentCount: number;
  status?: ClassroomStatus;
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

// Trạng thái vòng đời KHÔNG gửi qua đây — chỉ đổi qua classroomService.updateStatus (admin).
export interface ClassroomRequest {
  className: string;
  // "Kì học": chỉ gửi id học kỳ đã cấu hình (thay cho term + academicYear).
  semesterId?: number | null;
  description?: string;
}
