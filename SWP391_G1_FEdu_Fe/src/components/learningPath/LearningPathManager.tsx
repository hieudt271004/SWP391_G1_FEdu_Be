import { useState, useEffect, useCallback, type ReactNode } from "react";
import { learningPathService } from "../../services/learningPath.service";
import type {
  LearningPathResponse,
  LearningNodeResponse,
  NodeEdgeResponse,
  NodeContentResponse,
} from "../../services/learningPath.service";
import { API_BASE_URL } from "../../services/api.client";
import { LearningPathFlow } from "./LearningPathFlow";
import { toast } from "sonner";

interface LearningPathManagerProps {
  subjectId: number;
}

const LEVEL_OPTIONS: { value: "" | 1 | 2 | 3; label: string }[] = [
  { value: "", label: "Chung (mọi mức)" },
  { value: 1, label: "Yếu" },
  { value: 2, label: "Trung bình" },
  { value: 3, label: "Khá" },
];

export function LearningPathManager({ subjectId }: LearningPathManagerProps) {
  const [path, setPath] = useState<LearningPathResponse | null>(null);
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [edges, setEdges] = useState<NodeEdgeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedNode, setSelectedNode] = useState<LearningNodeResponse | null>(null);
  const [content, setContent] = useState<NodeContentResponse | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const [showAddNode, setShowAddNode] = useState(false);
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nLevel, setNLevel] = useState<"" | 1 | 2 | 3>("");
  const [nStage, setNStage] = useState(1);
  const [nKind, setNKind] = useState<"AT_HOME" | "ON_CLASS" | "GATE" | "PLACEMENT">("AT_HOME");
  const [saving, setSaving] = useState(false);

  const [mTitle, setMTitle] = useState("");
  const [mType, setMType] = useState<"video" | "file">("video");
  const [mVideoUrl, setMVideoUrl] = useState("");
  const [mFile, setMFile] = useState<File | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDuration, setTDuration] = useState("15");
  const [tPass, setTPass] = useState("80");

  const loadGraph = useCallback(async (pathId: number) => {
    const g = await learningPathService.getAdminTemplateGraph(pathId);
    setNodes(g.nodes);
    setEdges(g.edges);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const tpls = await learningPathService.getAdminSubjectTemplates(subjectId);
        const p = tpls.find((t) => !t.classroomSubjectId) ?? tpls[0] ?? null;
        if (!active) return;
        setPath(p ?? null);
        if (p) await loadGraph(p.pathId);
      } catch {
        if (active) toast.error("Không tải được lộ trình của môn này");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [subjectId, loadGraph]);

  const refresh = async () => {
    if (path) await loadGraph(path.pathId);
  };

  const openNode = async (node: LearningNodeResponse) => {
    setSelectedNode(node);
    setContent(null);
    setLoadingContent(true);
    try {
      setContent(await learningPathService.getAdminNodeContent(node.nodeId));
    } catch {
      setContent({ materials: [], tests: [] });
    } finally {
      setLoadingContent(false);
    }
  };

  const closeDetail = () => {
    setSelectedNode(null);
    setContent(null);
    setMTitle("");
    setMVideoUrl("");
    setMFile(null);
    setTTitle("");
  };

  const autoWire = async (created: LearningNodeResponse, level: number | null, stage: number) => {
    const prev = nodes.filter((n) => (n.stageOrder ?? 0) === stage - 1);
    if (prev.length === 0) return;
    let preds: LearningNodeResponse[];
    if (level == null) {
      preds = prev;
    } else {
      const same = prev.filter((n) => n.level === level);
      const shared = prev.filter((n) => n.level == null);
      preds = same.length ? same : shared.length ? shared : prev;
    }
    for (const p of preds) {
      try {
        await learningPathService.createAdminEdge({ fromNodeId: p.nodeId, toNodeId: created.nodeId });
      } catch {
        /* bỏ qua nếu cạnh đã tồn tại */
      }
    }
  };

  const submitAddNode = async () => {
    if (!path || !nTitle.trim()) {
      toast.error("Nhập tiêu đề bài học");
      return;
    }
    const lvl = nLevel === "" ? null : Number(nLevel);
    const atStage = nodes.filter((n) => (n.stageOrder ?? 0) === nStage);
    if (lvl == null) {
      if (atStage.length > 0) {
        toast.error(`Chặng ${nStage} đã có node — không thêm node học chung được.`);
        return;
      }
    } else {
      if (atStage.some((n) => n.level == null)) {
        toast.error(`Chặng ${nStage} đã có node học chung — không thêm node phân hóa được.`);
        return;
      }
      if (atStage.some((n) => n.level === lvl)) {
        toast.error(`Chặng ${nStage} đã có node mức ${LEVEL_OPTIONS.find((o) => o.value === lvl)?.label ?? lvl}.`);
        return;
      }
    }
    setSaving(true);
    try {
      const created = await learningPathService.createAdminNode({
        learningPathId: path.pathId,
        title: nTitle.trim(),
        description: nDesc.trim() || undefined,
        nodeType: nKind === "ON_CLASS" ? "ON_CLASS" : "AT_HOME",
        testKind: nKind === "GATE" ? "GATE" : nKind === "PLACEMENT" ? "PLACEMENT" : "NONE",
        displayOrder: 0,
        isRequired: true,
        stageOrder: nStage,
        level: lvl,
      });
      await autoWire(created, lvl, nStage);
      toast.success("Đã thêm bài học");
      setShowAddNode(false);
      setNTitle("");
      setNDesc("");
      setNLevel("");
      setNStage(1);
      setNKind("AT_HOME");
      await refresh();
    } catch {
      toast.error("Không thêm được bài học");
    } finally {
      setSaving(false);
    }
  };

  const removeEdge = async (edgeId: number) => {
    try {
      await learningPathService.deleteAdminEdge(edgeId);
      toast.success("Đã xóa liên kết");
      await refresh();
    } catch {
      toast.error("Không xóa được liên kết");
    }
  };

  const removeNode = async () => {
    if (!selectedNode) return;
    if (!confirm(`Xóa bài học "${selectedNode.title}"?`)) return;
    try {
      await learningPathService.deleteAdminNode(selectedNode.nodeId);
      toast.success("Đã xóa bài học");
      closeDetail();
      await refresh();
    } catch {
      toast.error("Không xóa được bài học");
    }
  };

  const addMaterial = async () => {
    if (!selectedNode || !mTitle.trim()) {
      toast.error("Nhập tiêu đề học liệu");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", mTitle.trim());
      fd.append("required", "true");
      if (mType === "video") {
        fd.append("videoUrl", mVideoUrl.trim());
        fd.append("videoTitle", mTitle.trim());
      } else if (mFile) {
        fd.append("file", mFile);
        fd.append("fileName", mFile.name);
      } else {
        toast.error("Chọn tệp tài liệu");
        setSaving(false);
        return;
      }
      await learningPathService.addAdminNodeMaterial(selectedNode.nodeId, fd);
      toast.success("Đã thêm học liệu");
      setMTitle("");
      setMVideoUrl("");
      setMFile(null);
      setContent(await learningPathService.getAdminNodeContent(selectedNode.nodeId));
      await refresh();
    } catch {
      toast.error("Không thêm được học liệu");
    } finally {
      setSaving(false);
    }
  };

  const addTest = async () => {
    if (!selectedNode || !tTitle.trim()) {
      toast.error("Nhập tiêu đề bài test");
      return;
    }
    setSaving(true);
    try {
      await learningPathService.addAdminNodeTest(selectedNode.nodeId, {
        title: tTitle.trim(),
        durationMinutes: Number(tDuration) || 15,
        passingPercentage: Number(tPass) || 0,
      });
      toast.success("Đã thêm bài test");
      setTTitle("");
      setContent(await learningPathService.getAdminNodeContent(selectedNode.nodeId));
      await refresh();
    } catch {
      toast.error("Không thêm được bài test");
    } finally {
      setSaving(false);
    }
  };

  const removeMaterial = async (materialId: number) => {
    if (!selectedNode) return;
    try {
      await learningPathService.deleteAdminNodeMaterial(materialId);
      setContent(await learningPathService.getAdminNodeContent(selectedNode.nodeId));
      await refresh();
    } catch {
      toast.error("Không xóa được học liệu");
    }
  };

  const removeTest = async (testId: number) => {
    if (!selectedNode) return;
    try {
      await learningPathService.deleteAdminNodeTest(testId);
      setContent(await learningPathService.getAdminNodeContent(selectedNode.nodeId));
      await refresh();
    } catch {
      toast.error("Không xóa được bài test");
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-slate-400">Đang tải lộ trình…</div>;
  }

  if (!path) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        Môn học chưa có lộ trình mẫu nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{path.pathName}</h3>
          {path.description && <p className="text-sm text-slate-500">{path.description}</p>}
        </div>
        <button
          onClick={() => setShowAddNode(true)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Thêm bài học
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/40 p-4 lg:flex-1">
          <LearningPathFlow
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNode?.nodeId ?? null}
            onNodeClick={openNode}
          />
        </div>

        <aside className="overflow-y-auto rounded-xl border border-slate-200 bg-white lg:max-h-[calc(100vh-2rem)] lg:w-[380px] lg:flex-shrink-0">
          {!selectedNode ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Chọn một bài học trên lộ trình để xem &amp; chỉnh sửa.
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-start justify-between border-b border-slate-100 p-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{selectedNode.title}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedNode.level == null ? "Node chung" : `Mức ${selectedNode.level}`} · Chặng{" "}
                    {selectedNode.stageOrder ?? "—"} · {selectedNode.nodeType === "ON_CLASS" ? "Trên lớp" : "Tự học"}
                  </p>
                </div>
                <button onClick={closeDetail} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                  ✕
                </button>
              </div>

              <div className="space-y-5 p-4">
                <section>
                  <SectionTitle>Liên kết ra</SectionTitle>
                  {edges.filter((e) => e.fromNodeId === selectedNode.nodeId).length === 0 ? (
                    <p className="text-xs text-slate-400">Chưa có liên kết.</p>
                  ) : (
                    <ul className="space-y-1">
                      {edges
                        .filter((e) => e.fromNodeId === selectedNode.nodeId)
                        .map((e) => {
                          const to = nodes.find((n) => n.nodeId === e.toNodeId);
                          const score = e.minScore != null || e.maxScore != null;
                          return (
                            <li key={e.edgeId} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-sm">
                              <span>
                                → {to?.title ?? e.toNodeId}
                                {score && (
                                  <span className="ml-2 rounded bg-indigo-100 px-1.5 text-xs text-indigo-700">
                                    {e.minScore != null ? `≥${e.minScore}` : ""}
                                    {e.maxScore != null ? ` <${e.maxScore}` : ""}
                                  </span>
                                )}
                              </span>
                              <button onClick={() => removeEdge(e.edgeId)} className="text-xs text-rose-500 hover:underline">
                                xóa
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </section>

                {selectedNode.testKind !== "GATE" && selectedNode.testKind !== "PLACEMENT" && (
                <section>
                  <SectionTitle>Học liệu</SectionTitle>
                  {loadingContent ? (
                    <p className="text-xs text-slate-400">Đang tải…</p>
                  ) : (
                    <ul className="space-y-1">
                      {(content?.materials ?? []).map((m) => (
                        <li key={m.materialId} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-sm">
                          <a
                            href={
                              m.video?.videoUrl ??
                              (m.file?.fileUrl
                                ? m.file.fileUrl.startsWith("http")
                                  ? m.file.fileUrl
                                  : `${API_BASE_URL}${m.file.fileUrl}`
                                : "#")
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-indigo-600 hover:underline"
                          >
                            {m.title}
                          </a>
                          <button onClick={() => removeMaterial(m.materialId)} className="text-xs text-rose-500 hover:underline">
                            xóa
                          </button>
                        </li>
                      ))}
                      {(content?.materials ?? []).length === 0 && <p className="text-xs text-slate-400">Chưa có học liệu.</p>}
                    </ul>
                  )}
                  <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-2">
                    <input className="lp-input" placeholder="Tiêu đề học liệu" value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
                    <select className="lp-input" value={mType} onChange={(e) => setMType(e.target.value as "video" | "file")}>
                      <option value="video">Video (URL)</option>
                      <option value="file">Tệp tải lên</option>
                    </select>
                    {mType === "video" ? (
                      <input className="lp-input" placeholder="https://…" value={mVideoUrl} onChange={(e) => setMVideoUrl(e.target.value)} />
                    ) : (
                      <input type="file" className="lp-input" onChange={(e) => setMFile(e.target.files?.[0] ?? null)} />
                    )}
                    <button onClick={addMaterial} disabled={saving} className="w-full rounded-md bg-slate-800 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                      Thêm học liệu
                    </button>
                  </div>
                </section>
                )}

                <section>
                  <SectionTitle>Bài test</SectionTitle>
                  <ul className="space-y-1">
                    {(content?.tests ?? []).map((t) => (
                      <li key={t.testId} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-sm">
                        <span>
                          {t.title}
                          <span className="ml-2 text-xs text-slate-400">
                            {t.durationMinutes ?? "?"}′ · đạt {t.passingPercentage ?? 0}%
                          </span>
                        </span>
                        <button onClick={() => removeTest(t.testId)} className="text-xs text-rose-500 hover:underline">
                          xóa
                        </button>
                      </li>
                    ))}
                    {(content?.tests ?? []).length === 0 && <p className="text-xs text-slate-400">Chưa có bài test.</p>}
                  </ul>
                  <div className="mt-2 grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-lg border border-slate-200 p-2">
                    <input className="lp-input" placeholder="Tiêu đề test" value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
                    <input className="lp-input w-16" type="number" value={tDuration} onChange={(e) => setTDuration(e.target.value)} title="Phút" />
                    <input className="lp-input w-16" type="number" value={tPass} onChange={(e) => setTPass(e.target.value)} title="% đạt" />
                    <button onClick={addTest} disabled={saving} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                      +
                    </button>
                  </div>
                </section>
              </div>

              <div className="border-t border-slate-100 p-4">
                <button onClick={removeNode} className="w-full rounded-lg border border-rose-300 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                  Xóa bài học này
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {showAddNode && (
        <Modal title="Thêm bài học" onClose={() => setShowAddNode(false)}>
          <Field label="Tiêu đề">
            <input className="lp-input" value={nTitle} onChange={(e) => setNTitle(e.target.value)} />
          </Field>
          <Field label="Mô tả">
            <textarea className="lp-input" rows={2} value={nDesc} onChange={(e) => setNDesc(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mức năng lực">
              <select
                className="lp-input"
                value={nLevel}
                onChange={(e) => setNLevel(e.target.value === "" ? "" : (Number(e.target.value) as 1 | 2 | 3))}
              >
                {LEVEL_OPTIONS.map((o) => (
                  <option key={String(o.value)} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Chặng (stage)">
              <input
                type="number"
                min={1}
                className="lp-input"
                value={nStage}
                onChange={(e) => setNStage(Number(e.target.value) || 1)}
              />
            </Field>
          </div>
          <Field label="Loại">
            <select className="lp-input" value={nKind} onChange={(e) => setNKind(e.target.value as "AT_HOME" | "ON_CLASS" | "GATE" | "PLACEMENT")}>
              <option value="AT_HOME">Tự học</option>
              <option value="ON_CLASS">Trên lớp</option>
              <option value="GATE">Test thường (chốt chặn)</option>
              <option value="PLACEMENT">Test năng lực (phân luồng)</option>
            </select>
          </Field>
          <ModalActions onCancel={() => setShowAddNode(false)} onSave={submitAddNode} saving={saving} />
        </Modal>
      )}

      <style>{`.lp-input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:6px 10px;font-size:14px;outline:none}.lp-input:focus{border-color:#6366f1}`}</style>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-base font-semibold text-slate-800">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <button onClick={onCancel} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
        Hủy
      </button>
      <button onClick={onSave} disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {saving ? "Đang lưu…" : "Lưu"}
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h4>;
}

export default LearningPathManager;
