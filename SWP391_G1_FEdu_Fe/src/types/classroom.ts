export interface ClassroomResponse {
  classroomId: number;
  className: string;
  semester?: string;
  description?: string;
  subjectCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;

  // ⚠️ Deprecated — mô hình cũ "1 lớp = 1 môn". BE không còn trả các field này
  // (môn/giảng viên giờ thuộc ClassroomSubject). Giữ optional để migrate dần.
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
