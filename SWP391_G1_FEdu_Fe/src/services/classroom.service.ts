import { http } from './http';
import type { ClassroomResponse, ClassroomRequest } from '../types/classroom';
import type {
  ClassroomSubjectResponse,
  AddClassroomSubjectRequest,
  ChangeLecturerRequest,
} from '../types/classroomSubject';
import type { StudentInClass, AddStudentRequest } from '../types/student';

export const classroomService = {
  // ─── Classroom CRUD (ADMIN) ────────────────────────────────────────────────
  getAll: () => http.get<ClassroomResponse[]>('/classrooms'),

  getById: (id: number) => http.get<ClassroomResponse>(`/classrooms/${id}`),

  getBySubject: (subjectId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/subject/${subjectId}`),

  getByTeacher: (teacherId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/teacher/${teacherId}`),

  getByStudent: (studentId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/student/${studentId}`),

  // Tạo lớp = chỉ container (không kèm môn/GV). Gán môn qua addSubject().
  create: (req: ClassroomRequest) =>
    http.post<ClassroomResponse>('/classrooms', req),

  update: (id: number, req: ClassroomRequest) =>
    http.put<ClassroomResponse>(`/classrooms/${id}`, req),

  delete: (id: number) => http.delete<void>(`/classrooms/${id}`),

  // ─── Lớp-môn (ClassroomSubject) ──────────────────────────────────────────────
  getSubjectsOfClassroom: (classroomId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/classrooms/${classroomId}/subjects`),

  // Danh sách lớp-môn đang mở 1 môn (theo subjectId)
  getClassroomsBySubject: (subjectId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/classrooms/subjects/by-subject/${subjectId}`),

  // Danh sách lớp-môn mà 1 sinh viên đang học (theo studentId)
  getClassroomSubjectsByStudent: (studentId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/classrooms/subjects/by-student/${studentId}`),

  addSubject: (classroomId: number, req: AddClassroomSubjectRequest) =>
    http.post<ClassroomSubjectResponse>(`/classrooms/${classroomId}/subjects`, req),

  changeLecturer: (classroomSubjectId: number, req: ChangeLecturerRequest) =>
    http.patch<ClassroomSubjectResponse>(
      `/classrooms/subjects/${classroomSubjectId}/lecturer`,
      req
    ),

  removeSubject: (classroomSubjectId: number) =>
    http.delete<void>(`/classrooms/subjects/${classroomSubjectId}`),

  // ─── Roster theo lớp-môn (classroomSubjectId, KHÔNG phải classroomId) ────────
  getStudents: (classroomSubjectId: number) =>
    http.get<StudentInClass[]>(`/classroom-subjects/${classroomSubjectId}/students`),

  addStudent: (classroomSubjectId: number, req: AddStudentRequest) =>
    http.post<StudentInClass>(`/classroom-subjects/${classroomSubjectId}/students`, req),

  removeStudent: (classroomSubjectId: number, studentId: number) =>
    http.delete<void>(`/classroom-subjects/${classroomSubjectId}/students/${studentId}`),
};
