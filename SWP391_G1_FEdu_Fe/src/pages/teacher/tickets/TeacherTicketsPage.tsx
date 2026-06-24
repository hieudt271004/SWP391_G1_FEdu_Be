import { useEffect, useState } from 'react';
import {
  Loader2, AlertCircle, Search, MessageSquare, Clock, CheckCircle2,
  Calendar, Users, ArrowRight, X, Send, BookOpen, User, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { teacherService } from '../../../services/teacher.service';
import { SupportTicketResponse, SupportTicketDetailResponse } from '../../../types/ticket';
import { useAuth } from '../../../context/AuthContext';

export function TeacherTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Detail Modal State
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [detailTicket, setDetailTicket] = useState<SupportTicketDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherService.getTickets();
      setTickets(data ?? []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách ticket:', err);
      setError(err.message || 'Không thể tải danh sách ticket hỗ trợ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenDetail = async (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setLoadingDetail(true);
    setAnswerText('');
    try {
      const detail = await teacherService.getTicketDetail(ticketId);
      setDetailTicket(detail);
    } catch (err: any) {
      console.error('Lỗi khi tải chi tiết ticket:', err);
      toast.error(err.message || 'Không thể tải chi tiết ticket.');
      setSelectedTicketId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTicketId(null);
    setDetailTicket(null);
    setAnswerText('');
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !answerText.trim()) return;

    try {
      setSubmittingAnswer(true);
      await teacherService.answerTicket(selectedTicketId, answerText.trim());
      toast.success('Đã gửi câu trả lời và giải quyết ticket thành công!');
      
      // Reload detail and main list
      const updatedDetail = await teacherService.getTicketDetail(selectedTicketId);
      setDetailTicket(updatedDetail);
      setAnswerText('');
      
      // Refresh the background ticket list
      const data = await teacherService.getTickets();
      setTickets(data ?? []);
    } catch (err: any) {
      console.error('Lỗi khi trả lời ticket:', err);
      toast.error(err.message || 'Không thể gửi câu trả lời.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Metrics calculations
  const totalTickets = tickets.length;
  const pendingTicketsCount = tickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'PROCESSING'
  ).length;
  const resolvedTicketsCount = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;

  // Filter logic
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    const isPending = t.status === 'OPEN' || t.status === 'PROCESSING';
    const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && isPending) ||
      (statusFilter === 'resolved' && isResolved);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
            Chưa xử lý
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            Đang xử lý
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            Đã giải quyết
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
            Đã đóng
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTickets}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Ticket hỗ trợ</h1>
            <p className="text-sm text-gray-500">Danh sách câu hỏi của sinh viên được chuyển lên từ Sub-mentor</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Tổng số ticket</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalTickets}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Cần trả lời</p>
            <p className="text-2xl font-extrabold text-rose-600">{pendingTicketsCount}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Đã trả lời</p>
            <p className="text-2xl font-extrabold text-emerald-600">{resolvedTicketsCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl p-4 bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm ticket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition-colors bg-slate-50/50 text-slate-700"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100 w-full sm:w-auto">
          {(
            [
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chưa trả lời' },
              { key: 'resolved', label: 'Đã trả lời' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table / List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Không tìm thấy ticket hỗ trợ nào phù hợp</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Tiêu đề Ticket</th>
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4">Lớp học</th>
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.ticketId} className="hover:bg-slate-55/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 line-clamp-1 max-w-xs">
                        {ticket.title}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                        {ticket.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{ticket.studentName}</div>
                      <div className="text-xs text-slate-400">{ticket.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                        {ticket.className}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-indigo-600">{ticket.subjectName}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(ticket.createdAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(ticket.ticketId)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors cursor-pointer"
                      >
                        Chi tiết
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Details Popup Modal */}
      {selectedTicketId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">Chi tiết Ticket Hỗ trợ</h3>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm text-slate-500">Đang tải thông tin chi tiết...</p>
                </div>
              ) : detailTicket ? (
                <>
                  {/* Ticket Header Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Sinh viên: <span className="font-semibold text-slate-800">{detailTicket.studentName}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <span>Email: <span className="font-semibold text-indigo-600">{detailTicket.studentEmail}</span></span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>Lớp học: <span className="font-semibold text-slate-800">{detailTicket.className}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span>Môn học: <span className="font-semibold text-slate-800 text-indigo-600">{detailTicket.subjectName}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Main Ticket Info (Initial Question) */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-base font-extrabold text-slate-800 leading-snug">{detailTicket.title}</h4>
                      <div>{getStatusBadge(detailTicket.status)}</div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {detailTicket.description}
                    </p>
                    <div className="text-[11px] text-slate-400 text-right flex items-center justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Gửi lúc: {new Date(detailTicket.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Comments/Answers Section */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                      Lịch sử trao đổi ({detailTicket.comments?.length || 0})
                    </h5>

                    {detailTicket.comments?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                        Chưa có phản hồi nào cho ticket này.
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {detailTicket.comments.map((comment) => {
                          const isStudent = comment.commenterEmail === detailTicket.studentEmail;
                          return (
                            <div
                              key={comment.commentId}
                              className={`flex flex-col gap-1 p-3.5 rounded-xl border ${
                                isStudent
                                  ? 'bg-slate-50/70 border-slate-150 mr-8'
                                  : 'bg-indigo-50/20 border-indigo-100/50 ml-8'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                                <span className={isStudent ? 'text-slate-700' : 'text-indigo-600'}>
                                  {comment.commenterName} ({isStudent ? 'Sinh viên' : 'Hỗ trợ'})
                                </span>
                                <span className="text-[10px] font-normal text-slate-400">
                                  {new Date(comment.createdAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Answering text box (Only show if not resolved) */}
                  {detailTicket.status !== 'RESOLVED' && detailTicket.status !== 'CLOSED' ? (
                    <form onSubmit={handleSubmitAnswer} className="space-y-3 pt-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Soạn câu trả lời giải quyết ticket:
                      </label>
                      <div className="relative">
                        <textarea
                          placeholder="Nhập câu trả lời chi tiết và hướng dẫn giải quyết cho sinh viên..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          className="w-full min-h-[100px] max-h-[160px] p-3 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition-colors text-slate-700 bg-slate-50/30"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingAnswer || !answerText.trim()}
                          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-indigo-150 hover:shadow-lg transition-all cursor-pointer"
                        >
                          {submittingAnswer ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Gửi câu trả lời
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-xs font-semibold text-center flex items-center justify-center gap-2 mt-4 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Ticket này đã được giải quyết thành công.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Không thể hiển thị dữ liệu ticket này.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
