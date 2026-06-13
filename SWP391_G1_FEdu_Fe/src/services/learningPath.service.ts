import { http } from './http';

export interface CreateLearningPathRequest {
  subjectId: number;
  pathName: string;
  description?: string;
}

export interface LearningPathResponse {
  pathId: number;
  subjectId: number;
  pathName: string;
  description: string;
  createdById: number;
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
  branchName?: string;
  displayOrder: number;
  status: 'LOCKED' | 'OPEN' | 'HIDDEN';
  isRequired: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NodeEdgeResponse {
  edgeId: number;
  fromNodeId: number;
  toNodeId: number;
  branchName?: string;
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
  classroomId: number;
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
  branchName?: string;
  displayOrder: number;
  status?: 'LOCKED' | 'OPEN' | 'HIDDEN';
  isRequired?: boolean;
}

export interface CreateNodeEdgeRequest {
  fromNodeId: number;
  toNodeId: number;
  branchName?: string;
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
}

export interface NodeTestResponse {
  testId: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  passingPercentage?: number;
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


export const learningPathService = {
  getSubjectLearningPaths: (subjectId: number) =>
    http.get<LearningPathResponse[]>(`/teacher-manage/subjects/${subjectId}/learning-paths`),
  createLearningPath: (request: CreateLearningPathRequest) =>
    http.post<LearningPathResponse>('/teacher-manage/learning-paths', request),
  getLearningPathGraph: (pathId: number) =>
    http.get<LearningPathGraphResponse>(`/teacher-manage/learning-paths/${pathId}/graph`),
  getClassroomGraph: (classroomId: number) =>
    http.get<ClassroomGraphResponse>(`/teacher-manage/classrooms/${classroomId}/graph`),
  cloneFromTemplate: (classroomId: number, templatePathId: number) =>
    http.post<LearningPathResponse>(`/teacher-manage/classrooms/${classroomId}/clone-learning-path/${templatePathId}`),
  publishClassroomPath: (classroomId: number, pathId: number) =>
    http.post<PublishResultResponse>(`/teacher-manage/classrooms/${classroomId}/learning-paths/${pathId}/publish`),
  unpublishClassroomPath: (classroomId: number, pathId: number) =>
    http.post<void>(`/teacher-manage/classrooms/${classroomId}/learning-paths/${pathId}/unpublish`),
  deleteDraftPath: (classroomId: number, pathId: number) =>
    http.delete<void>(`/teacher-manage/classrooms/${classroomId}/learning-paths/${pathId}`),
  createLearningNode: (request: CreateLearningNodeRequest) =>
    http.post<LearningNodeResponse>('/teacher-manage/learning-nodes', request),
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
    http.post<NodeMaterialResponse>(`/admin/learning-nodes/${nodeId}/materials`, formData),
  deleteAdminNodeMaterial: (materialId: number) =>
    http.delete<void>(`/admin/materials/${materialId}`),
  addAdminNodeTest: (nodeId: number, request: CreateNodeTestRequest) =>
    http.post<NodeTestResponse>(`/admin/learning-nodes/${nodeId}/tests`, request),
  deleteAdminNodeTest: (testId: number) =>
    http.delete<void>(`/admin/tests/${testId}`),
};
