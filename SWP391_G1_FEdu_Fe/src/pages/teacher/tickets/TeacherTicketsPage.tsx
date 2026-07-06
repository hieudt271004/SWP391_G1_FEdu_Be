import { useEffect, useState } from 'react';
import {
  Loader2, AlertCircle, Search, MessageSquare, Clock, CheckCircle2,
  Calendar, X, Send, Mail, BookOpen, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { teacherService } from '../../../services/teacher.service';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface TicketWithClassInfo {
  ticketId: number;
  classroomSubjectStudentId: number;
  studentName: string;
  studentEmail: string;
  messageStudent: string;
  messageResponse?: string | null;
  status: 'NONE' | 'DONE' | 'SEND';
  createdAt: string;
  updatedAt: string;
  classroomSubjectId: number;
  className: string;
  subjectCode: string;
}

export function TeacherTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Response Modal State
  const [selectedTicket, setSelectedTicket] = useState<TicketWithClassInfo | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const fetchTickets = async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      setError(null);
      
      // 1. Get all classrooms taught by the teacher
      const classrooms = await teacherService.getClassroomsByTeacher(user.userId);
      
      // 2. Fetch escalated tickets for each classroom
      const allTicketsPromises = (classrooms ?? []).map(async (c) => {
        try {
          const classTickets = await teacherService.listEscalatedTickets(c.classroomSubjectId);
          return (classTickets ?? []).map((t) => ({
            ...t,
            classroomSubjectId: c.classroomSubjectId,
            className: c.className,
            subjectCode: c.subjectCode,
          }));
        } catch (err) {
          console.error(`Lỗi khi tải ticket cho lớp ${c.className}:`, err);
          return [];
        }
      });
      
      const results = await Promise.all(allTicketsPromises);
      const flattened = results.flat().sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setTickets(flattened);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách ticket tổng hợp:', err);
      setError(err.message || 'Không thể tải danh sách ticket hỗ trợ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user?.userId]);

  const handleOpenRespond = (ticket: TicketWithClassInfo) => {
    setSelectedTicket(ticket);
    setAnswerText('');
  };

  const handleCloseRespond = () => {
    setSelectedTicket(null);
    setAnswerText('');
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !answerText.trim()) return;

    try {
      setSubmittingAnswer(true);
      await teacherService.respondAsTeacher(
        selectedTicket.classroomSubjectId,
        selectedTicket.ticketId,
        { messageResponse: answerText.trim() }
      );
      
      toast.success('Đã gửi câu trả lời và giải quyết ticket thành công!');
      handleCloseRespond();
      fetchTickets(); // Refresh list
    } catch (err: any) {
      console.error('Lỗi khi trả lời ticket:', err);
      toast.error(err.message || 'Không thể gửi câu trả lời.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.messageStudent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <MessageSquare className="w-6 h-6 text-foreground" />
            Ticket Hỗ trợ Leo thang
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và xử lý các câu hỏi phức tạp từ học sinh đã được Sub-mentor leo thang lên giảng viên giải quyết.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold self-start md:self-center border border-border">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          {tickets.length} ticket đang chờ
        </Badge>
      </div>

      {/* Main List */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-border bg-accent/25 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo học sinh, email, lớp học hoặc nội dung câu hỏi..."
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Đang tải danh sách ticket hỗ trợ...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold text-sm">{error}</p>
            <Button onClick={fetchTickets} variant="link" className="text-xs mt-2 h-auto p-0">
              Thử tải lại
            </Button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-foreground font-semibold">Tất cả đều sạch sẽ!</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Không tìm thấy ticket nào khớp với từ khóa tìm kiếm.' : 'Không có ticket leo thang nào cần xử lý lúc này.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTickets.map((ticket) => (
              <div 
                key={ticket.ticketId} 
                className="p-6 hover:bg-accent/40 transition-all flex flex-col md:flex-row gap-4 items-start justify-between"
              >
                {/* Student Info & Question */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-sm shrink-0 border border-border">
                      {ticket.studentName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {ticket.studentName}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        {ticket.studentEmail}
                      </p>
                    </div>
                  </div>

                  <div className="bg-accent/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {ticket.messageStudent}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      Lớp: <strong className="text-foreground font-bold">{ticket.className}</strong>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Yêu cầu lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 w-full md:w-auto flex md:flex-col justify-end items-end gap-2 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                  <Button
                    onClick={() => handleOpenRespond(ticket)}
                    className="flex items-center gap-1.5 text-xs font-semibold w-full md:w-auto justify-center"
                  >
                    Trả lời ticket
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Respond Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseRespond} />
          <div className="relative bg-background text-foreground border border-border w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-accent/25 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">Trả lời Ticket Hỗ trợ</h3>
                <p className="text-xs text-muted-foreground">Lớp: {selectedTicket.className} ({selectedTicket.subjectCode})</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseRespond} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAnswer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Câu hỏi của học sinh</label>
                <div className="bg-accent/30 p-4 rounded-xl border border-border max-h-32 overflow-y-auto text-sm text-foreground whitespace-pre-wrap">
                  {selectedTicket.messageStudent}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Nội dung phản hồi của giảng viên *</label>
                <Textarea
                  required
                  placeholder="Nhập nội dung hướng dẫn chi tiết cho học sinh..."
                  rows={6}
                  className="w-full resize-none"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleCloseRespond}
                  variant="outline"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={submittingAnswer || !answerText.trim()}
                  className="flex items-center gap-1.5"
                >
                  {submittingAnswer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gửi câu trả lời
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
