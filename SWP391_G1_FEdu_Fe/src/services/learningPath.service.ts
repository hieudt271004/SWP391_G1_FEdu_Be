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

export const learningPathService = {
  getSubjectLearningPaths: (subjectId: number) =>
    http.get<LearningPathResponse[]>(`/teacher-manage/subjects/${subjectId}/learning-paths`),
  createLearningPath: (request: CreateLearningPathRequest) =>
    http.post<LearningPathResponse>('/teacher-manage/learning-paths', request),
  getLearningPathGraph: (pathId: number) =>
    http.get<LearningPathGraphResponse>(`/teacher-manage/learning-paths/${pathId}/graph`),
  getClassroomLearningPathGraph: (classroomId: number) =>
    http.get<LearningPathGraphResponse>(`/teacher-manage/classrooms/${classroomId}/graph`),
  createLearningNode: (request: CreateLearningNodeRequest) =>
    http.post<LearningNodeResponse>('/teacher-manage/learning-nodes', request),
  deleteLearningNode: (nodeId: number) =>
    http.delete<void>(`/teacher-manage/learning-nodes/${nodeId}`),
  createNodeEdge: (request: CreateNodeEdgeRequest) =>
    http.post<NodeEdgeResponse>('/teacher-manage/node-edges', request),
};
