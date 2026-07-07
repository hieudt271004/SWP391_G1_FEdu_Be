import { useMemo, useState } from "react";
import type { LearningNodeResponse, NodeEdgeResponse } from "../../services/learningPath.service";
import { motion } from "motion/react";
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  Zap, 
  HelpCircle, 
  ArrowUpRight 
} from "lucide-react";

interface LearningPathFlowProps {
  nodes: LearningNodeResponse[];
  edges: NodeEdgeResponse[];
  gateNodeIds?: Set<number>;
  highlightLevel?: number | null;
  selectedNodeId?: number | null;
  onNodeClick?: (node: LearningNodeResponse) => void;
}

const COL_X: Record<number, number> = { 0: 80, 1: 260, 2: 440 };
const WIDTH = 520;
const TOP = 28;
const ROW_GAP = 104;
const CIRCLE = 72; // Circular node size
const SQUARE_W = 104; // Rectangular node width
const SQUARE_H = 58; // Rectangular node height

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

const LEVEL_STYLE: Record<
  "chung" | "l1" | "l2" | "l3", 
  { 
    border: string; 
    bg: string; 
    text: string; 
    chip: string; 
    label: string; 
    glow: string;
    stroke: string;
    strokeActive: string;
  }
> = {
  chung: { 
    border: "border-slate-300 bg-white", 
    bg: "bg-white", 
    text: "text-slate-700", 
    chip: "bg-slate-100 text-slate-600 border border-slate-200/50", 
    label: "Chung", 
    glow: "0 0 16px rgba(148, 163, 184, 0.4)",
    stroke: "#cbd5e1", // slate-300
    strokeActive: "#64748b", // slate-500
  },
  l1: { 
    border: "border-amber-400 bg-amber-50/50", 
    bg: "bg-amber-50/50", 
    text: "text-amber-900", 
    chip: "bg-amber-100/80 text-amber-700 border border-amber-200/50", 
    label: "Yếu", 
    glow: "0 0 16px rgba(245, 158, 11, 0.4)",
    stroke: "#fcd34d", // amber-300
    strokeActive: "#d97706", // amber-600
  },
  l2: { 
    border: "border-indigo-400 bg-indigo-50/50", 
    bg: "bg-indigo-50/50", 
    text: "text-indigo-900", 
    chip: "bg-indigo-100/80 text-indigo-700 border border-indigo-200/50", 
    label: "TB", 
    glow: "0 0 16px rgba(99, 102, 241, 0.4)",
    stroke: "#c7d2fe", // indigo-300
    strokeActive: "#4f46e5", // indigo-600
  },
  l3: { 
    border: "border-emerald-400 bg-emerald-50/50", 
    bg: "bg-emerald-50/50", 
    text: "text-emerald-900", 
    chip: "bg-emerald-100/80 text-emerald-700 border border-emerald-200/50", 
    label: "Khá", 
    glow: "0 0 16px rgba(16, 185, 129, 0.4)",
    stroke: "#a7f3d0", // emerald-300
    strokeActive: "#059669", // emerald-600
  },
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

export function LearningPathFlow({
  nodes,
  edges,
  gateNodeIds,
  highlightLevel = null,
  selectedNodeId = null,
  onNodeClick,
}: LearningPathFlowProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  const { placed, height, posById } = useMemo(() => {
    const visible = nodes.filter((n) => !n.isDeleted);

    const derivedGates =
      gateNodeIds ??
      new Set(
        visible
          .filter(
            (n) =>
              n.testKind === "GATE" || n.testKind === "PLACEMENT" || n.testKind === "FREE_CHOICE"
          )
          .map((n) => n.nodeId)
      );

    // Row layout determined by stageOrder
    const stageHasLearn = new Set<number>();
    visible.forEach((n) => {
      if (!derivedGates.has(n.nodeId)) stageHasLearn.add(n.stageOrder ?? 0);
    });
    const rowOf = (n: LearningNodeResponse) => {
      const base = n.stageOrder ?? 0;
      return derivedGates.has(n.nodeId) && stageHasLearn.has(base) ? base + 0.5 : base;
    };

    const rowVals = [...new Set(visible.map(rowOf))].sort((a, b) => a - b);
    const rowIndex = new Map<number, number>();
    rowVals.forEach((v, i) => rowIndex.set(v, i));

    const colCount = new Map<string, number>();
    const placedArr: Placed[] = visible.map((n) => {
      const r = rowIndex.get(rowOf(n)) ?? 0;
      const col = levelToCol(n.level);
      const key = `${r}:${col}`;
      const offset = colCount.get(key) ?? 0;
      colCount.set(key, offset + 1);
      const isGate = derivedGates.has(n.nodeId);
      const w = isGate ? SQUARE_W : CIRCLE;
      const h = isGate ? SQUARE_H : CIRCLE;
      const dim = highlightLevel != null && n.level != null && n.level !== highlightLevel;
      return {
        node: n,
        x: COL_X[col] + offset * (CIRCLE + 16),
        y: TOP + r * ROW_GAP + CIRCLE / 2,
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
      height: TOP + rowVals.length * ROW_GAP,
      posById: pos,
    };
  }, [nodes, gateNodeIds, highlightLevel]);

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
    <div className="w-full flex justify-center bg-[#f1f5f9] animate-fade-in">
      <div className="relative mx-auto bg-[#f1f5f9] overflow-hidden" style={{ width: WIDTH, height }}>
        <svg
          className="absolute inset-0 select-none pointer-events-none"
          width={WIDTH}
          height={height}
          viewBox={`0 0 ${WIDTH} ${height}`}
        >
          <defs>
            <pattern
              id="roadmap-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="1.2" fill="#ececf0" />
            </pattern>
            
            {/* Dynamic arrow markers for each level path and state */}
            {Object.entries(LEVEL_STYLE).map(([key, style]) => (
              <g key={key}>
                {/* Default path marker */}
                <marker
                  id={`lpf-arrow-${key}-default`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0 L6 3 L0 6 z" fill={style.stroke} />
                </marker>
                {/* Hovered/Selected path marker */}
                <marker
                  id={`lpf-arrow-${key}-active`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0 L6 3 L0 6 z" fill={style.strokeActive} />
                </marker>
              </g>
            ))}
          </defs>
          {/* Flat background (no grid dots pattern) */}
          {visibleEdges.map((e) => {
            const s = posById.get(e.fromNodeId)!;
            const t = posById.get(e.toNodeId)!;
            const x1 = s.x;
            const y1 = s.y + s.h / 2;
            const x2 = t.x;
            const y2 = t.y - t.h / 2;
            const faded = highlightLevel != null && (s.dim || t.dim);
            
            const isEdgeHighlighted = hoveredNodeId !== null && (e.fromNodeId === hoveredNodeId || e.toNodeId === hoveredNodeId);
            const isEdgeSelected = selectedNodeId !== null && (e.fromNodeId === selectedNodeId || e.toNodeId === selectedNodeId);
            
            const sKey = levelKey(s.node.level);
            const sStyle = LEVEL_STYLE[sKey];
            const activeColor = sStyle.strokeActive;
            const trackColor = sStyle.stroke;
            
            const dy = Math.max(32, (y2 - y1) / 2);
            // End slightly short of the node to avoid overlapping the borders with arrow heads
            const pathD = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy - 6}, ${x2} ${y2 - 6}`;
            
            return (
              <g key={e.edgeId} opacity={faded ? 0.15 : (hoveredNodeId !== null && !isEdgeHighlighted ? 0.35 : 1)} className="transition-opacity duration-300">
                {/* Thick glow underlay */}
                <path
                  d={pathD}
                  stroke={isEdgeSelected || isEdgeHighlighted ? `${activeColor}20` : `${trackColor}40`}
                  strokeWidth={4}
                  fill="none"
                  className="transition-colors duration-300"
                />
                
                {/* Streaming dash flow line */}
                <motion.path
                  d={pathD}
                  stroke={isEdgeSelected || isEdgeHighlighted ? activeColor : trackColor}
                  strokeWidth={2}
                  fill="none"
                  className="transition-colors duration-300"
                  strokeDasharray={isEdgeSelected || isEdgeHighlighted ? "6, 4" : undefined}
                  animate={
                    isEdgeSelected || isEdgeHighlighted
                      ? { strokeDashoffset: [-20, 0] }
                      : undefined
                  }
                  transition={{
                    ease: "linear",
                    duration: 1.2,
                    repeat: Infinity,
                  }}
                  markerEnd={`url(#lpf-arrow-${sKey}-${isEdgeSelected || isEdgeHighlighted ? 'active' : 'default'})`}
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {placed.map((p) => {
          const style = LEVEL_STYLE[levelKey(p.node.level)];
          const selected = selectedNodeId === p.node.nodeId;
          
          // Determine the node icon
          const IconComponent = () => {
            const iconSize = p.isGate ? 13 : 15;
            if (p.node.testKind === "PLACEMENT") {
              return <GraduationCap size={iconSize} className="opacity-80" />;
            }
            if (p.node.testKind === "GATE") {
              return <Zap size={iconSize} className="opacity-80 text-amber-500 animate-pulse" />;
            }
            if (p.node.testKind === "FREE_CHOICE") {
              return <ArrowUpRight size={iconSize} className="opacity-80" />;
            }
            if (p.node.testKind && p.node.testKind !== "NONE") {
              return <Award size={iconSize} className="opacity-80" />;
            }
            return <BookOpen size={iconSize} className="opacity-80" />;
          };

          return (
            <motion.button
              key={p.node.nodeId}
              type="button"
              onClick={() => onNodeClick?.(p.node)}
              onMouseEnter={() => setHoveredNodeId(p.node.nodeId)}
              onMouseLeave={() => setHoveredNodeId(null)}
              title={p.node.title}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ 
                opacity: p.dim ? 0.3 : 1, 
                scale: p.dim ? 0.95 : (selected ? 1.04 : 1),
                filter: p.dim ? "grayscale(40%)" : "grayscale(0%)"
              }}
              whileHover={{ 
                scale: p.dim ? 0.95 : 1.08,
                boxShadow: p.dim ? "none" : style.glow,
                zIndex: 10
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 24
              }}
              className={[
                "absolute flex flex-col items-center justify-center text-center transition-colors duration-200 border-2 select-none",
                p.isGate ? "rounded-xl" : "rounded-full",
                style.border,
                style.bg,
                style.text,
                selected ? "ring-2 ring-indigo-600 ring-offset-2 border-indigo-500 shadow-md z-1" : "shadow-sm",
                onNodeClick ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              style={{ left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: p.h }}
            >
              {p.isGate ? (
                // Test node layout
                <div className="flex flex-col items-center justify-center h-full w-full p-2 gap-0.5">
                  <span className="text-[8px] font-bold uppercase tracking-wider opacity-60 leading-none">
                    {p.node.testKind === "PLACEMENT"
                      ? "Test NL"
                      : p.node.testKind === "FREE_CHOICE"
                      ? "Tự chọn"
                      : "Test định kỳ"}
                  </span>
                  <div className="flex items-center gap-1 justify-center max-w-full">
                    <IconComponent />
                    <span className="truncate text-[11px] font-extrabold leading-none">
                      {p.node.title}
                    </span>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${style.chip}`}>
                    {style.label}
                  </span>
                </div>
              ) : (
                // Lesson node layout
                <div className="flex flex-col items-center justify-center h-full w-full p-1.5 gap-0.5">
                  <IconComponent />
                  <span className="line-clamp-2 text-[10px] font-bold leading-tight max-w-[62px]">
                    {p.node.title}
                  </span>
                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${style.chip}`}>
                    {style.label}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default LearningPathFlow;
