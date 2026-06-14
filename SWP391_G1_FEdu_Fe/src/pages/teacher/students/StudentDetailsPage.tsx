import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  User,
  BookOpen,
  TrendingUp,
  Award,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface RoadmapNode {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'custom';
  isCustom?: boolean;
  branchFromId?: number;
}

const studentData: Record<string, { fullName: string; grade: string; gpa: number; attendance: number; submittedMilestones: number; totalMilestones: number }> = {
  HE190001: {
    fullName: 'Nguyen Van An',
    grade: 'C+',
    gpa: 2.4,
    attendance: 72,
    submittedMilestones: 3,
    totalMilestones: 6,
  },
};

const defaultStudent = {
  fullName: 'Student',
  grade: 'B',
  gpa: 3.0,
  attendance: 85,
  submittedMilestones: 4,
  totalMilestones: 6,
};

export function StudentDetailsPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const student = studentData[studentId || ''] ?? { ...defaultStudent, fullName: studentId || 'Student' };

  const [nodes, setNodes] = useState<RoadmapNode[]>([
    { id: 1, title: 'Module 1: Introduction', description: 'Project overview and team formation', status: 'completed' },
    { id: 2, title: 'Module 2: Requirements', description: 'Requirements gathering and user stories', status: 'completed' },
    { id: 3, title: 'Module 3: Design', description: 'System architecture and database design', status: 'completed' },
    {
      id: 101,
      title: 'Remedial: System Design Review',
      description: 'Extra session: ER diagrams, normalization, and architecture patterns',
      status: 'custom',
      isCustom: true,
      branchFromId: 3,
    },
    { id: 4, title: 'Module 4: Implementation', description: 'Core feature development', status: 'current' },
    { id: 5, title: 'Module 5: Testing', description: 'Unit and integration testing', status: 'upcoming' },
    { id: 6, title: 'Module 6: Deployment', description: 'CI/CD pipeline and final presentation', status: 'upcoming' },
  ]);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    4: true, // Keep 'current' module expanded by default
  });

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddNode = () => {
    const newId = Date.now();
    const newNode: RoadmapNode = {
      id: newId,
      title: 'Custom Branching Module',
      description: 'Teacher-created remedial or enrichment task',
      status: 'custom',
      isCustom: true,
      branchFromId: 3,
    };
    setNodes((prev) => [...prev, newNode]);
    setExpandedNodes((prev) => ({
      ...prev,
      3: true, // automatically expand parent node 3 to show the new custom node
    }));
  };

  const getNodeStyle = (status: RoadmapNode['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 text-green-600';
      case 'current':
        return 'border-blue-500 bg-blue-50 text-blue-600';
      case 'custom':
        return 'border-amber-500 bg-amber-50 text-amber-600';
      default:
        return 'border-muted-foreground/30 bg-muted text-muted-foreground';
    }
  };

  const getNodeIcon = (status: RoadmapNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="size-5 text-green-500" />;
      case 'current':
        return <Circle className="size-5 fill-current text-blue-500" />;
      case 'custom':
        return <Plus className="size-5 text-amber-500" />;
      default:
        return <Circle className="size-5 text-muted-foreground" />;
    }
  };

  const gradeColor =
    student.gpa >= 3.5
      ? 'text-green-600'
      : student.gpa >= 2.5
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold">
          Student Profile – {studentId} ({student.fullName})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Academic Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary shrink-0">
                  <User className="size-8" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{student.fullName}</p>
                  <p className="text-sm text-muted-foreground">{studentId}</p>
                  <Badge variant="outline" className="mt-1">SE1801 – SWP391</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <Award className="size-3" /> Current Grade
                  </p>
                  <p className={`text-4xl font-bold ${gradeColor}`}>{student.grade}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <TrendingUp className="size-3" /> GPA
                  </p>
                  <p className={`text-4xl font-bold ${gradeColor}`}>{student.gpa.toFixed(1)}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className={`font-medium ${student.attendance >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                    {student.attendance}%
                  </span>
                </div>
                <Progress value={student.attendance} />
                {student.attendance < 80 && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="size-3" /> Below minimum 80% attendance requirement
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BookOpen className="size-3" /> Milestones Submitted
                  </span>
                  <span className="font-medium">
                    {student.submittedMilestones}/{student.totalMilestones}
                  </span>
                </div>
                <Progress
                  value={(student.submittedMilestones / student.totalMilestones) * 100}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Custom Student Roadmap</CardTitle>
              <Button
                onClick={handleAddNode}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all duration-300"
              >
                + Add Node
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Personalized learning path for {student.fullName}. Click on a module card to expand/collapse.
            </p>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
              {nodes
                .filter((n) => !n.branchFromId)
                .map((node) => {
                  const branches = nodes.filter((n) => n.branchFromId === node.id);
                  const isExpanded = !!expandedNodes[node.id];

                  const getStatusClasses = (status: RoadmapNode['status']) => {
                    switch (status) {
                      case 'completed':
                        return 'border-l-4 border-l-green-500 hover:bg-green-50/5';
                      case 'current':
                        return 'border-l-4 border-l-blue-500 bg-blue-50/5 hover:bg-blue-50/10';
                      case 'custom':
                        return 'border-l-4 border-l-amber-500 bg-amber-50/5 hover:bg-amber-50/10';
                      default:
                        return 'border-l-4 border-l-gray-300 hover:bg-muted/5';
                    }
                  };

                  return (
                    <div
                      key={node.id}
                      className={`transition-all duration-200 ${getStatusClasses(node.status)}`}
                    >
                      {/* Card Header (Clickable toggle) */}
                      <div
                        onClick={() => toggleNode(node.id)}
                        className="flex items-center justify-between p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-1 rounded transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </div>
                          <div className="shrink-0">
                            {getNodeIcon(node.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${
                                node.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                              }`}>
                                {node.title}
                              </span>
                              {node.isCustom && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1 border-amber-400 text-amber-600 bg-amber-50">
                                  Custom
                                </Badge>
                              )}
                              {node.status === 'current' && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                                  In Progress
                                </Badge>
                              )}
                              {node.status === 'completed' && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1 border-green-400 text-green-600 bg-green-50">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-4 shrink-0">
                          {node.status === 'current' ? 'In Progress' : node.status}
                        </div>
                      </div>

                      {/* Card Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-muted/5 border-t border-muted/20 space-y-4">
                          <p className="text-sm text-muted-foreground">{node.description}</p>
                          
                          {branches.length > 0 && (
                            <div className="mt-3 space-y-3 pl-4 border-l-2 border-amber-300">
                              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                Custom Branches
                              </p>
                              <div className="grid gap-2">
                                {branches.map((branch) => (
                                  <div
                                    key={branch.id}
                                    className="p-3 bg-amber-50/40 border border-amber-100/60 rounded-lg shadow-sm flex items-start gap-3 transition-colors hover:bg-amber-50/60"
                                  >
                                    <div className="pt-0.5 shrink-0">
                                      {getNodeIcon(branch.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm font-semibold text-amber-950">{branch.title}</h4>
                                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-400 text-amber-600 bg-amber-50">
                                          Custom
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-amber-800/80 mt-1">{branch.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
