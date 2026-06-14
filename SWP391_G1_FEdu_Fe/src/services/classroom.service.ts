import { http } from './http';
import type {
  ClassroomResponse,
  ClassroomRequest,
  AssignTeacherRequest,
} from '../types/classroom';
import type { StudentInClass, AddStudentRequest } from '../types/student';

export const classroomService = {
  // ─── Classroom CRUD ──────────────────────────────────────────────────────
  getAll: () => http.get<ClassroomResponse[]>('/classrooms'),

  getById: (id: number) =>
    http.get<ClassroomResponse>(`/classrooms/${id}`),

  getBySubject: (subjectId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/subject/${subjectId}`),

  getByTeacher: (teacherId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/teacher/${teacherId}`),

  getByStudent: (studentId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/student/${studentId}`),

  create: (req: ClassroomRequest) =>
    http.post<ClassroomResponse>('/classrooms', req),

  update: (id: number, req: ClassroomRequest) =>
    http.put<ClassroomResponse>(`/classrooms/${id}`, req),

  delete: (id: number) => http.delete<void>(`/classrooms/${id}`),

  assignTeacher: (classroomId: number, req: AssignTeacherRequest) =>
    http.patch<ClassroomResponse>(
      `/classrooms/${classroomId}/assign-teacher`,
      req
    ),

  // ─── Students ────────────────────────────────────────────────────────────
  getStudents: (classroomId: number) =>
    http.get<StudentInClass[]>(`/classrooms/${classroomId}/students`),

  addStudent: (classroomId: number, req: AddStudentRequest) =>
    http.post<StudentInClass>(`/classrooms/${classroomId}/students`, req),

  removeStudent: (classroomId: number, studentId: number) =>
    http.delete<void>(
      `/classrooms/${classroomId}/students/${studentId}`
    ),
};
