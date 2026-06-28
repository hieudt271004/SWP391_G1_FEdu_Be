import { http } from './http';

export interface CreateLearningPathRequest {
  subjectId: number;
  pathName: string;
  description?: string;
}

export interface UpdateLearningPathRequest {
  pathName: string;
  description?: string;
}

export interface LearningPathResponse {
  pathId: number;
  subjectId: number;
  pathName: string;
  description?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CreateLearningNodeRequest {
  classroomPathId: number;
  title: string;
  description?: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  displayOrder: number;
  status: 'LOCKED' | 'OPEN' | 'PASSED';
  isRequired: boolean;
}

export interface UpdateLearningNodeRequest {
  title: string;
  description?: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  displayOrder: number;
  status: 'LOCKED' | 'OPEN' | 'PASSED';
  isRequired: boolean;
}

export interface LearningNodeResponse {
  nodeId: number;
  classroomPathId: number;
  title: string;
  description?: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  displayOrder: number;
  status: 'LOCKED' | 'OPEN' | 'PASSED';
  isRequired: boolean;
  testKind?: 'PLACEMENT' | 'REGULAR';
}

export interface CreateNodeEdgeRequest {
  fromNodeId: number;
  toNodeId: number;
}

export interface NodeEdgeResponse {
  edgeId: number;
  fromNodeId: number;
  toNodeId: number;
  minScore: number;
  maxScore: number;
}

export interface CreateNodeMaterialRequest {
  title: string;
  materialType: 'VIDEO' | 'FILE';
  requiredToPass: boolean;
  videoUrl?: string;
  fileUrl?: string;
}

export interface NodeMaterialResponse {
  materialId: number;
  nodeId: number;
  title: string;
  materialType: 'VIDEO' | 'FILE';
  requiredToPass: boolean;
  video?: {
    videoId: number;
    videoUrl: string;
  };
  file?: {
    fileId: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
}

export interface CreateNodeTestRequest {
  title: string;
  durationMinutes: number;
  passingPercentage: number;
}

export interface NodeTestResponse {
  testId: number;
  nodeId: number;
  title: string;
  durationMinutes: number;
  passingPercentage: number;
}

export interface CreateNodeExerciseRequest {
  title: string;
  description?: string;
  requiredToPass: boolean;
}

export interface NodeExerciseResponse {
  exerciseId: number;
  nodeId: number;
  title: string;
  description?: string;
  requiredToPass: boolean;
}

export interface ReorderContentRequest {
  contentType: 'MATERIAL' | 'TEST' | 'EXERCISE';
  contentId: number;
  displayOrder: number;
}

export interface NodeContentResponse {
  materials: NodeMaterialResponse[];
  tests: NodeTestResponse[];
  exercises: NodeExerciseResponse[];
}

export interface PlacementQuizDetailsResponse {
  testId: number;
  title: string;
  description?: string;
  durationMinutes: number;
  passingPercentage: number;
  scoreBands: ScoreBandResponse[];
}

export interface ScoreBandResponse {
  bandId: number;
  testId: number;
  minScore: number;
  maxScore: number;
  targetLevel: number;
}

export interface TeacherQuestionRequest {
  questionContent: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  score: number;
  answers: {
    answerContent: string;
    isCorrect: boolean;
  }[];
}

export interface TeacherQuestionResponse {
  questionId: number;
  questionContent: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  score: number;
  answers: {
    answerId: number;
    answerContent: string;
    isCorrect: boolean;
  }[];
}

export interface StudentAttemptResponse {
  attemptId: number;
  studentName: string;
  studentEmail: string;
  score: number;
  startedAt: string;
  submittedAt: string;
  status: 'STARTED' | 'SUBMITTED';
}

export const learningPathService = {
  // Path template endpoints
  getLearningPath: (subjectId: number) =>
    http.get<LearningPathResponse>(`/teacher-manage/subjects/${subjectId}/learning-path`),
  createLearningPath: (request: CreateLearningPathRequest) =>
    http.post<LearningPathResponse>('/teacher-manage/learning-paths', request),
  updateLearningPath: (pathId: number, request: UpdateLearningPathRequest) =>
    http.put<LearningPathResponse>(`/teacher-manage/learning-paths/${pathId}`, request),
  deleteLearningPath: (pathId: number) =>
    http.delete<void>(`/teacher-manage/learning-paths/${pathId}`),
  getLearningPathById: (pathId: number) =>
    http.get<LearningPathResponse>(`/teacher-manage/learning-paths/${pathId}`),
  getLearningPathsBySubjectId: (subjectId: number) =>
    http.get<LearningPathResponse[]>(`/teacher-manage/subjects/${subjectId}/learning-paths`),
  
  // Publish/Clone actions
  publishLearningPath: (pathId: number) =>
    http.post<void>(`/teacher-manage/learning-paths/${pathId}/publish`),
  cloneFromTemplate: (classroomSubjectId: number, templatePathId: number) =>
    http.post<LearningPathResponse>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/clone-template/${templatePathId}`),
  deleteDraftPath: (classroomSubjectId: number) =>
    http.delete<void>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/learning-path-draft`),

  // Node endpoints
  getLearningNodes: (pathId: number) =>
    http.get<LearningNodeResponse[]>(`/teacher-manage/learning-paths/${pathId}/nodes`),
  createLearningNode: (request: CreateLearningNodeRequest) =>
    http.post<LearningNodeResponse>('/teacher-manage/learning-nodes', request),
  updateLearningNode: (nodeId: number, request: UpdateLearningNodeRequest) =>
    http.put<LearningNodeResponse>(`/teacher-manage/learning-nodes/${nodeId}`, request),
  deleteLearningNode: (nodeId: number) =>
    http.delete<void>(`/teacher-manage/learning-nodes/${nodeId}`),
  createNodeEdge: (request: CreateNodeEdgeRequest) =>
    http.post<NodeEdgeResponse>('/teacher-manage/node-edges', request),

  // Admin template endpoints
  getAdminSubjectTemplates: (subjectId: number) =>
    http.get<LearningPathResponse[]>(`/admin/subjects/${subjectId}/learning-paths`),
  createAdminTemplate: (request: CreateLearningPathRequest) =>
    http.post<LearningPathResponse>('/admin/learning-paths', request),
  updateAdminTemplate: (pathId: number, request: { pathName: string; description?: string }) =>
    http.put<LearningPathResponse>(`/admin/learning-paths/${pathId}`, request),
  deleteAdminTemplate: (pathId: number) =>
    http.delete<void>(`/admin/learning-paths/${pathId}`),
  publishAdminTemplate: (pathId: number) =>
    http.post<void>(`/admin/learning-paths/${pathId}/publish`),

  // Admin node endpoints
  getAdminNodes: (pathId: number) =>
    http.get<LearningNodeResponse[]>(`/admin/learning-paths/${pathId}/nodes`),
  createAdminNode: (request: CreateLearningNodeRequest) =>
    http.post<LearningNodeResponse>('/admin/learning-nodes', request),
  updateAdminNode: (nodeId: number, request: UpdateLearningNodeRequest) =>
    http.put<LearningNodeResponse>(`/admin/learning-nodes/${nodeId}`, request),
  deleteAdminNode: (nodeId: number) =>
    http.delete<void>(`/admin/learning-nodes/${nodeId}`),
  createAdminEdge: (request: CreateNodeEdgeRequest) =>
    http.post<NodeEdgeResponse>('/admin/node-edges', request),
  deleteAdminEdge: (edgeId: number) =>
    http.delete<void>(`/admin/node-edges/${edgeId}`),

  // Admin node content endpoints
  getAdminNodeContent: (nodeId: number) =>
    http.get<NodeContentResponse>(`/admin/learning-nodes/${nodeId}/content`),
  addAdminNodeMaterial: (nodeId: number, formData: FormData) =>
    http.post<NodeMaterialResponse>(`/admin/learning-nodes/${nodeId}/materials`, formData, {
      'Content-Type': 'multipart/form-data',
    }),
  deleteAdminNodeMaterial: (materialId: number) =>
    http.delete<void>(`/admin/materials/${materialId}`),
  addAdminNodeTest: (nodeId: number, request: CreateNodeTestRequest) =>
    http.post<NodeTestResponse>(`/admin/learning-nodes/${nodeId}/tests`, request),
  deleteAdminNodeTest: (testId: number) =>
    http.delete<void>(`/admin/tests/${testId}`),
  getAdminTestQuestions: (testId: number) =>
    http.get<TeacherQuestionResponse[]>(`/admin/tests/${testId}/questions`),
  addAdminTestQuestion: (testId: number, request: TeacherQuestionRequest) =>
    http.post<TeacherQuestionResponse>(`/admin/tests/${testId}/questions`, request),
  updateAdminTestQuestion: (questionId: number, request: TeacherQuestionRequest) =>
    http.put<TeacherQuestionResponse>(`/admin/test-questions/${questionId}`, request),
  deleteAdminTestQuestion: (questionId: number) =>
    http.delete<void>(`/admin/test-questions/${questionId}`),
  addAdminNodeExercise: (nodeId: number, request: CreateNodeExerciseRequest) =>
    http.post<NodeExerciseResponse>(`/admin/learning-nodes/${nodeId}/exercises`, request),
  deleteAdminNodeExercise: (exerciseId: number) =>
    http.delete<void>(`/admin/exercises/${exerciseId}`),
  reorderAdminNodeContent: (nodeId: number, requests: ReorderContentRequest[]) =>
    http.post<void>(`/admin/learning-nodes/${nodeId}/reorder-content`, requests),

  // Teacher node content endpoints
  getTeacherNodeContent: (nodeId: number) =>
    http.get<NodeContentResponse>(`/teacher-manage/learning-nodes/${nodeId}/content`),
  addTeacherNodeMaterial: (nodeId: number, formData: FormData) =>
    http.post<NodeMaterialResponse>(`/teacher-manage/learning-nodes/${nodeId}/materials`, formData, {
      'Content-Type': 'multipart/form-data',
    }),
  deleteTeacherNodeMaterial: (materialId: number) =>
    http.delete<void>(`/teacher-manage/materials/${materialId}`),
  addTeacherNodeTest: (nodeId: number, request: CreateNodeTestRequest) =>
    http.post<NodeTestResponse>(`/teacher-manage/learning-nodes/${nodeId}/tests`, request),
  deleteTeacherNodeTest: (testId: number) =>
    http.delete<void>(`/teacher-manage/tests/${testId}`),
  addTeacherNodeExercise: (nodeId: number, request: CreateNodeExerciseRequest) =>
    http.post<NodeExerciseResponse>(`/teacher-manage/learning-nodes/${nodeId}/exercises`, request),
  deleteTeacherNodeExercise: (exerciseId: number) =>
    http.delete<void>(`/teacher-manage/exercises/${exerciseId}`),
  reorderTeacherNodeContent: (nodeId: number, requests: ReorderContentRequest[]) =>
    http.post<void>(`/teacher-manage/learning-nodes/${nodeId}/reorder-content`, requests),

  // Teacher Placement & Question endpoints
  getPlacementQuizDetails: (csId: number) =>
    http.get<PlacementQuizDetailsResponse>(`/teacher-manage/classroom-subjects/${csId}/placement-quiz`),
  createPlacementQuiz: (csId: number, request: { title: string; description?: string; durationMinutes: number }) =>
    http.post<PlacementQuizDetailsResponse>(`/teacher-manage/classroom-subjects/${csId}/placement-quiz`, request),
  updateScoreBands: (testId: number, bands: { minScore: number; maxScore: number; targetLevel: number }[]) =>
    http.put<ScoreBandResponse[]>(`/teacher-manage/tests/${testId}/score-bands`, bands),
  getPlacementQuestions: (testId: number) =>
    http.get<TeacherQuestionResponse[]>(`/teacher-manage/tests/${testId}/questions`),
  addPlacementQuestion: (testId: number, request: TeacherQuestionRequest) =>
    http.post<TeacherQuestionResponse>(`/teacher-manage/tests/${testId}/questions`, request),
  updatePlacementQuestion: (questionId: number, request: TeacherQuestionRequest) =>
    http.put<TeacherQuestionResponse>(`/teacher-manage/test-questions/${questionId}`, request),
  deletePlacementQuestion: (questionId: number) =>
    http.delete<void>(`/teacher-manage/test-questions/${questionId}`),
  getStudentLevelHistory: (csId: number, studentId: number) =>
    http.get<any[]>(`/teacher-manage/classroom-subjects/${csId}/students/${studentId}/level-history`),
};
