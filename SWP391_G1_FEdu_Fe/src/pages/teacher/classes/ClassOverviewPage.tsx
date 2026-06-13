import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, CheckCircle2, Circle, Settings, Loader, ChevronRight, HelpCircle } from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { learningPathService, LearningNodeResponse } from '../../../services/learningPath.service';

interface Student {
  id: string;
  fullName: string;
  progress: number;
}

export function ClassOverviewPage() {
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState({ classCode: '', courseCode: '' });
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!classroomId) return;

      try {
        setLoading(true);
        const [classData, studentsData] = await Promise.all([
          teacherService.getClassroomById(Number(classroomId)),
          teacherService.getStudentsInClassroom(Number(classroomId)),
        ]);
        setClassInfo({
          classCode: classData.className,        
          courseCode: classData.subjectCode,    
        });
        const formatted = (studentsData ?? []).map((item) => ({
          id: item.email?.split('@')[0].toUpperCase() || `ST${item.userId}`,
          fullName: (item.lastName || item.firstName)
            ? `${item.lastName || ''} ${item.firstName || ''}`.trim()
            : `Student ${item.userId}`,
          progress: Math.floor(Math.random() * 30) + 70,
        }));
        setStudents(formatted);

        // Fetch learning path graph by classroomId
        try {
          const graph = await learningPathService.getClassroomLearningPathGraph(Number(classroomId));
          setNodes(graph.nodes || []);

          // Expand the first node by default if available
          if (graph.nodes && graph.nodes.length > 0) {
            setExpandedNodes({ [graph.nodes[0].nodeId]: true });
          }
        } catch (graphErr) {
          console.error('Error fetching classroom learning path graph:', graphErr);
        }
      } catch (err: any) {
        console.error('Error loading classroom overview:', err);
        setError(err.response?.data?.message || 'Failed to load classroom data');
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomId]);

  const getNodeColorClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'border-l-4 border-l-green-500 hover:bg-green-50/5';
      case 'LOCKED':
        return 'border-l-4 border-l-gray-300 hover:bg-muted/5 opacity-80';
      case 'HIDDEN':
        return 'border-l-4 border-l-yellow-500 hover:bg-yellow-50/5 opacity-60';
      default:
        return 'border-l-4 border-l-gray-300 hover:bg-muted/5';
    }
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'LOCKED':
        return <Circle className="size-5 text-gray-400" />;
      case 'HIDDEN':
        return <HelpCircle className="size-5 text-yellow-500" />;
      default:
        return <Circle className="size-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate('/teacher/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Class {classInfo.classCode} - {classInfo.courseCode}
          </h1>
        </div>
        <Button onClick={() => navigate(`/teacher/classrooms/${classroomId}/manage`)}>
          <Settings className="size-4" />
          Manage Class
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Class Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No roadmap nodes created yet. Go to Manage Class to customize.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
                {nodes.map((node) => {
                  const isExpanded = !!expandedNodes[node.nodeId];

                  return (
                    <div
                      key={node.nodeId}
                      className={`transition-all duration-200 ${getNodeColorClass(node.status)}`}
                    >
                      {/* Header */}
                      <div
                        onClick={() => toggleNode(node.nodeId)}
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
                              <span className={`font-semibold text-sm ${node.status === 'LOCKED' ? 'text-muted-foreground' : 'text-foreground'
                                }`}>
                                {node.title}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                                {node.nodeType === 'ON_CLASS' ? 'On Class' : 'At Home'}
                              </Badge>
                              {node.isRequired && (
                                <Badge className="text-[10px] py-0 px-1 font-normal bg-red-50 text-red-700 hover:bg-red-50 border-red-200" variant="outline">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-4 shrink-0">
                          {node.status}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-muted/5 border-t border-muted/20">
                          <p className="text-sm text-muted-foreground mb-2">
                            {node.description || 'No description provided.'}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Display Order: <span className="font-semibold">{node.displayOrder}</span></div>
                            {node.branchName && <div>Branch: <span className="font-semibold">{node.branchName}</span></div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>{student.fullName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
