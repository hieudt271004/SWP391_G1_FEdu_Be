import { useMemo } from "react";
import type { LearningNodeResponse, NodeEdgeResponse } from "../../services/learningPath.service";

interface LearningPathFlowProps {
  nodes: LearningNodeResponse[];
  edges: NodeEdgeResponse[];
  gateNodeIds?: Set<number>;
  highlightLevel?: number | null;
  selectedNodeId?: number | null;
  onNodeClick?: (node: LearningNodeResponse) => void;
}

const COL_X: Record<number, number> = { 0: 110, 1: 320, 2: 530 };
const WIDTH = 640;
const TOP = 28;
const ROW_GAP = 104;
const CIRCLE = 64;
const SQUARE_W = 82;
const SQUARE_H = 52;

function levelToCol(level?: number | null): number {
  if (level === 1) return 0;
  if (level === 3) return 2;
  return 1;
}

function levelKey(level?: number | null): "chung" | "l1" | "l2" | "l3" {
  if (level === 1) return "l1";
  if (level === 2) return "l2";
  if (level === 3) return "l3";
  return "chung";
}

const LEVEL_STYLE: Record<string, { border: string; bg: string; text: string; chip: string; label: string }> = {
  chung: { border: "border-slate-300", bg: "bg-slate-50", text: "text-slate-700", chip: "bg-slate-100 text-slate-600", label: "Chung" },
  l1: { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800", chip: "bg-amber-100 text-amber-700", label: "Yếu" },
  l2: { border: "border-indigo-400", bg: "bg-indigo-50", text: "text-indigo-800", chip: "bg-indigo-100 text-indigo-700", label: "TB" },
  l3: { border: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-800", chip: "bg-emerald-100 text-emerald-700", label: "Khá" },
};

interface Placed {
  node: LearningNodeResponse;
  x: number;
  y: number;
  w: number;
  h: number;
  isGate: boolean;
  dim: boolean;
}

function scoreLabel(e: NodeEdgeResponse): string | null {
  const hasMin = e.minScore !== undefined && e.minScore !== null;
  const hasMax = e.maxScore !== undefined && e.maxScore !== null;
  if (hasMin && hasMax) return `${e.minScore}–${e.maxScore}`;
  if (hasMin) return `≥ ${e.minScore}`;
  if (hasMax) return `< ${e.maxScore}`;
  return null;
}

export function LearningPathFlow({
  nodes,
  edges,
  gateNodeIds,
  highlightLevel = null,
  selectedNodeId = null,
  onNodeClick,
}: LearningPathFlowProps) {
  const { placed, height, posById } = useMemo(() => {
    const visible = nodes.filter((n) => !n.isDeleted);
    const idSet = new Set(visible.map((n) => n.nodeId));
    const usableEdges = edges.filter((e) => idSet.has(e.fromNodeId) && idSet.has(e.toNodeId));

    const adj = new Map<number, number[]>();
    const indeg = new Map<number, number>();
    visible.forEach((n) => {
      adj.set(n.nodeId, []);
      indeg.set(n.nodeId, 0);
    });
    usableEdges.forEach((e) => {
      adj.get(e.fromNodeId)!.push(e.toNodeId);
      indeg.set(e.toNodeId, (indeg.get(e.toNodeId) ?? 0) + 1);
    });

    const layer = new Map<number, number>();
    const queue: number[] = [];
    visible.forEach((n) => {
      if ((indeg.get(n.nodeId) ?? 0) === 0) {
        layer.set(n.nodeId, 0);
        queue.push(n.nodeId);
      }
    });
    const indegWork = new Map(indeg);
    while (queue.length) {
      const u = queue.shift()!;
      for (const v of adj.get(u) ?? []) {
        layer.set(v, Math.max(layer.get(v) ?? 0, (layer.get(u) ?? 0) + 1));
        indegWork.set(v, (indegWork.get(v) ?? 0) - 1);
        if ((indegWork.get(v) ?? 0) === 0) queue.push(v);
      }
    }

    const derivedGates =
      gateNodeIds ??
      new Set(visible.filter((n) => n.testKind === "GATE" || n.testKind === "PLACEMENT").map((n) => n.nodeId));

    let maxLayer = 0;
    const colCount = new Map<string, number>();
    const placedArr: Placed[] = visible.map((n) => {
      const lay = layer.get(n.nodeId) ?? 0;
      maxLayer = Math.max(maxLayer, lay);
      const col = levelToCol(n.level);
      const key = `${lay}:${col}`;
      const offset = colCount.get(key) ?? 0;
      colCount.set(key, offset + 1);
      const isGate = derivedGates.has(n.nodeId);
      const w = isGate ? SQUARE_W : CIRCLE;
      const h = isGate ? SQUARE_H : CIRCLE;
      const dim =
        highlightLevel != null && n.level != null && n.level !== highlightLevel;
      return {
        node: n,
        x: COL_X[col] + offset * (CIRCLE + 16),
        y: TOP + lay * ROW_GAP + CIRCLE / 2,
        w,
        h,
        isGate,
        dim,
      };
    });

    const pos = new Map<number, Placed>();
    placedArr.forEach((p) => pos.set(p.node.nodeId, p));
    return {
      placed: placedArr,
      height: TOP + (maxLayer + 1) * ROW_GAP,
      posById: pos,
    };
  }, [nodes, edges, gateNodeIds, highlightLevel]);

  if (placed.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
        Lộ trình chưa có bài học nào. Thêm node để bắt đầu.
      </div>
    );
  }

  const visibleEdges = edges.filter(
    (e) => posById.has(e.fromNodeId) && posById.has(e.toNodeId)
  );

  return (
    <div className="overflow-x-auto">
      <div className="relative mx-auto" style={{ width: WIDTH, height }}>
        <svg
          className="absolute inset-0"
          width={WIDTH}
          height={height}
          viewBox={`0 0 ${WIDTH} ${height}`}
        >
          <defs>
            <marker id="lpf-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0 0 L8 3 L0 6 z" fill="#94a3b8" />
            </marker>
            <marker id="lpf-arrow-route" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0 0 L8 3 L0 6 z" fill="#6366f1" />
            </marker>
          </defs>
          {visibleEdges.map((e) => {
            const s = posById.get(e.fromNodeId)!;
            const t = posById.get(e.toNodeId)!;
            const x1 = s.x;
            const y1 = s.y + s.h / 2;
            const x2 = t.x;
            const y2 = t.y - t.h / 2;
            const isRoute = e.minScore != null || e.maxScore != null;
            const faded =
              highlightLevel != null && (s.dim || t.dim);
            const label = scoreLabel(e);
            return (
              <g key={e.edgeId} opacity={faded ? 0.12 : 1}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isRoute ? "#6366f1" : "#94a3b8"}
                  strokeWidth={2}
                  strokeDasharray={isRoute ? "6 4" : undefined}
                  markerEnd={`url(#${isRoute ? "lpf-arrow-route" : "lpf-arrow"})`}
                />
                {label && (
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                    <rect x={-18} y={-9} width={36} height={18} rx={5} fill="#eef2ff" stroke="#c7d2fe" />
                    <text textAnchor="middle" dy={3.5} fontSize={10} fill="#4338ca">
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {placed.map((p) => {
          const style = LEVEL_STYLE[levelKey(p.node.level)];
          const selected = selectedNodeId === p.node.nodeId;
          return (
            <button
              key={p.node.nodeId}
              type="button"
              onClick={() => onNodeClick?.(p.node)}
              title={p.node.title}
              className={[
                "absolute flex flex-col items-center justify-center gap-0.5 border-2 px-1.5 text-center transition",
                p.isGate ? "rounded-lg" : "rounded-full",
                style.border,
                style.bg,
                style.text,
                selected ? "ring-2 ring-indigo-500 ring-offset-2" : "",
                p.dim ? "opacity-20" : "opacity-100",
                onNodeClick ? "cursor-pointer hover:shadow-md" : "cursor-default",
              ].join(" ")}
              style={{ left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: p.h }}
            >
              {p.isGate && (
                <span className="text-[9px] font-semibold uppercase tracking-wide">
                  {p.node.testKind === "PLACEMENT" ? "Test NL" : "Test"}
                </span>
              )}
              <span className="line-clamp-2 text-[11px] leading-tight font-medium">{p.node.title}</span>
              <span className={`rounded px-1 text-[9px] font-semibold ${style.chip}`}>{style.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LearningPathFlow;
