import { useState, useEffect, useCallback, type ReactNode } from "react";
import { learningPathService } from "../../services/learningPath.service";
import type {
  LearningPathResponse,
  LearningNodeResponse,
  NodeEdgeResponse,
  NodeContentResponse,
} from "../../services/learningPath.service";
import { uploadService } from "../../services/upload.service";
import { MaterialPreview, VideoPreview } from "./MaterialPreview";
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

type Lvl = 1 | 2 | 3;
const ALL_LEVELS: Lvl[] = [1, 2, 3];

const isLearningNode = (n: LearningNodeResponse) => n.testKind == null || n.testKind === "NONE";
const isPlacementNode = (n: LearningNodeResponse) => n.testKind === "PLACEMENT";
// GATE và FREE_CHOICE đều nằm CÙNG STAGE với các node học của nhánh.
const isGateLikeNode = (n: LearningNodeResponse) => n.testKind === "GATE" || n.testKind === "FREE_CHOICE";

const parseApplies = (s?: string | null): Set<number> =>
  new Set(
    (s ?? "")
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => x === 1 || x === 2 || x === 3)
  );

function computeDesiredEdges(allNodes: LearningNodeResponse[]): Array<{ from: number; to: number }> {
  const nodes = allNodes.filter((n) => !n.isDeleted);
  const byStage = new Map<number, LearningNodeResponse[]>();
  for (const n of nodes) {
    const s = n.stageOrder ?? 0;
    if (!byStage.has(s)) byStage.set(s, []);
    byStage.get(s)!.push(n);
  }
  const stages = [...byStage.keys()].sort((a, b) => a - b);

  const learnAt = (s: number, lvl: Lvl) =>
    (byStage.get(s) ?? []).find((n) => isLearningNode(n) && n.level === lvl) ?? null;
  const chungLearnAt = (s: number) =>
    (byStage.get(s) ?? []).find((n) => isLearningNode(n) && n.level == null) ?? null;
  const placementAt = (s: number) => (byStage.get(s) ?? []).find(isPlacementNode) ?? null;
  // GATE (phân luồng) và FREE_CHOICE (tự do chọn) nối cạnh KHÁC nhau → tách riêng.
  const gatesAt = (s: number) => (byStage.get(s) ?? []).filter((n) => n.testKind === "GATE");
  const freeChoiceAt = (s: number) => (byStage.get(s) ?? []).filter((n) => n.testKind === "FREE_CHOICE");
  // Một chặng có thể có NHIỀU gate (vd Yếu+TB 1 gate, Khá 1 gate riêng).
  const gateCovering = (s: number, x: Lvl): LearningNodeResponse | null => {
    for (const g of gatesAt(s)) {
      const a = parseApplies(g.appliesLevels);
      if (a.size === 0 || a.has(x)) return g;
    }
    return null;
  };
  // Test tự do = 3 node, mỗi node ứng 1 nhánh (level = mức đích). Đạt bài nào → nhánh đó.
  const freeChoiceForLevel = (s: number, x: Lvl): LearningNodeResponse | null =>
    freeChoiceAt(s).find((t) => t.level === x) ?? null;

  const exitForLevel = (s: number, x: Lvl): LearningNodeResponse | null => {
    const pl = placementAt(s);
    if (pl) return pl;
    const fc = freeChoiceForLevel(s, x);
    if (fc) return fc;
    const g = gateCovering(s, x);
    if (g) return g;
    return learnAt(s, x) ?? chungLearnAt(s); // mức auto-pass (không test nào phụ trách)
  };
  const entryForLevel = (s: number, x: Lvl): LearningNodeResponse | null => {
    const pl = placementAt(s);
    if (pl) return pl;
    return learnAt(s, x) ?? chungLearnAt(s);
  };

  const result = new Set<string>();
  const add = (from: number, to: number) => {
    if (from !== to) result.add(`${from}->${to}`);
  };

  // Trong stage: nối node học của nhánh vào test.
  for (const s of stages) {
    const learns = (byStage.get(s) ?? []).filter(isLearningNode);
    // GATE: chỉ nhánh có mức ∈ applies (có thể nhiều gate).
    for (const g of gatesAt(s)) {
      const applies = parseApplies(g.appliesLevels);
      for (const L of learns) {
        if (L.level == null || applies.size === 0 || applies.has(L.level)) add(L.nodeId, g.nodeId);
      }
    }
    // FREE_CHOICE: MỌI nhánh → MỖI node test tự do (HS chọn bài nào cũng được).
    const fcs = freeChoiceAt(s);
    if (fcs.length) {
      for (const L of learns) for (const t of fcs) add(L.nodeId, t.nodeId);
    }
  }
  // Giữa 2 stage liền kề.
  for (let i = 0; i < stages.length - 1; i++) {
    const s = stages[i];
    const t = stages[i + 1];
    for (const x of ALL_LEVELS) {
      const e = exitForLevel(s, x);
      const n = entryForLevel(t, x);
      if (e && n) add(e.nodeId, n.nodeId);
    }
  }

  return [...result].map((k) => {
    const [from, to] = k.split("->").map(Number);
    return { from, to };
  });
}

/** Đồng bộ cạnh thực tế về tập cạnh mong muốn (xóa thừa, thêm thiếu). */
async function syncEdges(current: NodeEdgeResponse[], desired: Array<{ from: number; to: number }>) {
  const desiredSet = new Set(desired.map((e) => `${e.from}->${e.to}`));
  const currentSet = new Set(current.map((e) => `${e.fromNodeId}->${e.toNodeId}`));
  for (const e of current) {
    if (!desiredSet.has(`${e.fromNodeId}->${e.toNodeId}`)) {
      try {
        await learningPathService.deleteAdminEdge(e.edgeId);
      } catch {
        /* bỏ qua */
      }
    }
  }
  for (const e of desired) {
    if (!currentSet.has(`${e.from}->${e.to}`)) {
      try {
        await learningPathService.createAdminEdge({ fromNodeId: e.from, toNodeId: e.to });
      } catch {
        /* bỏ qua nếu cạnh đã tồn tại */
      }
    }
  }
}

export function LearningPathManager({ subjectId }: LearningPathManagerProps) {
  const [templates, setTemplates] = useState<LearningPathResponse[]>([]);
  const [path, setPath] = useState<LearningPathResponse | null>(null);
  const [showCreateTpl, setShowCreateTpl] = useState(false);
  const [cTplName, setCTplName] = useState("");
  const [cTplDesc, setCTplDesc] = useState("");
  const [showEditTpl, setShowEditTpl] = useState(false);
  const [eTpName, setETplName] = useState("");
  const [eTplDesc, setETplDesc] = useState("");
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
  const [nKind, setNKind] = useState<"AT_HOME" | "ON_CLASS" | "GATE" | "PLACEMENT" | "FREE_CHOICE">("AT_HOME");
  const [nApplies, setNApplies] = useState<number[]>([]);
  const [nUpMin, setNUpMin] = useState("");
  const [nDownMax, setNDownMax] = useState("");
  const [nYeuMax, setNYeuMax] = useState("");
  const [nTbMax, setNTbMax] = useState("");
  const [saving, setSaving] = useState(false);

  const [mTitle, setMTitle] = useState("");
  const [mType, setMType] = useState<"video" | "file">("video");
  const [mVideoUrl, setMVideoUrl] = useState("");
  const [mFile, setMFile] = useState<File | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDuration, setTDuration] = useState("15");
  const [tPass, setTPass] = useState("80");
  const [numQuestions, setNumQuestions] = useState("0");
  const [builderQuestions, setBuilderQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [editingNodeTest, setEditingNodeTest] = useState<any | null>(null);

  const handleNumQuestionsChange = (val: string) => {
    setNumQuestions(val);
    const n = Math.max(0, parseInt(val, 10) || 0);
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next.length < n) {
        for (let i = next.length; i < n; i++) {
          next.push({
            questionType: 'MULTIPLE_CHOICE',
            questionContent: '',
            answers: [
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false }
            ]
          });
        }
      } else if (next.length > n) {
        next.splice(n);
      }
      return next;
    });
    if (activeQuestionIdx >= n && n > 0) {
      setActiveQuestionIdx(n - 1);
    }
  };

  const updateQuestionField = (idx: number, field: string, value: any) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  };

  const updateAnswerField = (qIdx: number, aIdx: number, field: string, value: any) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx];
      if (q && q.answers && q.answers[aIdx]) {
        const nextAnswers = [...q.answers];
        nextAnswers[aIdx] = { ...nextAnswers[aIdx], [field]: value };
        if (field === 'isCorrect' && value === true && q.questionType === 'MULTIPLE_CHOICE') {
          nextAnswers.forEach((ans: any, i: number) => {
            if (i !== aIdx) ans.isCorrect = false;
          });
        }
        next[qIdx] = { ...q, answers: nextAnswers };
      }
      return next;
    });
  };

  const handleQuestionTypeChange = (idx: number, type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'ESSAY') => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[idx]) {
        if (type === 'ESSAY') {
          next[idx] = {
            ...next[idx],
            questionType: 'ESSAY',
            answers: [{ answerContent: '', isCorrect: true }]
          };
        } else if (type === 'MULTIPLE_SELECT') {
          next[idx] = {
            ...next[idx],
            questionType: 'MULTIPLE_SELECT',
            answers: [
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false }
            ]
          };
        } else {
          next[idx] = {
            ...next[idx],
            questionType: 'MULTIPLE_CHOICE',
            answers: [
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false },
              { answerContent: '', isCorrect: false }
            ]
          };
        }
      }
      return next;
    });
  };

  const addAnswerOption = (qIdx: number) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx];
      if (q && q.answers) {
        next[qIdx] = {
          ...q,
          answers: [...q.answers, { answerContent: '', isCorrect: false }]
        };
      }
      return next;
    });
  };

  const removeAnswerOption = (qIdx: number, aIdx: number) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx];
      if (q && q.answers && q.answers.length > 2) {
        const nextAnswers = [...q.answers];
        nextAnswers.splice(aIdx, 1);
        next[qIdx] = { ...q, answers: nextAnswers };
      }
      return next;
    });
  };

  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [exTitle, setExTitle] = useState("");
  const [exInstr, setExInstr] = useState("");
  const [exAllowText, setExAllowText] = useState(true);
  const [exAllowFile, setExAllowFile] = useState(true);

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
        const tpls = (await learningPathService.getAdminSubjectTemplates(subjectId)).filter((t) => !t.classroomSubjectId);
        if (!active) return;
        setTemplates(tpls);
        const p = tpls[0] ?? null;
        setPath(p);
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

  const reloadTemplates = async () => {
    const tpls = (await learningPathService.getAdminSubjectTemplates(subjectId)).filter((t) => !t.classroomSubjectId);
    setTemplates(tpls);
    return tpls;
  };

  const selectPath = async (p: LearningPathResponse) => {
    setPath(p);
    setSelectedNode(null);
    setContent(null);
    await loadGraph(p.pathId);
  };

  const submitCreateTpl = async () => {
    if (!cTplName.trim()) {
      toast.error("Nhập tên lộ trình");
      return;
    }
    setSaving(true);
    try {
      const created = await learningPathService.createAdminTemplate({
        subjectId,
        pathName: cTplName.trim(),
        description: cTplDesc.trim() || undefined,
      });
      toast.success("Đã tạo lộ trình");
      setShowCreateTpl(false);
      setCTplName("");
      setCTplDesc("");
      const tpls = await reloadTemplates();
      const newP = tpls.find((t) => t.pathId === created.pathId) ?? created;
      setPath(newP);
      setNodes([]);
      setEdges([]);
      await loadGraph(newP.pathId);
    } catch {
      toast.error("Không tạo được lộ trình");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = () => {
    if(!path) return;
    setETplName(path.pathName);
    setETplDesc(path.description ?? "");
    setShowEditTpl(true);
  };

  const submitEditTpl = async () => {
    if(!path || !eTplDesc.trim()) { toast.error("Nhập tên lộ trình"); return; }
    setSaving(true);
    try{
      await learningPathService.updateAdminTemplate(path.pathId, {
        pathName: eTpName.trim(), description: eTplDesc.trim() || undefined,
      });
      toast.success("Đã cập nhật lộ trình");
      setShowEditTpl(false);
      const tpls = await reloadTemplates();
      setPath(tpls.find((t) => t.pathId === path.pathId) ?? tpls[0] ?? null);
    }catch {
      toast.error("Không cập nhật được lộ trình");
    }
    finally {
      setSaving(false);
    }
  }

  const handleDeleteTemplate = async () => {
    if (!path) return;
    if (!confirm(`Xóa lộ trình "${path.pathName}"?`)) return;
    try {
      await learningPathService.deleteAdminTemplate(path.pathId);
      toast.success("Đã xóa lộ trình");
      const tpls = await reloadTemplates();
      const next = tpls[0] ?? null;
      setPath(next);
      setSelectedNode(null);
      if (next) await loadGraph(next.pathId); else { setNodes([]); setEdges([]); }
    } catch { toast.error("Không xóa được lộ trình"); }
  };

  const openNode = async (node: LearningNodeResponse) => {
    setSelectedNode(node);
    setEditingNodeTest(null);
    setETitle(node.title);
    setEDesc(node.description ?? "");
    setContent(null);
    setLoadingContent(true);
    try {
      const data = await learningPathService.getAdminNodeContent(node.nodeId);
      setContent(data);

      const isTestNode = node.testKind === "PLACEMENT" || node.testKind === "GATE" || node.testKind === "FREE_CHOICE";
      if (isTestNode && data.tests && data.tests.length > 0) {
        const activeTest = data.tests[0];
        setTTitle(activeTest.title);
        setTDuration(String(activeTest.durationMinutes || 15));
        setTPass(String(activeTest.passingPercentage || 0));
        
        try {
          const qList = await learningPathService.getAdminTestQuestions(activeTest.testId);
          setNumQuestions(String(qList.length));
          setBuilderQuestions(qList.map((q) => ({
            questionType: q.questionType === 'ESSAY' ? 'ESSAY' : (q.questionType === 'MULTIPLE_SELECT' ? 'MULTIPLE_SELECT' : 'MULTIPLE_CHOICE'),
            questionContent: q.questionContent,
            answers: q.answers.map((a) => ({
              answerContent: a.answerContent,
              isCorrect: a.isCorrect
            }))
          })));
          setActiveQuestionIdx(0);
        } catch (qErr) {
          console.error("Failed to load questions", qErr);
          setNumQuestions("0");
          setBuilderQuestions([]);
          setActiveQuestionIdx(0);
        }
      } else {
        setTTitle("");
        setTDuration("15");
        setTPass("0");
        setNumQuestions("0");
        setBuilderQuestions([]);
        setActiveQuestionIdx(0);
      }
    } catch {
      setContent({ materials: [], tests: [], exercises: [] });
    } finally {
      setLoadingContent(false);
    }
  };

  const closeDetail = () => {
    setSelectedNode(null);
    setContent(null);
    setEditingNodeTest(null);
    setMTitle("");
    setMVideoUrl("");
    setMFile(null);
    setTTitle("");
    setExTitle("");
    setExInstr("");
    setExAllowText(true);
    setExAllowFile(true);
  };

  const saveNodeEdit = async () => {
    if (!selectedNode || !eTitle.trim()) {
      toast.error("Nhập tên node");
      return;
    }
    setSaving(true);
    try {
      await learningPathService.updateAdminNode(selectedNode.nodeId, {
        title: eTitle.trim(),
        description: eDesc.trim(),
        nodeType: selectedNode.nodeType,
      });
      toast.success("Đã lưu node");
      setSelectedNode({ ...selectedNode, title: eTitle.trim(), description: eDesc.trim() });
      await refresh();
    } catch {
      toast.error("Không lưu được node");
    } finally {
      setSaving(false);
    }
  };

  const startEditingNodeTest = async (test: any) => {
    setEditingNodeTest(test);
    setTTitle(test.title);
    setTDuration(String(test.durationMinutes || 15));
    setTPass(String(test.passingPercentage || 0));
    setSaving(true);
    try {
      const qList = await learningPathService.getAdminTestQuestions(test.testId);
      setNumQuestions(String(qList.length));
      setBuilderQuestions(qList.map((q) => ({
        questionType: q.questionType === 'ESSAY' ? 'ESSAY' : (q.questionType === 'MULTIPLE_SELECT' ? 'MULTIPLE_SELECT' : 'MULTIPLE_CHOICE'),
        questionContent: q.questionContent,
        answers: q.answers.map((a) => ({
          answerContent: a.answerContent,
          isCorrect: a.isCorrect
        }))
      })));
      setActiveQuestionIdx(0);
    } catch (qErr) {
      console.error("Failed to load questions", qErr);
      setNumQuestions("0");
      setBuilderQuestions([]);
      setActiveQuestionIdx(0);
    } finally {
      setSaving(false);
    }
  };

  const saveSidebarNodeTest = async () => {
    if (!selectedNode) return;
    const isTestNode = selectedNode.testKind === 'PLACEMENT' || selectedNode.testKind === 'GATE' || selectedNode.testKind === 'FREE_CHOICE';
    const testTitleToUse = isTestNode ? eTitle.trim() : tTitle.trim();
    if (!testTitleToUse) {
      toast.error("Nhập tiêu đề bài test");
      return;
    }
    const numQ = Math.max(0, parseInt(numQuestions, 10) || 0);
    
    // Validate questions
    for (let i = 0; i < numQ; i++) {
      const q = builderQuestions[i];
      if (!q) continue;
      if (!q.questionContent.trim()) {
        toast.error(`Câu hỏi ${i + 1} không được để trống nội dung`);
        return;
      }
      if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'MULTIPLE_SELECT') {
        const correctAnswers = q.answers.filter((a: any) => a.isCorrect);
        if (correctAnswers.length === 0) {
          toast.error(`Câu hỏi ${i + 1} phải có ít nhất 1 đáp án đúng`);
          return;
        }
        for (let j = 0; j < q.answers.length; j++) {
          if (!q.answers[j].answerContent.trim()) {
            toast.error(`Đáp án ${String.fromCharCode(65 + j)} của câu hỏi ${i + 1} không được để trống`);
            return;
          }
        }
      } else if (q.questionType === 'ESSAY') {
        if (!q.answers[0] || !q.answers[0].answerContent.trim()) {
          toast.error(`Câu hỏi tự luận ${i + 1} phải nhập câu trả lời mẫu/hướng dẫn chấm`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      // 1. If test already exists, delete it first
      const testIdToDelete = isTestNode 
        ? (content?.tests && content.tests.length > 0 ? content.tests[0].testId : null)
        : (editingNodeTest ? editingNodeTest.testId : null);
        
      if (testIdToDelete) {
        await learningPathService.deleteAdminNodeTest(testIdToDelete);
      }

      // 2. Create new test
      const testRes = await learningPathService.addAdminNodeTest(selectedNode.nodeId, {
        title: testTitleToUse,
        durationMinutes: Number(tDuration) || 15,
        passingPercentage: selectedNode.testKind === 'PLACEMENT' ? 0 : (Number(tPass) || 0),
      });

      const createdTestId = testRes.testId;

      // 3. Create questions sequentially
      for (let i = 0; i < numQ; i++) {
        const q = builderQuestions[i];
        if (!q) continue;
        await learningPathService.addAdminTestQuestion(createdTestId, {
          questionContent: q.questionContent.trim(),
          questionType: q.questionType,
          score: 1.0,
          answers: q.answers.map((a: any) => ({
            answerContent: a.answerContent.trim(),
            isCorrect: a.isCorrect
          }))
        });
      }

      toast.success("Đã cập nhật bài test thành công");
      setEditingNodeTest(null);
      setContent(await learningPathService.getAdminNodeContent(selectedNode.nodeId));
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Không lưu được bài test");
    } finally {
      setSaving(false);
    }
  };

  // Tính lại toàn bộ cạnh từ tập node hiện tại rồi đồng bộ, sau đó nạp lại graph.
  const rewireAll = async (pathId: number) => {
    const g = await learningPathService.getAdminTemplateGraph(pathId);
    await syncEdges(g.edges, computeDesiredEdges(g.nodes));
    await loadGraph(pathId);
  };

  const submitAddNode = async () => {
    if (!path) return;
    if (!nTitle.trim()) {
      toast.error("Nhập tiêu đề bài học");
      return;
    }
    if (nodes.length === 0 && nKind !== "PLACEMENT") {
      toast.error("Node đầu tiên của lộ trình phải là Test năng lực.");
      return;
    }

    const numQ = Math.max(0, parseInt(numQuestions, 10) || 0);

    if (nKind === "PLACEMENT") {
      if (!tDuration || Number(tDuration) <= 0) {
        toast.error("Thời lượng bài test phải lớn hơn 0");
        return;
      }
    }

    const stageNodes = nodes.filter((n) => (n.stageOrder ?? 0) === nStage);
    const stageHasPlacement = stageNodes.some(isPlacementNode);
    let lvl: number | null;
    let appliesLevels: string | undefined;

    if (nKind === "PLACEMENT") {
      // Test năng lực: mọi mức đều thi → đứng MỘT MÌNH ở chặng của nó.
      if (stageNodes.length > 0) {
        toast.error(`Test năng lực phải đứng riêng một chặng. Chặng ${nStage} đã có node khác.`);
        return;
      }
      appliesLevels = "1,2,3";
      lvl = null;
    } else if (nKind === "FREE_CHOICE") {
      // Test tự do chọn: bao mọi mức (HS tự chọn) → không ghép chung chặng với
      // bất kỳ test phân luồng/tự do nào khác.
      if (stageHasPlacement) {
        toast.error(`Chặng ${nStage} là chặng test năng lực — không thêm node khác.`);
        return;
      }
      if (stageNodes.some(isGateLikeNode)) {
        toast.error(`Chặng ${nStage} đã có test phân luồng/tự do — không thêm test tự do nữa.`);
        return;
      }
      appliesLevels = "1,2,3";
      lvl = null;
    } else if (nKind === "GATE") {
      if (stageHasPlacement) {
        toast.error(`Chặng ${nStage} là chặng test năng lực — không thêm node khác.`);
        return;
      }
      if (nApplies.length === 0) {
        toast.error("Chọn ít nhất 1 mức làm test phân luồng.");
        return;
      }
      const sorted = [...nApplies].sort((a, b) => a - b);
      // Test phân luồng chỉ ghép các mức LIỀN KỀ (tối đa 2): {Yếu},{TB},{Khá},
      // {Yếu,TB},{TB,Khá}. KHÔNG cho Yếu+Khá hay cả 3 — dùng Test tự do thay thế.
      const contiguousPair = sorted.length <= 2 && (sorted.length < 2 || sorted[1] - sorted[0] === 1);
      if (!contiguousPair) {
        toast.error(
          "Test phân luồng chỉ ghép 2 mức liền kề (Yếu+TB hoặc TB+Khá). Yếu và Khá phải tách riêng — hoặc dùng Test tự do chọn."
        );
        return;
      }
      // Mỗi mức chỉ thuộc 1 test phân luồng trong cùng chặng (không chồng mức).
      const overlap = stageNodes.filter(isGateLikeNode).some((g) => {
        const a = parseApplies(g.appliesLevels);
        return a.size === 0 || sorted.some((x) => a.has(x));
      });
      if (overlap) {
        toast.error(`Chặng ${nStage} đã có test phủ mức bạn chọn. Mỗi mức chỉ thuộc 1 test phân luồng.`);
        return;
      }
      appliesLevels = sorted.join(",");
      lvl = sorted.length === 1 ? sorted[0] : null;
    } else {
      // Node học (AT_HOME / ON_CLASS)
      if (stageHasPlacement) {
        toast.error(`Chặng ${nStage} là chặng test năng lực — không thêm node học.`);
        return;
      }
      lvl = nLevel === "" ? null : Number(nLevel);
      const atStage = stageNodes.filter((n) => n.testKind == null || n.testKind === "NONE");
      if (lvl == null) {
        if (atStage.length > 0) {
          toast.error(`Chặng ${nStage} đã có node học — không thêm node học chung được.`);
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
    }
    setSaving(true);
    try {
      if (nKind === "FREE_CHOICE") {
        // Test tự do = 3 node test (Yếu/TB/Khá) cùng chặng; mỗi node route về
        // nhánh của nó (level = mức đích). Mọi nhánh sẽ nối vào cả 3 (rewireAll).
        const variants: { lv: 1 | 2 | 3; name: string }[] = [
          { lv: 1, name: "Yếu" },
          { lv: 2, name: "TB" },
          { lv: 3, name: "Khá" },
        ];
        for (const v of variants) {
          await learningPathService.createAdminNode({
            learningPathId: path.pathId,
            title: `${nTitle.trim()} – ${v.name}`,
            description: nDesc.trim() || undefined,
            nodeType: "AT_HOME",
            testKind: "FREE_CHOICE",
            appliesLevels: String(v.lv),
            displayOrder: 0,
            isRequired: true,
            stageOrder: nStage,
            level: v.lv,
          });
        }
      } else {
        const res = await learningPathService.createAdminNode({
          learningPathId: path.pathId,
          title: nTitle.trim(),
          description: nDesc.trim() || undefined,
          nodeType: nKind === "ON_CLASS" ? "ON_CLASS" : "AT_HOME",
          testKind: nKind === "GATE" ? "GATE" : nKind === "PLACEMENT" ? "PLACEMENT" : "NONE",
          appliesLevels,
          gateUpMin: nKind === "GATE" && nUpMin !== "" ? Number(nUpMin) : undefined,
          gateDownMax: nKind === "GATE" && nDownMax !== "" ? Number(nDownMax) : undefined,
          placementYeuMax: nKind === "PLACEMENT" && nYeuMax !== "" ? Number(nYeuMax) : undefined,
          placementTbMax: nKind === "PLACEMENT" && nTbMax !== "" ? Number(nTbMax) : undefined,
          displayOrder: 0,
          isRequired: true,
          stageOrder: nStage,
          level: lvl,
        });

        // Create test and questions sequentially if node is PLACEMENT
        if (nKind === "PLACEMENT") {
          const testRes = await learningPathService.addAdminNodeTest(res.nodeId, {
            title: nTitle.trim(),
            durationMinutes: Number(tDuration) || 15,
            passingPercentage: 0,
          });

          const createdTestId = testRes.testId;

          for (let i = 0; i < numQ; i++) {
            await learningPathService.addAdminTestQuestion(createdTestId, {
              questionContent: `Câu hỏi ${i + 1}`,
              questionType: "MULTIPLE_CHOICE",
              score: 1.0,
              answers: [
                { answerContent: "Đáp án A", isCorrect: true },
                { answerContent: "Đáp án B", isCorrect: false },
                { answerContent: "Đáp án C", isCorrect: false },
                { answerContent: "Đáp án D", isCorrect: false }
              ]
            });
          }
        }
      }
      await rewireAll(path.pathId);
      toast.success("Đã thêm bài học");
      setShowAddNode(false);
      setNTitle("");
      setNDesc("");
      setNLevel("");
      setNStage(1);
      setNKind("AT_HOME");
      setNApplies([]);
      setNUpMin("");
      setNDownMax("");
      setNYeuMax("");
      setNTbMax("");
      setTDuration("15");
      setNumQuestions("0");
      setBuilderQuestions([]);
      setActiveQuestionIdx(0);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Không thêm được bài học");
    } finally {
      setSaving(false);
    }
  };

  const removeNode = async () => {
    if (!selectedNode || !path) return;
    const x = selectedNode;
    // Test tự do gồm 3 node cùng chặng → xóa cả nhóm cho khỏi dở.
    const isFC = x.testKind === "FREE_CHOICE";
    const group = isFC
      ? nodes.filter((n) => n.testKind === "FREE_CHOICE" && (n.stageOrder ?? 0) === (x.stageOrder ?? 0))
      : [x];
    const label = isFC ? `nhóm test tự do (${group.length} node)` : `bài học "${x.title}"`;
    if (!confirm(`Xóa ${label}?`)) return;
    const delIds = new Set(group.map((n) => n.nodeId));
    try {
      for (const n of group) {
        try {
          await learningPathService.deleteAdminNode(n.nodeId);
        } catch {
          /* bỏ qua */
        }
      }
      // Nếu chặng bị rỗng sau khi xóa thì dồn các chặng phía sau lên 1.
      const deletedStage = x.stageOrder ?? 0;
      const stillAtStage = nodes.some((n) => !delIds.has(n.nodeId) && (n.stageOrder ?? 0) === deletedStage);
      if (deletedStage > 0 && !stillAtStage) {
        const toShift = nodes.filter((n) => !delIds.has(n.nodeId) && (n.stageOrder ?? 0) > deletedStage);
        for (const n of toShift) {
          try {
            await learningPathService.updateAdminNode(n.nodeId, {
              title: n.title,
              nodeType: n.nodeType,
              stageOrder: (n.stageOrder ?? 0) - 1,
            });
          } catch {
            /* bỏ qua */
          }
        }
      }
      // Cạnh được tính lại tất định từ tập node còn lại.
      await rewireAll(path.pathId);
      toast.success("Đã xóa");
      closeDetail();
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
        // Upload thẳng lên Cloudinary, chỉ lưu URL + public_id vào BE (không lưu file trên server)
        const uploaded = await uploadService.uploadToCloudinary(mFile, "materials");
        fd.append("fileUrl", uploaded.url);
        fd.append("fileName", mFile.name);
        fd.append("fileType", mFile.type || uploaded.format || "");
        fd.append("publicId", uploaded.publicId);
        if (uploaded.resourceType) fd.append("resourceType", uploaded.resourceType);
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thêm được học liệu");
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

  const addExercise = async () => {
    if (!selectedNode || !exTitle.trim()) {
      toast.error("Nhập tiêu đề bài tập");
      return;
    }
    if (!exAllowText && !exAllowFile) {
      toast.error("Chọn ít nhất một hình thức nộp (tự luận hoặc file)");
      return;
    }
    setSaving(true);
    try {
      await learningPathService.addAdminNodeExercise(selectedNode.nodeId, {
        title: exTitle.trim(),
        instructions: exInstr.trim() || undefined,
        allowText: exAllowText,
        allowFile: exAllowFile,
      });
      toast.success("Đã thêm bài tập");
      setExTitle("");
      setExInstr("");
      setExAllowText(true);
      setExAllowFile(true);
      setContent(await learningPathService.getAdminNodeContent(selectedNode.nodeId));
      await refresh();
    } catch {
      toast.error("Không thêm được bài tập");
    } finally {
      setSaving(false);
    }
  };

  const removeExercise = async (exerciseId: number) => {
    if (!selectedNode) return;
    try {
      await learningPathService.deleteAdminNodeExercise(exerciseId);
      setContent(await learningPathService.getAdminNodeContent(selectedNode.nodeId));
      await refresh();
    } catch {
      toast.error("Không xóa được bài tập");
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-slate-400">Đang tải lộ trình…</div>;
  }

  if (!path) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">Môn học chưa có lộ trình mẫu nào.</p>
          <button
            onClick={() => setShowCreateTpl(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Tạo lộ trình
          </button>
        </div>
        {showCreateTpl && (
          <Modal title="Tạo lộ trình mới" onClose={() => setShowCreateTpl(false)}>
            <Field label="Tên lộ trình">
              <input className="lp-input" value={cTplName} onChange={(e) => setCTplName(e.target.value)} placeholder="VD: Lộ trình PRJ301 - 2026" />
            </Field>
            <Field label="Mô tả">
              <textarea className="lp-input" rows={2} value={cTplDesc} onChange={(e) => setCTplDesc(e.target.value)} />
            </Field>
            <ModalActions onCancel={() => setShowCreateTpl(false)} onSave={submitCreateTpl} saving={saving} />
          </Modal>
        )}
        <style>{`.lp-input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:6px 10px;font-size:14px;outline:none}.lp-input:focus{border-color:#6366f1}`}</style>
      </>
    );
  }

  const isTestNode = selectedNode && (selectedNode.testKind === 'PLACEMENT' || selectedNode.testKind === 'GATE' || selectedNode.testKind === 'FREE_CHOICE');

  const renderQuestionBuilder = () => {
    const numQ = Math.max(0, parseInt(numQuestions, 10) || 0);
    if (numQ <= 0) return null;
    return (
      <div className="space-y-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {Array.from({ length: numQ }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveQuestionIdx(idx)}
              className={`size-7 shrink-0 rounded-md text-xs font-bold transition-all border ${
                activeQuestionIdx === idx
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {builderQuestions[activeQuestionIdx] && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Câu hỏi {activeQuestionIdx + 1}
              </span>
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(activeQuestionIdx, 'MULTIPLE_CHOICE')}
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold transition-all ${
                    builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE'
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Một đáp án
                </button>
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(activeQuestionIdx, 'MULTIPLE_SELECT')}
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold transition-all ${
                    builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_SELECT'
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Nhiều đáp án
                </button>
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(activeQuestionIdx, 'ESSAY')}
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold transition-all ${
                    builderQuestions[activeQuestionIdx].questionType === 'ESSAY'
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Tự luận
                </button>
              </div>
            </div>

            <textarea
              className="lp-input text-xs w-full"
              placeholder="Nhập đề / nội dung câu hỏi..."
              rows={2}
              value={builderQuestions[activeQuestionIdx].questionContent}
              onChange={(e) => updateQuestionField(activeQuestionIdx, 'questionContent', e.target.value)}
            />

            {builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE' ||
            builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_SELECT' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>
                    ĐÁP ÁN ({builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE' ? 'Chọn 1 đáp án đúng' : 'Chọn nhiều đáp án đúng'})
                  </span>
                  <button
                    type="button"
                    onClick={() => addAnswerOption(activeQuestionIdx)}
                    className="text-indigo-600 hover:underline text-[10px]"
                  >
                    + Thêm đáp án
                  </button>
                </div>
                <div className="space-y-1.5">
                  {builderQuestions[activeQuestionIdx].answers.map((ans: any, aIdx: number) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <span className="font-semibold text-[10px] text-slate-400 shrink-0 w-3">
                        {String.fromCharCode(65 + aIdx)}
                      </span>
                      <input
                        type="text"
                        placeholder={`Đáp án ${String.fromCharCode(65 + aIdx)}`}
                        className="lp-input flex-1 py-1 px-2 text-xs"
                        value={ans.answerContent}
                        onChange={(e) => updateAnswerField(activeQuestionIdx, aIdx, 'answerContent', e.target.value)}
                      />
                      <input
                        type={builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE' ? 'radio' : 'checkbox'}
                        name={`correct-ans-sidebar-${activeQuestionIdx}`}
                        checked={!!ans.isCorrect}
                        onChange={(e) => {
                          if (builderQuestions[activeQuestionIdx].questionType === 'MULTIPLE_CHOICE') {
                            builderQuestions[activeQuestionIdx].answers.forEach((_: any, i: number) => {
                              updateAnswerField(activeQuestionIdx, i, 'isCorrect', i === aIdx);
                            });
                          } else {
                            updateAnswerField(activeQuestionIdx, aIdx, 'isCorrect', e.target.checked);
                          }
                        }}
                        className="h-3.5 w-3.5 text-indigo-600 cursor-pointer"
                      />
                      {builderQuestions[activeQuestionIdx].answers.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeAnswerOption(activeQuestionIdx, aIdx)}
                          className="text-red-500 hover:text-red-700 text-xs px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">CÂU TRẢ LỜI MẪU / HƯỚNG DẪN CHẤM</span>
                <textarea
                  className="lp-input text-xs w-full"
                  placeholder="Nhập câu trả lời mẫu cho tự luận..."
                  rows={3}
                  value={builderQuestions[activeQuestionIdx].answers[0]?.answerContent || ""}
                  onChange={(e) => updateAnswerField(activeQuestionIdx, 0, 'answerContent', e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {templates.map((t) => (
            <button
              key={t.pathId}
              onClick={() => selectPath(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                path.pathId === t.pathId
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.pathName}
            </button>
          ))}
          <button
            onClick={() => setShowCreateTpl(true)}
            className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            + Tạo lộ trình
          </button>
          {path && (
            <span className="ml-1 inline-flex gap-1">
              <button onClick={handleEditTemplate} title="Sửa lộ trình đang chọn" className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                ✎ Sửa
              </button>
              <button onClick={handleDeleteTemplate} title="Xóa lộ trình đang chọn" className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-sm text-rose-600 hover:bg-rose-50">
                🗑 Xóa
              </button>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{path.pathName}</h3>
            {path.description && <p className="text-sm text-slate-500">{path.description}</p>}
          </div>
          <button
            onClick={() => {
              setTDuration("15");
              setNumQuestions("0");
              setBuilderQuestions([]);
              setActiveQuestionIdx(0);
              setShowAddNode(true);
            }}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Thêm bài học
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50/40 p-3 lg:max-h-[calc(100vh-2rem)] lg:w-[544px] lg:flex-shrink-0">
          <LearningPathFlow
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNode?.nodeId ?? null}
            onNodeClick={openNode}
          />
        </div>

        <aside className="overflow-y-auto rounded-xl border border-slate-200 bg-white lg:max-h-[calc(100vh-2rem)] lg:flex-1 lg:min-w-[360px]">
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
                {editingNodeTest ? (
                  <section>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cấu hình bài test</span>
                      <button
                        type="button"
                        onClick={() => setEditingNodeTest(null)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                      >
                        ← Quay lại
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Tiêu đề bài test</label>
                        <input 
                          className="lp-input" 
                          placeholder="Tiêu đề test" 
                          value={tTitle} 
                          onChange={(e) => setTTitle(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Thời lượng</label>
                          <input 
                            type="number" 
                            min={1} 
                            className="lp-input mt-1 text-center" 
                            value={tDuration} 
                            onChange={(e) => setTDuration(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">% đạt</label>
                          <input 
                            type="number" 
                            min={0} 
                            max={100}
                            className="lp-input mt-1 text-center" 
                            value={tPass} 
                            onChange={(e) => setTPass(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Số câu</label>
                          <input 
                            type="number" 
                            min={0} 
                            className="lp-input mt-1 text-center" 
                            value={numQuestions} 
                            onChange={(e) => handleNumQuestionsChange(e.target.value)} 
                          />
                        </div>
                      </div>

                      {renderQuestionBuilder()}

                      <button
                        type="button"
                        onClick={saveSidebarNodeTest}
                        disabled={saving}
                        className="w-full rounded-md bg-slate-800 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 mt-2"
                      >
                        Lưu bài test
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                    <section>
                      <SectionTitle>Tên &amp; mô tả</SectionTitle>
                      <div className="space-y-2">
                        <input className="lp-input" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
                        <textarea className="lp-input" rows={2} value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Mô tả (tùy chọn)" />
                        <button onClick={saveNodeEdit} disabled={saving} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                          Lưu
                        </button>
                      </div>
                    </section>

                    {isTestNode ? (
                      <section>
                        <SectionTitle>
                          {selectedNode.testKind === 'PLACEMENT' ? 'Cấu hình bài test năng lực' : 
                           selectedNode.testKind === 'GATE' ? 'Cấu hình bài test chặng' : 'Cấu hình bài test tự chọn'}
                        </SectionTitle>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Thời lượng</label>
                              <input 
                                type="number" 
                                min={1} 
                                className="lp-input mt-1 text-center" 
                                value={tDuration} 
                                onChange={(e) => setTDuration(e.target.value)} 
                              />
                            </div>
                            {selectedNode.testKind !== 'PLACEMENT' && (
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">% đạt</label>
                                <input 
                                  type="number" 
                                  min={0} 
                                  max={100}
                                  className="lp-input mt-1 text-center" 
                                  value={tPass} 
                                  onChange={(e) => setTPass(e.target.value)} 
                                />
                              </div>
                            )}
                            <div className={selectedNode.testKind === 'PLACEMENT' ? 'col-span-2' : ''}>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Số câu hỏi</label>
                              <input 
                                type="number" 
                                min={0} 
                                className="lp-input mt-1 text-center" 
                                value={numQuestions} 
                                onChange={(e) => handleNumQuestionsChange(e.target.value)} 
                              />
                            </div>
                          </div>

                          {renderQuestionBuilder()}

                          <button
                            type="button"
                            onClick={saveSidebarNodeTest}
                            disabled={saving}
                            className="w-full rounded-md bg-slate-800 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 mt-2"
                          >
                            Lưu bài test
                          </button>
                        </div>
                      </section>
                    ) : (
                      <>
                        {isLearningNode(selectedNode) && (
                          <section>
                            <SectionTitle>Học liệu</SectionTitle>
                            {loadingContent ? (
                              <p className="text-xs text-slate-400">Đang tải…</p>
                            ) : (
                              <ul className="space-y-1">
                                {(content?.materials ?? []).map((m) => (
                                  <li key={m.materialId} className="rounded-md bg-slate-50 p-2.5 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate font-medium text-slate-700">{m.title}</span>
                                      <button onClick={() => removeMaterial(m.materialId)} className="shrink-0 text-xs text-rose-500 hover:underline">
                                        xóa
                                      </button>
                                    </div>
                                    <MaterialPreview material={m} />
                                  </li>
                                ))}
                                {(content?.materials ?? []).length === 0 && <p className="text-xs text-slate-400">Chưa có học liệu.</p>}
                              </ul>
                            )}
                            <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Thêm học liệu</p>
                              <input className="lp-input" placeholder="Tiêu đề học liệu" value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
                              <select className="lp-input" value={mType} onChange={(e) => setMType(e.target.value as "video" | "file")}>
                                <option value="video">Video (URL)</option>
                                <option value="file">Tệp tải lên</option>
                              </select>
                              {mType === "video" ? (
                                <>
                                  <input className="lp-input" placeholder="https://… (YouTube, Vimeo hoặc .mp4)" value={mVideoUrl} onChange={(e) => setMVideoUrl(e.target.value)} />
                                  {mVideoUrl.trim() && <VideoPreview url={mVideoUrl} />}
                                </>
                              ) : (
                                <input type="file" className="lp-input" onChange={(e) => setMFile(e.target.files?.[0] ?? null)} />
                              )}
                              <button onClick={addMaterial} disabled={saving} className="w-full rounded-md bg-slate-800 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                                Thêm học liệu
                              </button>
                            </div>
                          </section>
                        )}

                        <section>
                          <SectionTitle>Bài test</SectionTitle>
                          <ul className="space-y-1">
                            {(content?.tests ?? []).map((t) => (
                              <li key={t.testId} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-sm">
                                <span className="truncate">
                                  {t.title}
                                  <span className="ml-2 text-xs text-slate-400">
                                    {t.durationMinutes ?? "?"}′ · đạt {t.passingPercentage ?? 0}%
                                  </span>
                                </span>
                                <div className="flex items-center gap-2 shrink-0 text-xs">
                                  <button type="button" onClick={() => startEditingNodeTest(t)} className="text-indigo-600 hover:underline">
                                    cấu hình
                                  </button>
                                  <span className="text-slate-350">|</span>
                                  <button type="button" onClick={() => removeTest(t.testId)} className="text-rose-500 hover:underline">
                                    xóa
                                  </button>
                                </div>
                              </li>
                            ))}
                            {(content?.tests ?? []).length === 0 && <p className="text-xs text-slate-400">Chưa có bài test.</p>}
                          </ul>
                          {(content?.tests ?? []).length >= (isLearningNode(selectedNode) ? Infinity : 1) ? (
                            <p className="mt-2 text-xs text-slate-400">Mỗi node test chỉ có 1 bài test.</p>
                          ) : (
                            <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Thêm bài test</p>
                              <input className="lp-input" placeholder="Tiêu đề test" value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
                              <div className="flex items-center gap-2">
                                <label className="flex-1 text-xs text-slate-500">
                                  Thời lượng (phút)
                                  <input className="lp-input mt-1" type="number" min={1} value={tDuration} onChange={(e) => setTDuration(e.target.value)} />
                                </label>
                                <label className="flex-1 text-xs text-slate-500">
                                  % đạt
                                  <input className="lp-input mt-1" type="number" min={0} max={100} value={tPass} onChange={(e) => setTPass(e.target.value)} />
                                </label>
                              </div>
                              <button onClick={addTest} disabled={saving} className="w-full rounded-md bg-slate-800 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                                Thêm bài test
                              </button>
                            </div>
                          )}
                        </section>

                        {isLearningNode(selectedNode) && (
                          <section>
                            <SectionTitle>Thực hành</SectionTitle>
                            {loadingContent ? (
                              <p className="text-xs text-slate-400">Đang tải…</p>
                            ) : (
                              <ul className="space-y-1">
                                {(content?.exercises ?? []).map((ex) => (
                                  <li key={ex.exerciseId} className="flex items-start justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-sm">
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-slate-700">{ex.title}</p>
                                      <div className="mt-0.5 flex flex-wrap gap-1">
                                        {ex.allowText && (
                                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">Tự luận</span>
                                        )}
                                        {ex.allowFile && (
                                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">Nộp file</span>
                                        )}
                                      </div>
                                    </div>
                                    <button onClick={() => removeExercise(ex.exerciseId)} className="shrink-0 text-xs text-rose-500 hover:underline">
                                      xóa
                                    </button>
                                  </li>
                                ))}
                                {(content?.exercises ?? []).length === 0 && <p className="text-xs text-slate-400">Chưa có bài tập.</p>}
                              </ul>
                            )}
                            <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Thêm bài tập</p>
                              <input className="lp-input" placeholder="Tiêu đề bài tập" value={exTitle} onChange={(e) => setExTitle(e.target.value)} />
                              <textarea className="lp-input" rows={3} placeholder="Đề bài / hướng dẫn (tùy chọn)" value={exInstr} onChange={(e) => setExInstr(e.target.value)} />
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <label className="flex cursor-pointer items-center gap-1.5">
                                  <input type="checkbox" checked={exAllowText} onChange={(e) => setExAllowText(e.target.checked)} />
                                  Tự luận
                                </label>
                                <label className="flex cursor-pointer items-center gap-1.5">
                                  <input type="checkbox" checked={exAllowFile} onChange={(e) => setExAllowFile(e.target.checked)} />
                                  Nộp file
                                </label>
                              </div>
                              <button onClick={addExercise} disabled={saving} className="w-full rounded-md bg-slate-800 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                                Thêm bài tập
                              </button>
                            </div>
                          </section>
                        )}
                      </>
                    )}
                  </>
                )}
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
          <Field label="Loại">
            <select className="lp-input" value={nKind} onChange={(e) => setNKind(e.target.value as typeof nKind)}>
              <option value="AT_HOME">Tự học</option>
              <option value="ON_CLASS">Trên lớp</option>
              <option value="GATE">Test phân luồng</option>
              <option value="PLACEMENT">Test năng lực</option>
              <option value="FREE_CHOICE">Test tự do chọn</option>
            </select>
          </Field>

          {nKind === "AT_HOME" || nKind === "ON_CLASS" ? (
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
                <input type="number" min={1} className="lp-input" value={nStage} onChange={(e) => setNStage(Number(e.target.value) || 1)} />
              </Field>
            </div>
          ) : (
            <>
              {nKind === "GATE" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mức làm test">
                    <div className="flex gap-3 pt-2">
                      {[1, 2, 3].map((lv) => (
                        <label key={lv} className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={nApplies.includes(lv)}
                            onChange={() => setNApplies((p) => (p.includes(lv) ? p.filter((x) => x !== lv) : [...p, lv]))}
                          />
                          {lv === 1 ? "Yếu" : lv === 2 ? "TB" : "Khá"}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label="Chặng (stage)">
                    <input type="number" min={1} className="lp-input" value={nStage} onChange={(e) => setNStage(Number(e.target.value) || 1)} />
                  </Field>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mức làm test">
                    <p className="pt-2 text-sm text-slate-500">
                      {nKind === "FREE_CHOICE" ? "HS tự chọn 1 trong 3 mức" : "Mọi mức (Yếu · TB · Khá)"}
                    </p>
                  </Field>
                  <Field label="Chặng (stage)">
                    <input type="number" min={1} className="lp-input" value={nStage} onChange={(e) => setNStage(Number(e.target.value) || 1)} />
                  </Field>
                </div>
              )}
              {nKind === "PLACEMENT" && (
                <>
                  <p className="text-xs text-slate-500">
                    Test năng lực phải đứng riêng một chặng; mọi học sinh đều làm và được phân về mức theo điểm.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Điểm Yếu tối đa (%)">
                      <input type="number" className="lp-input" value={nYeuMax} onChange={(e) => setNYeuMax(e.target.value)} placeholder="vd 40" />
                    </Field>
                    <Field label="Điểm TB tối đa (%)">
                      <input type="number" className="lp-input" value={nTbMax} onChange={(e) => setNTbMax(e.target.value)} placeholder="vd 70" />
                    </Field>
                  </div>
                  
                  {/* Inline Test Configuration */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Field label="Thời lượng làm test (phút)">
                      <input 
                        type="number" 
                        min={1} 
                        className="lp-input" 
                        value={tDuration} 
                        onChange={(e) => setTDuration(e.target.value)} 
                        placeholder="vd 15" 
                      />
                    </Field>
                    <Field label="Số lượng câu hỏi">
                      <input 
                        type="number" 
                        min={0} 
                        className="lp-input" 
                        value={numQuestions} 
                        onChange={(e) => handleNumQuestionsChange(e.target.value)} 
                        placeholder="vd 5" 
                      />
                    </Field>
                  </div>


                </>
              )}
              {nKind === "GATE" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ngưỡng lên (≥ %)">
                    <input type="number" className="lp-input" value={nUpMin} onChange={(e) => setNUpMin(e.target.value)} placeholder="vd 80" />
                  </Field>
                  <Field label="Ngưỡng xuống (≤ %)">
                    <input type="number" className="lp-input" value={nDownMax} onChange={(e) => setNDownMax(e.target.value)} placeholder="vd 40" />
                  </Field>
                </div>
              )}
              {nKind === "FREE_CHOICE" && (
                <p className="text-xs text-slate-500">
                  Sẽ tạo <b>3 node test</b> (Yếu / TB / Khá) cùng chặng. Mọi nhánh đều nối vào cả 3; học sinh tự chọn
                  làm bài nào, đạt ≥ ngưỡng % của bài đó thì học tiếp nhánh tương ứng (vd đang Yếu, làm bài Khá đạt →
                  học Khá). Mỗi node thêm 1 bài test + ngưỡng % ở phần chi tiết.
                </p>
              )}
            </>
          )}
          <ModalActions
            onCancel={() => {
              setShowAddNode(false);
              setTDuration("15");
              setNumQuestions("0");
              setBuilderQuestions([]);
              setActiveQuestionIdx(0);
            }}
            onSave={submitAddNode}
            saving={saving}
          />
        </Modal>
      )}

      {showCreateTpl && (
        <Modal title="Tạo lộ trình mới" onClose={() => setShowCreateTpl(false)}>
          <Field label="Tên lộ trình">
            <input className="lp-input" value={cTplName} onChange={(e) => setCTplName(e.target.value)} placeholder="VD: Lộ trình PRJ301 - 2026" />
          </Field>
          <Field label="Mô tả">
            <textarea className="lp-input" rows={2} value={cTplDesc} onChange={(e) => setCTplDesc(e.target.value)} />
          </Field>
          <ModalActions onCancel={() => setShowCreateTpl(false)} onSave={submitCreateTpl} saving={saving} />
        </Modal>
      )}

      {showEditTpl && (
        <Modal title={"Sửa lộ trình"} onClose={() => setShowEditTpl(false)}>
          <Field label={"Tên lộ trình"}>
            <input className={"lp-input"} value={eTpName} onChange={(e) => setETplName(e.target.value)} />
          </Field>
          <Field label={"Mô tả"}>
            <textarea className={"lp-input"} rows={2} value={eTplDesc} onChange={(e) => setETplDesc(e.target.value)}/>
          </Field>
          <ModalActions onCancel={() => setShowEditTpl(false)} onSave={submitEditTpl} saving={saving} />
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
