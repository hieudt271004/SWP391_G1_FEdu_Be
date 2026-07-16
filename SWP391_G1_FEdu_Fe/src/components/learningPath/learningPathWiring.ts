import type {
  LearningNodeResponse,
  NodeEdgeResponse,
  CreateNodeEdgeRequest,
} from "../../services/learningPath.service";

export const LEVEL_OPTIONS: { value: "" | 1 | 2 | 3; label: string }[] = [
  { value: "", label: "Chung (mọi mức)" },
  { value: 1, label: "Yếu" },
  { value: 2, label: "Trung bình" },
  { value: 3, label: "Khá" },
];

export type Lvl = 1 | 2 | 3;
export const ALL_LEVELS: Lvl[] = [1, 2, 3];

export type AddNodeKind = "AT_HOME" | "ON_CLASS" | "GATE" | "PLACEMENT" | "FREE_CHOICE";

export const isLearningNode = (n: LearningNodeResponse) => n.testKind == null || n.testKind === "NONE";
export const isPlacementNode = (n: LearningNodeResponse) => n.testKind === "PLACEMENT";

export const isGateLikeNode = (n: LearningNodeResponse) =>
  n.testKind === "GATE" || n.testKind === "FREE_CHOICE";

export const parseApplies = (s?: string | null): Set<number> =>
  new Set(
    (s ?? "")
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => x === 1 || x === 2 || x === 3)
  );

export function computeDesiredEdges(
  allNodes: LearningNodeResponse[]
): Array<{ from: number; to: number }> {
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
  
  const gatesAt = (s: number) => (byStage.get(s) ?? []).filter((n) => n.testKind === "GATE");
  const freeChoiceAt = (s: number) => (byStage.get(s) ?? []).filter((n) => n.testKind === "FREE_CHOICE");
  
  const gateCovering = (s: number, x: Lvl): LearningNodeResponse | null => {
    for (const g of gatesAt(s)) {
      const a = parseApplies(g.appliesLevels);
      if (a.size === 0 || a.has(x)) return g;
    }
    return null;
  };
  
  const freeChoiceForLevel = (s: number, x: Lvl): LearningNodeResponse | null =>
    freeChoiceAt(s).find((t) => t.level === x) ?? null;

  const exitForLevel = (s: number, x: Lvl): LearningNodeResponse | null => {
    const pl = placementAt(s);
    if (pl) return pl;
    const fc = freeChoiceForLevel(s, x);
    if (fc) return fc;
    const g = gateCovering(s, x);
    if (g) return g;
    return learnAt(s, x) ?? chungLearnAt(s); 
  };
  const entryForLevel = (s: number, x: Lvl): LearningNodeResponse | null => {
    const pl = placementAt(s);
    if (pl) return pl;
    const learn = learnAt(s, x) ?? chungLearnAt(s);
    if (learn) return learn;
    
    
    
    
    return gateCovering(s, x);
  };

  const result = new Set<string>();
  const add = (from: number, to: number) => {
    if (from !== to) result.add(`${from}->${to}`);
  };

  
  for (const s of stages) {
    const learns = (byStage.get(s) ?? []).filter(isLearningNode);
    
    for (const g of gatesAt(s)) {
      const applies = parseApplies(g.appliesLevels);
      for (const L of learns) {
        if (L.level == null || applies.size === 0 || applies.has(L.level)) add(L.nodeId, g.nodeId);
      }
    }
    
    const fcs = freeChoiceAt(s);
    if (fcs.length) {
      for (const L of learns) for (const t of fcs) add(L.nodeId, t.nodeId);
    }
  }
  
  for (let i = 0; i < stages.length - 1; i++) {
    const s = stages[i];
    const t = stages[i + 1];
    
    
    
    const tFcs = freeChoiceAt(t);
    const tHasLearnable = placementAt(t) != null || (byStage.get(t) ?? []).some(isLearningNode);
    if (tFcs.length > 0 && !tHasLearnable) {
      for (const x of ALL_LEVELS) {
        const e = exitForLevel(s, x);
        if (e) for (const fc of tFcs) add(e.nodeId, fc.nodeId);
      }
      continue;
    }
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

export interface EdgeSyncAdapter {
  createEdge: (req: CreateNodeEdgeRequest) => Promise<unknown>;
  deleteEdge: (edgeId: number) => Promise<unknown>;
}

export async function syncEdges(
  current: NodeEdgeResponse[],
  desired: Array<{ from: number; to: number }>,
  adapter: EdgeSyncAdapter
) {
  const desiredSet = new Set(desired.map((e) => `${e.from}->${e.to}`));
  const currentSet = new Set(current.map((e) => `${e.fromNodeId}->${e.toNodeId}`));
  for (const e of current) {
    if (!desiredSet.has(`${e.fromNodeId}->${e.toNodeId}`)) {
      try {
        await adapter.deleteEdge(e.edgeId);
      } catch {
        
      }
    }
  }
  for (const e of desired) {
    if (!currentSet.has(`${e.from}->${e.to}`)) {
      try {
        await adapter.createEdge({ fromNodeId: e.from, toNodeId: e.to });
      } catch {
        
      }
    }
  }
}

export type ResolveNodePlacementResult =
  | { error: string }
  | { level: number | null; appliesLevels?: string };

export function resolveNodePlacement(params: {
  kind: AddNodeKind;
  stage: number;
  applies: number[];
  level: "" | 1 | 2 | 3;
  existingNodes: LearningNodeResponse[];
}): ResolveNodePlacementResult {
  const { kind, stage, applies, level, existingNodes } = params;
  const stageNodes = existingNodes.filter((n) => (n.stageOrder ?? 0) === stage);
  const stageHasPlacement = stageNodes.some(isPlacementNode);

  if (kind === "PLACEMENT") {
    
    if (stageNodes.length > 0) {
      return { error: `Test năng lực phải đứng riêng một chặng. Chặng ${stage} đã có node khác.` };
    }
    return { level: null, appliesLevels: "1,2,3" };
  }

  if (kind === "FREE_CHOICE") {
    if (stageHasPlacement) {
      return { error: `Chặng ${stage} là chặng test năng lực — không thêm node khác.` };
    }
    if (stageNodes.some(isGateLikeNode)) {
      return { error: `Chặng ${stage} đã có test phân luồng/tự do — không thêm test tự do nữa.` };
    }
    return { level: null, appliesLevels: "1,2,3" };
  }

  if (kind === "GATE") {
    if (stageHasPlacement) {
      return { error: `Chặng ${stage} là chặng test năng lực — không thêm node khác.` };
    }
    if (applies.length === 0) {
      return { error: "Chọn ít nhất 1 mức làm test phân luồng." };
    }
    const sorted = [...applies].sort((a, b) => a - b);
    
    const contiguousPair = sorted.length <= 2 && (sorted.length < 2 || sorted[1] - sorted[0] === 1);
    if (!contiguousPair) {
      return {
        error:
          "Test phân luồng chỉ ghép 2 mức liền kề (Yếu+TB hoặc TB+Khá). Yếu và Khá phải tách riêng — hoặc dùng Test tự do chọn.",
      };
    }
    
    const overlap = stageNodes.filter(isGateLikeNode).some((g) => {
      const a = parseApplies(g.appliesLevels);
      return a.size === 0 || sorted.some((x) => a.has(x));
    });
    if (overlap) {
      return { error: `Chặng ${stage} đã có test phủ mức bạn chọn. Mỗi mức chỉ thuộc 1 test phân luồng.` };
    }
    return { level: sorted.length === 1 ? sorted[0] : null, appliesLevels: sorted.join(",") };
  }

  
  if (stageHasPlacement) {
    return { error: `Chặng ${stage} là chặng test năng lực — không thêm node học.` };
  }
  const lvl = level === "" ? null : Number(level);
  const atStage = stageNodes.filter((n) => n.testKind == null || n.testKind === "NONE");
  if (lvl == null) {
    if (atStage.length > 0) {
      return { error: `Chặng ${stage} đã có node học — không thêm node học chung được.` };
    }
  } else {
    if (atStage.some((n) => n.level == null)) {
      return { error: `Chặng ${stage} đã có node học chung — không thêm node phân hóa được.` };
    }
    if (atStage.some((n) => n.level === lvl)) {
      return {
        error: `Chặng ${stage} đã có node mức ${LEVEL_OPTIONS.find((o) => o.value === lvl)?.label ?? lvl}.`,
      };
    }
  }
  return { level: lvl };
}
