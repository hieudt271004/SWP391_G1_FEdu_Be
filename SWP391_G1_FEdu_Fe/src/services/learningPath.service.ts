import { http } from './http';

export type LearningPathLevel = 1 | 2 | 3;
export type BranchType = 'MAIN' | 'SUB';

export interface CreateLearningPathRequest {
  subjectId: number;
  pathName: string;
  description?: string;
  level: LearningPathLevel;
}

export interface LearningPathResponse {
  pathId: number;
  subjectId: number;
  pathName: string;
  description: string;
  createdById: number;
  classroomSubjectId?: number | null;
  level?: LearningPathLevel | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningNodeResponse {
  nodeId: number;
  learningPathId?: number;
  classroomPathId?: number;
  title: string;
  description: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  branchName?: BranchType;
  displayOrder: number;
  status: 'LOCKED' | 'OPEN' | 'HIDDEN';
  isRequired: boolean;
  isDeleted: boolean;
  level?: number | null;
  stageOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NodeEdgeResponse {
  edgeId: number;
  fromNodeId: number;
  toNodeId: number;
  branchName?: BranchType;
  minScore?: number;
  maxScore?: number;
}

export interface LearningPathGraphResponse {
  pathId: number;
  pathName: string;
  description: string;
  nodes: LearningNodeResponse[];
  edges: NodeEdgeResponse[];
}

export interface AvailableTemplateResponse {
  pathId: number;
  pathName: string;
  description: string;
  nodeCount: number;
  lastUpdatedAt: string;
}

export interface PublishResultResponse {
  seededStudents: number;
}

export interface ClassroomGraphResponse {
  classroomSubjectId: number;
  state: 'NO_PATH' | 'DRAFT' | 'PUBLISHED';
  pathId: number | null;
  publishedAt: string | null;
  nodes: LearningNodeResponse[];
  edges: NodeEdgeResponse[];
  availableTemplates: AvailableTemplateResponse[] | null;
}

export interface CreateLearningNodeRequest {
  learningPathId?: number;
  classroomPathId?: number;
  title: string;
  description?: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  branchName?: BranchType;
  displayOrder: number;
  status?: 'LOCKED' | 'OPEN' | 'HIDDEN';
  isRequired?: boolean;
  stageOrder?: number;
  level?: number | null;
}

export interface UpdateLearningNodeRequest {
  title: string;
  description?: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  status?: 'LOCKED' | 'OPEN' | 'HIDDEN';
  displayOrder?: number;
  isRequired?: boolean;
  branchName?: BranchType;
}

export interface CreateNodeEdgeRequest {
  fromNodeId: number;
  toNodeId: number;
  branchName?: BranchType;
  minScore?: number;
  maxScore?: number;
}

export interface NodeMaterialResponse {
  materialId: number;
  title: string;
  required: boolean;
  video?: {
    videoId: number;
    videoUrl: string;
    title?: string;
    durationSeconds?: number;
    description?: string;
  };
  file?: {
    fileId: number;
    fileUrl: string;
    fileName?: string;
    fileType?: string;
    description?: string;
  };
  orderIndex: number;
}

export interface NodeTestResponse {
  testId: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  passingPercentage?: number;
  orderIndex: number;
}

export interface NodeContentResponse {
  materials: NodeMaterialResponse[];
  tests: NodeTestResponse[];
}

export interface CreateNodeTestRequest {
  title: string;
  description?: string;
  durationMinutes?: number;
  passingPercentage?: number;
}

export interface ReorderContentRequest {
  id: number;
  type: 'MATERIAL' | 'TEST';
  orderIndex: number;
}


export const learningPathService = {
  getSubjectLearningPaths: (subjectId: number) =>
    http.get<LearningPathResponse[]>(`/teacher-manage/subjects/${subjectId}/learning-paths`),
  createLearningPath: (request: CreateLearningPathRequest) =>
    http.post<LearningPathResponse>('/teacher-manage/learning-paths', request),
  getLearningPathGraph: (pathId: number) =>
    http.get<LearningPathGraphResponse>(`/teacher-manage/learning-paths/${pathId}/graph`),
  getClassroomGraph: (classroomSubjectId: number) =>
    http.get<ClassroomGraphResponse>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/graph`),
  // Admin read-only: xem graph lớp-môn (endpoint riêng cho ADMIN, không đụng /teacher-manage)
  getAdminClassroomGraph: (classroomSubjectId: number) =>
    http.get<ClassroomGraphResponse>(`/classrooms/subjects/${classroomSubjectId}/graph`),
  cloneFromTemplate: (classroomSubjectId: number, templatePathId: number) =>
    http.post<LearningPathResponse>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/clone-learning-path/${templatePathId}`),
  publishClassroomPath: (classroomSubjectId: number, pathId: number) =>
    http.post<PublishResultResponse>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/learning-paths/${pathId}/publish`),
  unpublishClassroomPath: (classroomSubjectId: number, pathId: number) =>
    http.post<void>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/learning-paths/${pathId}/unpublish`),
  deleteDraftPath: (classroomSubjectId: number, pathId: number) =>
    http.delete<void>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/learning-paths/${pathId}`),
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
  getAdminTemplateGraph: (pathId: number) =>
    http.get<LearningPathGraphResponse>(`/admin/learning-paths/${pathId}/graph`),
  createAdminNode: (request: CreateLearningNodeRequest) =>
    http.post<LearningNodeResponse>('/admin/learning-nodes', request),
  updateAdminNode: (nodeId: number, request: Partial<CreateLearningNodeRequest>) =>
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
  reorderTeacherNodeContent: (nodeId: number, requests: ReorderContentRequest[]) =>
    http.post<void>(`/teacher-manage/learning-nodes/${nodeId}/reorder-content`, requests),
};
