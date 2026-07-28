import type { ClassroomStatus, Term } from '../utils/classroom';

export interface ClassroomResponse {
  classroomId: number;
  className: string;
  // "Kì học" tách cấu trúc + nhãn dựng sẵn từ backend.
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
  term?: Term | null;
  academicYear?: number | null;
  description?: string;
}
