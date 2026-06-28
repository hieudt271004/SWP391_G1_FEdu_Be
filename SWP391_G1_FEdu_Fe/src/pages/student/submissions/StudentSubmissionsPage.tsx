import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Award, BookOpen, AlertCircle, Calendar } from 'lucide-react';
import { studentService } from '../../../services/student.service';
import type { StudentTestAttemptHistoryResponse } from '../../../services/student.service';
import { toast } from 'sonner';

export function StudentSubmissionsPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<StudentTestAttemptHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await studentService.getTestHistory();
      setHistory(res || []);
    } catch (error) {
      toast.error('Lỗi khi lấy lịch sử làm bài');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa nộp';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Trang chủ</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lịch sử làm bài (Submissions)</h2>
            <p className="text-sm text-gray-500 mt-1">Các bài kiểm tra đã nộp trong quá khứ</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : history.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có bài làm nào</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Bạn chưa hoàn thành bất kỳ bài kiểm tra nào. Lịch sử các bài kiểm tra đã nộp sẽ hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Lớp - Môn</th>
                  <th className="px-6 py-4">Tên bài test</th>
                  <th className="px-6 py-4">Điểm</th>
                  <th className="px-6 py-4">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.attemptId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{item.classroomSubjectName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.testTitle}</div>
                      {item.testDescription && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={item.testDescription}>
                          {item.testDescription}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.score !== null && item.score !== undefined ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium whitespace-nowrap">
                          <Award className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{item.score} / 100</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                          Chưa có điểm
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{formatDate(item.submittedAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
