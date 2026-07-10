import { useState, useEffect } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { learningPathService } from "../../../services/learningPath.service";
import type {
  AvailableTemplateResponse,
  LearningNodeResponse,
  LearningPathGraphResponse,
} from "../../../services/learningPath.service";
import { LearningPathFlow } from "../../../components/learningPath/LearningPathFlow";
import { NodeContentReadOnlyPanel } from "../../../components/learningPath/NodeContentReadOnlyPanel";

interface TemplatePickerProps {
  classroomSubjectId: number;
  availableTemplates: AvailableTemplateResponse[];
  onCloned: () => void;
  /** Nếu có (đang ở DRAFT): đổi template = xóa draft cũ + clone mới, kèm cảnh báo mất thay đổi. */
  existingDraftPathId?: number;
}

/**
 * Chọn một lộ trình mẫu (template) → xem trước READ-ONLY (cây + nội dung node) → clone về lớp.
 * Dùng ở trạng thái lớp chưa có lộ trình. Chỉnh sửa chỉ diễn ra sau khi clone, ở trang /manage.
 */
export function TemplatePicker({ classroomSubjectId, availableTemplates, onCloned, existingDraftPathId }: TemplatePickerProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    availableTemplates.length === 1 ? availableTemplates[0].pathId : null
  );
  const [graph, setGraph] = useState<LearningPathGraphResponse | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [previewNode, setPreviewNode] = useState<LearningNodeResponse | null>(null);
  const [cloning, setCloning] = useState(false);

  // Auto-chọn khi chỉ có 1 template
  useEffect(() => {
    if (availableTemplates.length === 1) setSelectedTemplateId(availableTemplates[0].pathId);
  }, [availableTemplates]);

  // Nạp graph của template đang chọn để preview
  useEffect(() => {
    if (selectedTemplateId == null) {
      setGraph(null);
      setPreviewNode(null);
      return;
    }
    let active = true;
    setLoadingGraph(true);
    setPreviewNode(null);
    learningPathService
      .getLearningPathGraph(selectedTemplateId)
      .then((g) => {
        if (active) setGraph(g);
      })
      .catch(() => {
        if (active) {
          setGraph(null);
          toast.error("Không tải được lộ trình mẫu");
        }
      })
      .finally(() => {
        if (active) setLoadingGraph(false);
      });
    return () => {
      active = false;
    };
  }, [selectedTemplateId]);

  const handleClone = async () => {
    if (selectedTemplateId == null) {
      toast.error("Vui lòng chọn một lộ trình mẫu");
      return;
    }
    if (existingDraftPathId != null) {
      const ok = window.confirm(
        "Đổi sang lộ trình mẫu khác sẽ XÓA toàn bộ thay đổi hiện tại của bản nháp. Bạn có chắc muốn tiếp tục?"
      );
      if (!ok) return;
    }
    try {
      setCloning(true);
      if (existingDraftPathId != null) {
        // Đổi template = BE thay nháp bằng clone mới trong 1 transaction (lỗi thì nháp cũ còn nguyên)
        await learningPathService.replaceDraftWithTemplate(classroomSubjectId, selectedTemplateId);
      } else {
        await learningPathService.cloneFromTemplate(classroomSubjectId, selectedTemplateId);
      }
      toast.success(existingDraftPathId != null ? "Đã đổi lộ trình mẫu thành công!" : "Đã clone lộ trình về lớp thành công!");
      onCloned();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể clone lộ trình về lớp");
    } finally {
      setCloning(false);
    }
  };

  if (availableTemplates.length === 0) {
    return (
      <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
        Môn học chưa có lộ trình mẫu được xuất bản. Liên hệ admin.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dropdown chọn template + nút clone */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Chọn lộ trình mẫu</label>
          <select
            value={selectedTemplateId ?? ""}
            onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option value="">— Chọn lộ trình —</option>
            {availableTemplates.map((t) => (
              <option key={t.pathId} value={t.pathId}>
                {t.pathName}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleClone}
          disabled={cloning || selectedTemplateId == null}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {cloning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {existingDraftPathId != null ? "Đổi & clone lại" : "Clone về lớp"}
        </button>
      </div>

      {/* Preview read-only của template đang chọn */}
      {selectedTemplateId != null &&
        (loadingGraph ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" /> Đang tải lộ trình mẫu…
          </div>
        ) : graph ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="max-h-[60vh] overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 lg:w-[544px] lg:flex-shrink-0">
              <LearningPathFlow
                nodes={graph.nodes}
                edges={graph.edges}
                selectedNodeId={previewNode?.nodeId ?? null}
                onNodeClick={(node) => setPreviewNode(node)}
              />
            </div>
            <aside className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white lg:min-w-[320px] lg:flex-1">
              {!previewNode ? (
                <div className="p-8 text-center text-sm text-slate-400">Chọn một bài học để xem nội dung.</div>
              ) : (
                <div className="p-4">
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {previewNode.nodeType === "AT_HOME" ? "Tự học" : "Trên lớp"}
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">{previewNode.title}</h3>
                    {previewNode.description && (
                      <p className="mt-0.5 text-sm text-slate-500">{previewNode.description}</p>
                    )}
                  </div>
                  <NodeContentReadOnlyPanel
                    nodeId={previewNode.nodeId}
                    fetchContent={learningPathService.getTeacherNodeContent}
                    fetchQuestions={learningPathService.getTeacherTestQuestions}
                  />
                </div>
              )}
            </aside>
          </div>
        ) : null)}
    </div>
  );
}
