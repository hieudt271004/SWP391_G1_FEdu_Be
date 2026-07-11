import { http } from './http';
import { apiClient } from './api.client';
import type { Subject } from '../types/subject';

export type LearningPathLevel = 1 | 2 | 3;
export type NodeTestKind = 'NONE' | 'GATE' | 'PLACEMENT' | 'FREE_CHOICE';

export interface StudentInClassResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  joinedAt?: string;
  currentLevel?: number;
  classroomSubjectStudentId?: number;
  isSubmentor?: boolean;
}

export interface CreateLearningPathRequest {
  subjectId: number;
  pathName: string;
  description?: string;
  level?: LearningPathLevel;
}

export interface LearningPathResponse {
  pathId: number;
  subjectId: number;
  pathName: string;
  description: string;
  createdById: number;
  creatorName?: string;
  creatorRole?: string;
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
  displayOrder: number;
  status: 'LOCKED' | 'OPEN' | 'HIDDEN';
  studentStatus?: 'LOCKED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  isRequired: boolean;
  isDeleted: boolean;
  level?: number | null;
  testKind?: NodeTestKind;
  appliesLevels?: string | null;
  gateUpMin?: number | null;
  gateDownMax?: number | null;
  placementYeuMax?: number | null;
  placementTbMax?: number | null;
  stageOrder?: number | null;
  studyDate?: string | null;
  slotId?: number | null;
  slotName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  /** Hạn hoàn thành node (ISO datetime, null = không có deadline). */
  deadlineAt?: string | null;
  /** Chỉ có ở graph student: học sinh hoàn thành node SAU deadline. */
  completedLate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NodeEdgeResponse {
  edgeId: number;
  fromNodeId: number;
  toNodeId: number;
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

export interface CloneablePathResponse {
  pathId: number;
  pathName: string;
  description: string;
  /** ADMIN_TEMPLATE = template của khoa; MY_TEMPLATE = template cá nhân của GV hiện tại. */
  type: 'ADMIN_TEMPLATE' | 'MY_TEMPLATE';
  creatorName?: string | null;
  nodeCount: number;
  lastUpdatedAt: string;
}

export interface PublishResultResponse {
  seededStudents: number;
}

export interface ClassroomPathDto {
  level: number;
  pathId: number;
  nodes: LearningNodeResponse[];
  edges: NodeEdgeResponse[];
}

export interface ClassroomGraphResponse {
  classroomSubjectId: number;
  /** PLACEMENT_PENDING = bài phân loại có câu tự luận đã nộp, chờ giáo viên chấm. */
  state: 'NO_PATH' | 'DRAFT' | 'PUBLISHED' | 'NEED_PLACEMENT' | 'PLACEMENT_PENDING';
  pathId: number | null;
  publishedAt: string | null;
  nodes: LearningNodeResponse[];
  edges: NodeEdgeResponse[];
  paths?: ClassroomPathResponse[];
  canCloneAll?: boolean;
  missingLevels?: number[];
  availableTemplates?: AvailableTemplateResponse[];
  quizStartTestId?: number | null;
  totalMaterials?: number;
  completedMaterials?: number;
}

export interface CreateLearningNodeRequest {
  learningPathId?: number;
  classroomPathId?: number;
  title: string;
  description?: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  displayOrder: number;
  status?: 'LOCKED' | 'OPEN' | 'HIDDEN';
  isRequired?: boolean;
  stageOrder?: number;
  level?: number | null;
  testKind?: NodeTestKind;
  appliesLevels?: string | null;
  gateUpMin?: number | null;
  gateDownMax?: number | null;
  placementYeuMax?: number | null;
  placementTbMax?: number | null;
  /** Hạn hoàn thành node (ISO datetime, tùy chọn). */
  deadlineAt?: string | null;
}

export interface UpdateLearningNodeRequest {
  title: string;
  description?: string;
  nodeType: 'AT_HOME' | 'ON_CLASS';
  status?: 'LOCKED' | 'OPEN' | 'HIDDEN';
  displayOrder?: number;
  isRequired?: boolean;
  gateUpMin?: number | null;
  gateDownMax?: number | null;
  placementYeuMax?: number | null;
  placementTbMax?: number | null;
  /** Hạn hoàn thành node (ISO datetime, tùy chọn). */
  deadlineAt?: string | null;
}

export interface CreateNodeEdgeRequest {
  fromNodeId: number;
  toNodeId: number;
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
  /** null = đề đã soạn nhưng CHƯA phát (student không thấy). */
  releasedAt?: string | null;
  /** Hạn nộp chung cả lớp khi phát trong buổi live. */
  releaseEndsAt?: string | null;
}

// Bài tập thực hành — thành phần của node (song song material/test)
export interface NodeExerciseResponse {
  exerciseId: number;
  title: string;
  instructions?: string;
  allowText: boolean;
  allowFile: boolean;
  orderIndex: number;
}

export interface NodeContentResponse {
  materials: NodeMaterialResponse[];
  tests: NodeTestResponse[];
  // BE luôn trả mảng (có thể rỗng); optional để không phá các nơi đang khởi tạo content thủ công.
  exercises?: NodeExerciseResponse[];
}

export interface CreateNodeTestRequest {
  title: string;
  description?: string;
  durationMinutes?: number;
  passingPercentage?: number;
  /** true = soạn xong CHƯA phát (buổi live, chờ bấm "Phát đề"). */
  holdRelease?: boolean;
}

// ── Buổi học live của node ON_CLASS (màn hình dạy học / học tập, polling ~5s) ──
export interface LiveActiveTestInfo {
  testId: number;
  title: string;
  durationMinutes?: number;
  releasedAt?: string | null;
  releaseEndsAt?: string | null;
}

export interface LiveSessionState {
  nodeId: number;
  nodeTitle: string;
  studyDate?: string | null;
  slotName?: string | null;
  sessionWindowStart?: string | null;
  sessionWindowEnd?: string | null;
  sessionStartedAt?: string | null;
  sessionEndedAt?: string | null;
  live: boolean;
  canStart: boolean;
  serverTime: string;
  content?: NodeContentResponse;
  activeTest?: LiveActiveTestInfo | null;
}

export interface CreateNodeExerciseRequest {
  title: string;
  instructions?: string;
  allowText?: boolean;
  allowFile?: boolean;
}

export interface ReorderContentRequest {
  id: number;
  type: 'MATERIAL' | 'TEST' | 'EXERCISE';
  orderIndex: number;
}


export interface ScoreBandResponse {
  bandId: number;
  testId: number;
  minScore: number;
  maxScore: number;
  targetLevel: number;
}

export interface PlacementQuizDetailsResponse {
  testId: number;
  title: string;
  description?: string;
  durationMinutes: number;
  scoreBands: ScoreBandResponse[];
  questionCount: number;
}

// Lượt làm bài của học sinh trên 1 test (teacher xem — kèm trạng thái + số lần rời tab)
export interface StudentAttemptResponse {
  attemptId: number;
  studentId?: number | null;
  studentName?: string;
  studentEmail?: string;
  score?: number | null;
  passed?: boolean | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  status?: string | null; // IN_PROGRESS | PENDING_REVIEW | SUBMITTED | CANCELLED | ...
  tabOutCount?: number;
}

// ── Chấm tay câu tự luận (attempt PENDING_REVIEW) ────────────────────────────
export interface ResponseGradingItem {
  responseId: number;
  questionId: number;
  questionContent: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  maxScore: number;
  /** Trả lời văn bản (tự luận / điền từ). */
  responseText?: string | null;
  /** Nội dung các đáp án đã chọn (trắc nghiệm). */
  selectedAnswers?: string[];
  /** true/false = đã chấm; null = câu tự luận chờ chấm. */
  isCorrect?: boolean | null;
}

export interface AttemptGradingDetail {
  attemptId: number;
  testId: number;
  testTitle: string;
  studentId?: number | null;
  studentName?: string;
  /** PENDING_REVIEW = còn câu tự luận chưa chấm; SUBMITTED = đã chốt điểm. */
  status?: string | null;
  score?: number | null;
  submittedAt?: string | null;
  responses: ResponseGradingItem[];
}

// Báo cáo tiến độ + hoàn thành trễ per học sinh của 1 lớp-môn (teacher)
export interface LateNodeItem {
  nodeId: number;
  title: string;
  deadlineAt?: string | null;
  completedAt?: string | null;
}

export interface StudentProgressReportResponse {
  studentId: number;
  classroomSubjectStudentId?: number;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  currentLevel?: number | null;
  completedNodes: number;
  totalNodes: number;
  lateCount: number;
  lateNodes: LateNodeItem[];
}

export interface TeacherAnswerRequest {
  answerContent: string;
  isCorrect: boolean;
}

export interface TeacherQuestionRequest {
  questionContent: string;
  questionType: 'SINGLE' | 'MULTIPLE' | 'ESSAY' | 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  score?: number;
  answers?: TeacherAnswerRequest[];
}

export interface TeacherAnswerResponse {
  answerId: number;
  answerContent: string;
  isCorrect: boolean;
}

export interface TeacherQuestionResponse {
  questionId: number;
  questionContent: string;
  questionType: 'SINGLE' | 'MULTIPLE' | 'ESSAY' | 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  score: number;
  answers: TeacherAnswerResponse[];
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
  cloneFromTemplate: (classroomSubjectId: number, templatePathId?: number) =>
    http.post<LearningPathResponse[]>(
      `/teacher-manage/classroom-subjects/${classroomSubjectId}/clone-learning-path${
        templatePathId != null ? `?templatePathId=${templatePathId}` : ''
      }`
    ),
  // Đổi template khi đã có nháp: BE xóa nháp cũ + clone mới trong 1 transaction (lỗi thì nháp cũ còn nguyên)
  replaceDraftWithTemplate: (classroomSubjectId: number, templatePathId: number) =>
    http.post<LearningPathResponse>(
      `/teacher-manage/classroom-subjects/${classroomSubjectId}/replace-learning-path?templatePathId=${templatePathId}`
    ),
  getCloneablePaths: (classroomSubjectId: number) =>
    http.get<CloneablePathResponse[]>(`/teacher-manage/classrooms/${classroomSubjectId}/cloneable-paths`),
  // Môn cho thư viện template: đã/đang dạy + môn có template cá nhân của chính GV (BE lấy user từ token)
  getLibrarySubjects: () => http.get<Subject[]>('/teacher-manage/library/subjects'),
  // Xóa template cá nhân (BE chặn xóa template của khoa / của GV khác)
  deleteTemplatePath: (pathId: number) =>
    http.delete<void>(`/teacher-manage/learning-paths/${pathId}`),
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
  deleteNodeEdge: (edgeId: number) =>
    http.delete<void>(`/teacher-manage/node-edges/${edgeId}`),

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
  getTeacherTestQuestions: (testId: number) =>
    http.get<TeacherQuestionResponse[]>(`/teacher-manage/tests/${testId}/questions`),
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
  getNodeStudents: (nodeId: number) =>
    http.get<StudentInClassResponse[]>(`/teacher-manage/learning-nodes/${nodeId}/students`),
  // Toàn bộ lượt làm bài của 1 test (đang làm + đã nộp, kèm tabOutCount) — màn hình theo dõi ON_CLASS
  getTestAttempts: (testId: number) =>
    http.get<StudentAttemptResponse[]>(`/teacher-manage/tests/${testId}/attempts`),
  // Chi tiết bài làm để chấm tay câu tự luận (attempt PENDING_REVIEW)
  getAttemptGrading: (attemptId: number) =>
    http.get<AttemptGradingDetail>(`/teacher-manage/attempts/${attemptId}/grading`),
  // Chấm đúng/sai câu tự luận; chấm đủ → BE chốt điểm + xếp mức/định tuyến
  gradeEssayAttempt: (attemptId: number, grades: { responseId: number; isCorrect: boolean }[]) =>
    http.put<AttemptGradingDetail>(`/teacher-manage/attempts/${attemptId}/grade`, { grades }),
  // Báo cáo tiến độ + hoàn thành trễ per học sinh của lớp-môn
  getProgressReport: (csId: number) =>
    http.get<StudentProgressReportResponse[]>(`/teacher-manage/classroom-subjects/${csId}/progress-report`),
  assignStudentsToNode: (nodeId: number, studentUserIds: number[]) =>
    http.put<void>(`/teacher-manage/learning-nodes/${nodeId}/students`, studentUserIds),
  unlockOnClassNode: (classroomSubjectId: number, nodeId: number) =>
    http.post<number>(`/teacher-manage/classroom-subjects/${classroomSubjectId}/nodes/${nodeId}/unlock`),
  // ── Buổi học live (màn hình dạy học) ──────────────────────────────────────
  getTeacherLiveState: (csId: number, nodeId: number) =>
    http.get<LiveSessionState>(`/teacher-manage/classroom-subjects/${csId}/learning-nodes/${nodeId}/live-state`),
  startLiveSession: (csId: number, nodeId: number) =>
    http.post<LiveSessionState>(`/teacher-manage/classroom-subjects/${csId}/learning-nodes/${nodeId}/live-session/start`),
  endLiveSession: (csId: number, nodeId: number) =>
    http.post<LiveSessionState>(`/teacher-manage/classroom-subjects/${csId}/learning-nodes/${nodeId}/live-session/end`),
  releaseLiveTest: (csId: number, nodeId: number, testId: number) =>
    http.post<LiveSessionState>(`/teacher-manage/classroom-subjects/${csId}/learning-nodes/${nodeId}/live-session/tests/${testId}/release`),
  // Xếp lịch buổi học ON_CLASS (ngày + ca). Node ON_CLASS KHÔNG mang deadline —
  // deadline chỉ dành cho node Tự học, đặt qua updateLearningNode.
  scheduleNode: async (nodeId: number, request: { studyDate: string | null; slotId: number | null; force: boolean }): Promise<LearningNodeResponse> => {
    const response = await apiClient.put<{ status?: number; message?: string; data?: LearningNodeResponse }>(
      `/teacher-manage/learning-nodes/${nodeId}/schedule`,
      request
    );
    return response.data.data!;
  },
};
