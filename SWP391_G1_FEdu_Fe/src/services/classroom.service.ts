import { http } from './http';
import { apiClient } from './api.client';
import type { ClassroomResponse, ClassroomRequest } from '../types/classroom';
import type {
  ClassroomSubjectResponse,
  AddClassroomSubjectRequest,
  ChangeLecturerRequest,
} from '../types/classroomSubject';
import type { StudentInClass, AddStudentRequest, ImportStudentsResult } from '../types/student';

export const classroomService = {
  
  getAll: () => http.get<ClassroomResponse[]>('/classrooms'),

  getById: (id: number) => http.get<ClassroomResponse>(`/classrooms/${id}`),

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

  
  getSubjectsOfClassroom: (classroomId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/classrooms/${classroomId}/subjects`),

  
  getClassroomsBySubject: (subjectId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/classrooms/subjects/by-subject/${subjectId}`),

  
  getClassroomSubjectsByStudent: (studentId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/classrooms/subjects/by-student/${studentId}`),

  
  getClassroomSubjectsByLecturer: (lecturerId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/classrooms/subjects/by-lecturer/${lecturerId}`),

  addSubject: (classroomId: number, req: AddClassroomSubjectRequest) =>
    http.post<ClassroomSubjectResponse>(`/classrooms/${classroomId}/subjects`, req),

  changeLecturer: (classroomSubjectId: number, req: ChangeLecturerRequest) =>
    http.patch<ClassroomSubjectResponse>(
      `/classrooms/subjects/${classroomSubjectId}/lecturer`,
      req
    ),

  removeSubject: (classroomSubjectId: number) =>
    http.delete<void>(`/classrooms/subjects/${classroomSubjectId}`),

  
  getStudents: (classroomSubjectId: number) =>
    http.get<StudentInClass[]>(`/classroom-subjects/${classroomSubjectId}/students`),

  addStudent: (classroomSubjectId: number, req: AddStudentRequest) =>
    http.post<StudentInClass>(`/classroom-subjects/${classroomSubjectId}/students`, req),

  removeStudent: (classroomSubjectId: number, studentId: number) =>
    http.delete<void>(`/classroom-subjects/${classroomSubjectId}/students/${studentId}`),

  
  importStudents: (classroomSubjectId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<ImportStudentsResult>(
      `/classroom-subjects/${classroomSubjectId}/students/import`,
      form,
      { 'Content-Type': 'multipart/form-data' }
    );
  },

  downloadImportTemplate: async (classroomSubjectId: number) => {
    const res = await apiClient.get(
      `/classroom-subjects/${classroomSubjectId}/students/import/template`,
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
