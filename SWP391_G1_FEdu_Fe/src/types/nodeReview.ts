export interface NodeReviewResponse {
  reviewId: number;
  nodeId: number;
  parentReviewId: number | null;
  rating: number | null;
  content: string | null;
  studentId: number;
  studentName: string;
  studentAvatarUrl: string | null;
  authorRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
  replies: NodeReviewResponse[];
}

export interface NodeReviewSummaryResponse {
  nodeId: number;
  averageRating: number;
  reviewCount: number;
  canReview: boolean;
  myReview: NodeReviewResponse | null;
  reviews: NodeReviewResponse[];
  comments: NodeReviewResponse[];
}
