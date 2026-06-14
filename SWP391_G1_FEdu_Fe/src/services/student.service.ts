import { http } from './http';
import type { ClassroomGraphResponse, NodeContentResponse } from './learningPath.service';

export const studentService = {
  // Đồ thị lộ trình của một lớp-môn (kèm tiến độ học của SV hiện tại)
  getClassroomSubjectGraph: (classroomSubjectId: number) =>
    http.get<ClassroomGraphResponse>(
      `/student/classroom-subjects/${classroomSubjectId}/graph`
    ),

  // Nội dung 1 node (chỉ xem được node đã mở khóa)
  getNodeContent: (nodeId: number) =>
    http.get<NodeContentResponse>(`/student/learning-nodes/${nodeId}/content`),
};
