import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, Send, Trash2, MessageSquare, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { nodeReviewService } from '../../services/nodeReview.service';
import type { NodeReviewResponse, NodeReviewSummaryResponse } from '../../types/nodeReview';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';

export interface NodeDiscussionProps {
  nodeId: number;
  role: 'student' | 'teacher';
  onLoadSummary?: (totalCount: number) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function NodeDiscussion({ nodeId, role, onLoadSummary }: NodeDiscussionProps) {
  const { user } = useAuth();
  const confirm = useConfirm();

  const onLoadSummaryRef = useRef(onLoadSummary);
  useEffect(() => {
    onLoadSummaryRef.current = onLoadSummary;
  }, [onLoadSummary]);

  const [summary, setSummary] = useState<NodeReviewSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  
  const [newCommentContent, setNewCommentContent] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  
  const [activeReplyParentId, setActiveReplyParentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewContent, setReviewContent] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const serviceGroup = useMemo(() => {
    return role === 'teacher' ? nodeReviewService.teacher : nodeReviewService.student;
  }, [role]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceGroup.getSummary(nodeId);
      setSummary(data);
      if (onLoadSummaryRef.current) {
        const total = (data.reviews?.length || 0) + (data.comments?.length || 0);
        onLoadSummaryRef.current(total);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải thảo luận.');
    } finally {
      setLoading(false);
    }
  }, [nodeId, serviceGroup]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  
  const handlePostComment = async () => {
    if (!newCommentContent.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await serviceGroup.createComment(nodeId, {
        content: newCommentContent.trim(),
      });
      toast.success('Gửi thảo luận thành công');
      setNewCommentContent('');
      setSummary((prev) => {
        if (!prev) return null;
        const updatedComments = [res, ...(prev.comments || [])];
        if (onLoadSummaryRef.current) {
          onLoadSummaryRef.current((prev.reviews?.length || 0) + updatedComments.length);
        }
        return {
          ...prev,
          comments: updatedComments,
        };
      });
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi thảo luận.');
    } finally {
      setSubmittingComment(false);
    }
  };

  
  const handlePostReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await serviceGroup.reply(nodeId, parentId, {
        content: replyContent.trim(),
      });
      toast.success('Gửi phản hồi thành công');
      setReplyContent('');
      setActiveReplyParentId(null);
      setSummary((prev) => {
        if (!prev) return null;
        
        const updateReplies = (list: NodeReviewResponse[]) =>
          list.map((item) => {
            if (item.reviewId === parentId) {
              return {
                ...item,
                replies: [...(item.replies || []), res],
              };
            }
            return item;
          });

        return {
          ...prev,
          reviews: updateReplies(prev.reviews || []),
          comments: updateReplies(prev.comments || []),
        };
      });
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi phản hồi.');
    } finally {
      setSubmittingReply(false);
    }
  };

  
  const handleDeleteEntry = async (item: NodeReviewResponse) => {
    const isReply = item.parentReviewId != null;
    const isReview = item.rating != null;

    const isConfirmed = await confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa ${
        isReply ? 'phản hồi' : isReview ? 'đánh giá' : 'thảo luận'
      } này không?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      if (isReply) {
        await serviceGroup.deleteReply(item.reviewId);
        toast.success('Xóa phản hồi thành công');
        setSummary((prev) => {
          if (!prev) return null;
          const filterReplies = (list: NodeReviewResponse[]) =>
            list.map((r) => {
              if (r.reviewId === item.parentReviewId) {
                return {
                  ...r,
                  replies: (r.replies || []).filter((rep) => rep.reviewId !== item.reviewId),
                };
              }
              return r;
            });
          return {
            ...prev,
            reviews: filterReplies(prev.reviews || []),
            comments: filterReplies(prev.comments || []),
          };
        });
      } else if (isReview) {
        if (role !== 'student') return;
        await nodeReviewService.student.deleteReview(nodeId);
        toast.success('Xóa đánh giá thành công');
        setIsEditingReview(false);
        setSummary((prev) => {
          if (!prev) return null;
          const updatedReviews = (prev.reviews || []).filter((r) => r.reviewId !== item.reviewId);
          if (onLoadSummaryRef.current) {
            onLoadSummaryRef.current(updatedReviews.length + (prev.comments?.length || 0));
          }
          return {
            ...prev,
            myReview: null,
            reviews: updatedReviews,
          };
        });
      } else {
        await serviceGroup.deleteComment(item.reviewId);
        toast.success('Xóa thảo luận thành công');
        setSummary((prev) => {
          if (!prev) return null;
          const updatedComments = (prev.comments || []).filter((c) => c.reviewId !== item.reviewId);
          if (onLoadSummaryRef.current) {
            onLoadSummaryRef.current((prev.reviews?.length || 0) + updatedComments.length);
          }
          return {
            ...prev,
            comments: updatedComments,
          };
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Xóa thất bại.');
    }
  };

  
  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.warning('Vui lòng chọn số sao đánh giá.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await nodeReviewService.student.submitReview(nodeId, {
        rating: reviewRating,
        content: reviewContent.trim() || undefined,
      });
      toast.success(isEditingReview ? 'Cập nhật đánh giá thành công' : 'Gửi đánh giá thành công');
      setIsEditingReview(false);
      setSummary((prev) => {
        if (!prev) return null;

        
        let updatedReviews = [...(prev.reviews || [])];
        const index = updatedReviews.findIndex((r) => r.studentId === user?.userId);
        if (index >= 0) {
          updatedReviews[index] = res;
        } else {
          updatedReviews = [res, ...updatedReviews];
        }

        if (onLoadSummaryRef.current) {
          onLoadSummaryRef.current(updatedReviews.length + (prev.comments?.length || 0));
        }

        
        
        setTimeout(() => loadData(), 200);

        return {
          ...prev,
          myReview: res,
          reviews: updatedReviews,
        };
      });
    } catch (err: any) {
      toast.error(err.message || 'Gửi đánh giá thất bại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReviewClick = () => {
    if (summary?.myReview) {
      setReviewRating(summary.myReview.rating || 5);
      setReviewContent(summary.myReview.content || '');
      setIsEditingReview(true);
    }
  };

  
  const renderStars = (rating: number, interactive = false, size = 'w-4 h-4') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = interactive
        ? (reviewHoverRating || reviewRating) >= i
        : rating >= i;
      stars.push(
        <Star
          key={i}
          className={`${size} ${
            isFilled ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
          } ${interactive ? 'cursor-pointer transition-colors duration-150' : ''}`}
          onClick={() => interactive && setReviewRating(i)}
          onMouseEnter={() => interactive && setReviewHoverRating(i)}
          onMouseLeave={() => interactive && setReviewHoverRating(0)}
        />
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="space-y-6 py-4 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-sm font-medium text-slate-800 mb-2">{error}</p>
        <Button variant="outline" className="rounded-md text-xs font-semibold" onClick={loadData}>
          Thử lại
        </Button>
      </div>
    );
  }

  const allReviews = summary?.reviews || [];
  const allComments = summary?.comments || [];
  const totalItems = allReviews.length + allComments.length;

  return (
    <div className="space-y-6 py-1 font-sans">
      {}
      {summary && summary.reviewCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold">Đánh giá chung:</span>
          <span className="text-xs font-semibold text-slate-900">{summary.averageRating}/5</span>
          <span className="text-xs text-slate-500">({summary.reviewCount} đánh giá)</span>
        </div>
      )}

      {}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hỏi đáp & Thảo luận</h4>
        <div className="relative border border-slate-200 rounded-lg bg-white p-3 hover:border-slate-350 transition-colors focus-within:ring-2 focus-within:ring-slate-900/5 focus-within:border-slate-900">
          <Textarea
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            placeholder="Đặt câu hỏi hoặc chia sẻ về bài học này..."
            className="w-full min-h-[70px] resize-none border-none p-0 focus-visible:ring-0 text-slate-850 placeholder:text-slate-400 text-xs shadow-none"
            maxLength={2000}
          />
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
            <span className="text-[10px] text-slate-400">
              {newCommentContent.length}/2000 ký tự
            </span>
            <Button
              onClick={handlePostComment}
              disabled={!newCommentContent.trim() || submittingComment}
              className="h-7 px-3.5 bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-md border-none flex items-center gap-1 shrink-0 transition-all outline-none"
            >
              {submittingComment ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>Gửi bình luận</span>
            </Button>
          </div>
        </div>
      </div>

      {}
      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 bg-slate-50/50 rounded-xl py-12 px-6 text-center">
          <HelpCircle className="w-8 h-8 text-slate-350 mb-3 stroke-[1.5]" />
          <p className="text-xs font-semibold text-slate-800 mb-1">Chưa có cuộc thảo luận nào</p>
          <p className="text-[11px] text-slate-500 max-w-sm">
            Bài học này chưa có câu hỏi hay đánh giá nào. Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ thắc mắc của bạn!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {}
          <div className="space-y-4">
            {[...allReviews, ...allComments].map((item) => {
              const isOwnEntry = user && item.studentId === user.userId;
              const isReview = item.rating != null;

              return (
                <div key={item.reviewId} className="group border border-slate-200/80 bg-white rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={item.studentAvatarUrl || undefined} />
                      <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-xs uppercase">
                        {(item.studentName || 'U').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {item.studentName}
                        </span>
                        {item.authorRole === 'TEACHER' && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-amber-500/10 text-amber-700 border-transparent font-bold">
                            Giảng viên
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {}
                      {isReview && item.rating != null && (
                        <div className="flex items-center gap-1.5">
                          {renderStars(item.rating, false, 'w-3.5 h-3.5')}
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/5 px-1.5 py-0.5 rounded">Đánh giá</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                        {item.content}
                      </p>

                      {}
                      <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-500 font-bold">
                        {}
                        {item.parentReviewId == null && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyParentId(
                                activeReplyParentId === item.reviewId ? null : item.reviewId
                              );
                              setReplyContent('');
                            }}
                            className="flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent p-0 outline-none"
                          >
                            <MessageSquare className="w-3.5 h-3.5 stroke-[2]" />
                            <span>Trả lời</span>
                          </button>
                        )}

                        {isOwnEntry && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(item)}
                            className="flex items-center gap-1 hover:text-red-600 text-slate-400 transition-colors cursor-pointer border-none bg-transparent p-0 outline-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {}
                  {item.replies && item.replies.length > 0 && (
                    <div className="mt-3.5 pl-6 border-l-2 border-slate-100 space-y-3.5">
                      {item.replies.map((reply) => {
                        const isOwnReply = user && reply.studentId === user.userId;
                        return (
                          <div key={reply.reviewId} className="flex items-start gap-2.5">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={reply.studentAvatarUrl || undefined} />
                              <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-[9px] uppercase">
                                {(reply.studentName || 'U').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                <span className="text-[11px] font-bold text-slate-800 truncate">
                                  {reply.studentName}
                                </span>
                                {reply.authorRole === 'TEACHER' && (
                                  <Badge variant="outline" className="h-3.5 px-1 text-[8px] bg-amber-500/10 text-amber-700 border-transparent font-bold">
                                    Giảng viên
                                  </Badge>
                                )}
                                <span className="text-[9px] text-slate-400 font-medium">
                                  {formatRelativeTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                {reply.content}
                              </p>

                              {isOwnReply && (
                                <div className="pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEntry(reply)}
                                    className="flex items-center gap-1 hover:text-red-600 text-slate-400 transition-colors cursor-pointer border-none bg-transparent p-0 text-[9px] font-bold outline-none"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Xóa</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {}
                  {activeReplyParentId === item.reviewId && (
                    <div className="mt-3.5 pl-6 border-l-2 border-slate-100 space-y-2.5">
                      <div className="relative border border-slate-200 rounded-md bg-white p-2">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Phản hồi lại ${item.studentName}...`}
                          className="w-full min-h-[50px] resize-none border-none p-0 focus-visible:ring-0 text-slate-850 placeholder:text-slate-400 text-xs shadow-none"
                          maxLength={2000}
                        />
                        <div className="flex items-center justify-between border-t border-slate-50 pt-1.5 mt-1.5">
                          <span className="text-[9px] text-slate-400">
                            {replyContent.length}/2000 ký tự
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setActiveReplyParentId(null);
                                setReplyContent('');
                              }}
                              className="h-6 px-2.5 text-[10px] font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              Hủy
                            </Button>
                            <Button
                              onClick={() => handlePostReply(item.reviewId)}
                              disabled={!replyContent.trim() || submittingReply}
                              className="h-6 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded-md border-none flex items-center gap-1"
                            >
                              {submittingReply && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                              <span>Gửi phản hồi</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {}
      {role === 'student' && summary && (
        <div className="border-t border-slate-150 pt-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Đánh giá bài học</h4>

          {isEditingReview || (!summary.myReview && summary.canReview) ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {isEditingReview ? 'Chỉnh sửa đánh giá' : 'Đánh giá chất lượng bài học'}
                </span>
                {isEditingReview && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditingReview(false)}
                    className="h-6 px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Hủy sửa
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">Số sao đánh giá:</span>
                {renderStars(reviewRating, true, 'w-6 h-6')}
              </div>

              <div className="relative border border-slate-200 rounded-md bg-white p-2">
                <Textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Viết nhận xét của bạn về bài học (không bắt buộc)..."
                  className="w-full min-h-[60px] resize-none border-none p-0 focus-visible:ring-0 text-slate-850 placeholder:text-slate-400 text-xs shadow-none"
                  maxLength={2000}
                />
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || submittingReview}
                className="w-full h-8 bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-md border-none flex items-center justify-center gap-1.5 transition-all outline-none"
              >
                {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</span>
              </Button>
            </div>
          ) : summary.myReview ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 block">Đánh giá của bạn:</span>
                  <div className="flex items-center gap-2">
                    {renderStars(summary.myReview.rating || 5, false, 'w-4 h-4')}
                    <span className="text-xs font-bold text-amber-600">({summary.myReview.rating} sao)</span>
                  </div>
                  {summary.myReview.content ? (
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      &ldquo;{summary.myReview.content}&rdquo;
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Không có bình luận chữ.</p>
                  )}
                  <span className="text-[10px] text-slate-450 block font-medium">
                    Cập nhật lúc: {new Date(summary.myReview.updatedAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleEditReviewClick}
                    className="h-7 px-2.5 text-[10px] font-bold border-slate-200 hover:bg-slate-100 rounded-md"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteEntry(summary.myReview!)}
                    className="h-7 px-2.5 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs italic">
              <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Hoàn thành lộ trình bài học của lớp-môn này để mở khóa đánh giá.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
