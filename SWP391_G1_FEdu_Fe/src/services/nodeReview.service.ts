import { http } from './http';
import type { NodeReviewResponse, NodeReviewSummaryResponse } from '../types/nodeReview';

export interface CreateNodeReviewRequest {
  rating?: number;
  content?: string;
  parentReviewId?: number;
}

export const nodeReviewService = {
  student: {
    getSummary: (nodeId: number) =>
      http.get<NodeReviewSummaryResponse>(`/student/learning-nodes/${nodeId}/reviews`),

    submitReview: (nodeId: number, body: CreateNodeReviewRequest) =>
      http.post<NodeReviewResponse>(`/student/learning-nodes/${nodeId}/reviews`, body),

    createComment: (nodeId: number, body: CreateNodeReviewRequest) =>
      http.post<NodeReviewResponse>(`/student/learning-nodes/${nodeId}/comments`, body),

    reply: (nodeId: number, reviewId: number, body: CreateNodeReviewRequest) =>
      http.post<NodeReviewResponse>(`/student/learning-nodes/${nodeId}/reviews/${reviewId}/replies`, body),

    deleteReview: (nodeId: number) =>
      http.delete<void>(`/student/learning-nodes/${nodeId}/reviews`),

    deleteComment: (commentId: number) =>
      http.delete<void>(`/student/learning-nodes/comments/${commentId}`),

    deleteReply: (replyId: number) =>
      http.delete<void>(`/student/reviews/replies/${replyId}`),
  },

  teacher: {
    getSummary: (nodeId: number) =>
      http.get<NodeReviewSummaryResponse>(`/teacher-manage/learning-nodes/${nodeId}/reviews`),

    createComment: (nodeId: number, body: CreateNodeReviewRequest) =>
      http.post<NodeReviewResponse>(`/teacher-manage/learning-nodes/${nodeId}/comments`, body),

    reply: (nodeId: number, commentId: number, body: CreateNodeReviewRequest) =>
      http.post<NodeReviewResponse>(`/teacher-manage/learning-nodes/${nodeId}/comments/${commentId}/replies`, body),

    deleteComment: (commentId: number) =>
      http.delete<void>(`/teacher-manage/comments/${commentId}`),

    deleteReply: (replyId: number) =>
      http.delete<void>(`/teacher-manage/replies/${replyId}`),
  },
};
