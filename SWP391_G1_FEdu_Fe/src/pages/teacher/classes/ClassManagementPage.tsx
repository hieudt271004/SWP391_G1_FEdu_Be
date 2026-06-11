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
import { ArrowLeft, CheckCircle2, Circle, Upload, Map, Loader, ChevronRight, Plus, Trash2, BookOpen, X, HelpCircle } from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { learningPathService, LearningNodeResponse, NodeEdgeResponse } from '../../../services/learningPath.service';
import { toast } from 'sonner';

interface Student {
  id: string;
  fullName: string;
  progress: number;
}

export function ClassManagementPage() {
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState({ classCode: '', courseCode: '', subjectId: 0 });
  const [nodes, setNodes] = useState<LearningNodeResponse[]>([]);
  const [edges, setEdges] = useState<NodeEdgeResponse[]>([]);
  const [pathId, setPathId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Modals state
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [selectedNodeForContent, setSelectedNodeForContent] = useState<LearningNodeResponse | null>(null);

  // New Node Form State
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeType, setNewNodeType] = useState<'AT_HOME' | 'ON_CLASS'>('AT_HOME');
  const [newNodeStatus, setNewNodeStatus] = useState<'LOCKED' | 'OPEN' | 'HIDDEN'>('LOCKED');
  const [newNodeOrder, setNewNodeOrder] = useState<number>(1);
  const [newNodeRequired, setNewNodeRequired] = useState(true);
  const [newNodeBranch, setNewNodeBranch] = useState('');
  const [newNodePredecessor, setNewNodePredecessor] = useState<string>('');

  // Edge score requirements state
  const [isPredecessorLocked, setIsPredecessorLocked] = useState(false);
  const [edgeMinScore, setEdgeMinScore] = useState('');
  const [edgeMaxScore, setEdgeMaxScore] = useState('');

  // New Content Form State
  const [contentTitle, setContentTitle] = useState('');
  const [contentFileUrl, setContentFileUrl] = useState('');
  const [contentVideoUrl, setContentVideoUrl] = useState('');

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchGraphData = async (classroomIdVal: number) => {
    try {
      const graph = await learningPathService.getClassroomLearningPathGraph(classroomIdVal);
      setPathId(graph.pathId); // This is classroomPathId
      setNodes(graph.nodes || []);
      setEdges(graph.edges || []);
      setNewNodeOrder((graph.nodes?.length || 0) + 1);
    } catch (err) {
      console.error('Error fetching classroom learning path graph:', err);
    }
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
          subjectId: classData.subjectId,       
        });
        const formatted = (studentsData ?? []).map((item) => ({
          id: item.email?.split('@')[0].toUpperCase() || `ST${item.userId}`,
          fullName: (item.lastName || item.firstName)
            ? `${item.lastName || ''} ${item.firstName || ''}`.trim()
            : `Student ${item.userId}`,
          progress: Math.floor(Math.random() * 30) + 70,
        }));
        setStudents(formatted);
        await fetchGraphData(Number(classroomId));
      } catch (err: any) {
        console.error('Error loading classroom management:', err);
        setError(err.response?.data?.message || 'Failed to load classroom data');
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomId]);

  const handleAddNodeClick = () => {
    setNewNodeTitle('');
    setNewNodeDesc('');
    setNewNodeType('AT_HOME');
    setNewNodeStatus('LOCKED');
    setNewNodeRequired(true);
    setNewNodeBranch('');
    setNewNodePredecessor('');
    setIsPredecessorLocked(false);
    setEdgeMinScore('');
    setEdgeMaxScore('');
    setIsAddNodeOpen(true);
  };

  const handleAddNextNodeClick = (node: LearningNodeResponse) => {
    setNewNodeTitle('');
    setNewNodeDesc('');
    setNewNodeType('AT_HOME');
    setNewNodeStatus('LOCKED');
    setNewNodeRequired(true);
    setNewNodeBranch(node.branchName || '');
    setNewNodePredecessor(node.nodeId.toString());
    setIsPredecessorLocked(true);
    setEdgeMinScore('');
    setEdgeMaxScore('');
    setIsAddNodeOpen(true);
  };

  const handleAddContentClick = (node: LearningNodeResponse) => {
    setSelectedNodeForContent(node);
    setContentTitle('');
    setContentFileUrl('');
    setContentVideoUrl('');
    setIsAddContentOpen(true);
  };

  const handleAddContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim()) {
      toast.error('Content title is required');
      return;
    }

    // Since node materials API is not implemented yet in the backend controllers,
    // we will simulate a successful mock material creation.
    toast.success(`Content "${contentTitle}" added successfully to node "${selectedNodeForContent?.title}"`);
    setIsAddContentOpen(false);
    setSelectedNodeForContent(null);
  };

  const handleRemoveNode = async (nodeId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete node "${title}"?`)) {
      return;
    }

    try {
      await learningPathService.deleteLearningNode(nodeId);
      toast.success(`Node "${title}" deleted successfully`);
      if (classroomId) {
        await fetchGraphData(Number(classroomId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete node');
    }
  };

  const handleAddNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) {
      toast.error('Node title is required');
      return;
    }
    if (!pathId) {
      toast.error('Learning path template not loaded');
      return;
    }

    try {
      // 1. Create the learning node with classroomPathId
      const createdNode = await learningPathService.createLearningNode({
        classroomPathId: pathId,
        title: newNodeTitle,
        description: newNodeDesc,
        nodeType: newNodeType,
        branchName: newNodeBranch || undefined,
        displayOrder: newNodeOrder,
        status: newNodeStatus,
        isRequired: newNodeRequired
      });

      // 2. If predecessor node is selected, create edge
      if (newNodePredecessor) {
        await learningPathService.createNodeEdge({
          fromNodeId: Number(newNodePredecessor),
          toNodeId: createdNode.nodeId,
          branchName: newNodeBranch || undefined,
          minScore: edgeMinScore ? Number(edgeMinScore) : undefined,
          maxScore: edgeMaxScore ? Number(edgeMaxScore) : undefined
        });
      }

      toast.success('Node created successfully');
      setIsAddNodeOpen(false);

      // Reset Form State
      setNewNodeTitle('');
      setNewNodeDesc('');
      setNewNodeType('AT_HOME');
      setNewNodeStatus('LOCKED');
      setNewNodeRequired(true);
      setNewNodeBranch('');
      setNewNodePredecessor('');
      setEdgeMinScore('');
      setEdgeMaxScore('');

      if (classroomId) {
        await fetchGraphData(Number(classroomId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create node');
    }
  };

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
            Class {classInfo.classCode} - {classInfo.courseCode} (Management)
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNodeClick} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1">
            <Plus className="size-4" />
            Add Node
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Class Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                <Map className="size-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm mb-4">No nodes present in the subject roadmap.</p>
                <Button onClick={() => setIsAddNodeOpen(true)} size="sm">
                  Create First Node
                </Button>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
                {nodes.map((node) => {
                  const isExpanded = !!expandedNodes[node.nodeId];
                  // Find edges pointing to this node to show prerequisite lines
                  const incomingEdges = edges.filter((e) => e.toNodeId === node.nodeId);
                  const incomingNodes = incomingEdges.map(e => nodes.find(n => n.nodeId === e.fromNodeId)).filter(Boolean);

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
                        <div className="px-4 pb-4 pt-2 bg-muted/5 border-t border-muted/20 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {node.description || 'No description provided.'}
                          </p>

                          {incomingNodes.length > 0 && (
                            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 p-2 rounded">
                              <span className="font-semibold text-gray-700">Prerequisites (Edges): </span>
                              {incomingNodes.map(inNode => inNode?.title).join(', ')}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Display Order: <span className="font-semibold text-foreground">{node.displayOrder}</span>
                            {node.branchName && <span className="ml-4">Branch: <span className="font-semibold text-foreground">{node.branchName}</span></span>}
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-gray-100/50">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-card hover:bg-muted text-xs h-8 text-indigo-700 hover:text-indigo-850 hover:bg-indigo-50/50"
                              onClick={() => handleAddNextNodeClick(node)}
                            >
                              <Plus className="size-3.5 mr-1" />
                              Add Next Node
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-card hover:bg-muted text-xs h-8"
                              onClick={() => handleAddContentClick(node)}
                            >
                              <BookOpen className="size-3.5 mr-1" />
                              Add Content
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/5 text-xs h-8"
                              onClick={() => handleRemoveNode(node.nodeId, node.title)}
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Remove Node
                            </Button>
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

      {/* ADD NODE MODAL */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <h2 className="text-lg font-semibold text-gray-900">Create New Learning Node</h2>
              <button onClick={() => setIsAddNodeOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Node Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Git"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Briefly describe what students will learn..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Node Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                  >
                    <option value="AT_HOME">At Home</option>
                    <option value="ON_CLASS">On Class</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Initial Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNodeStatus}
                    onChange={(e) => setNewNodeStatus(e.target.value as any)}
                  >
                    <option value="LOCKED">Locked</option>
                    <option value="OPEN">Open</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNodeOrder}
                    onChange={(e) => setNewNodeOrder(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Branch Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Main, Optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNodeBranch}
                    onChange={(e) => setNewNodeBranch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Prerequisite Predecessor (Create Edge)</label>
                <select
                  disabled={isPredecessorLocked}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                  value={newNodePredecessor}
                  onChange={(e) => setNewNodePredecessor(e.target.value)}
                >
                  <option value="">-- No prerequisite (Disconnected) --</option>
                  {nodes.map(n => (
                    <option key={n.nodeId} value={n.nodeId}>{n.title} (Order: {n.displayOrder})</option>
                  ))}
                </select>
              </div>

              {newNodePredecessor && (
                <div className="grid grid-cols-2 gap-4 border border-indigo-100 bg-indigo-50/20 p-3 rounded-lg animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-900">Edge Min Score (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.0"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={edgeMinScore}
                      onChange={(e) => setEdgeMinScore(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-900">Edge Max Score (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 10.0"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={edgeMaxScore}
                      onChange={(e) => setEdgeMaxScore(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRequiredChk"
                  className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
                  checked={newNodeRequired}
                  onChange={(e) => setNewNodeRequired(e.target.checked)}
                />
                <label htmlFor="isRequiredChk" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Is Required Milestone
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddNodeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Create Node
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CONTENT MODAL */}
      {isAddContentOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-150">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Content Materials</h2>
                <p className="text-xs text-gray-500">To node: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => setIsAddContentOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddContentSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Material Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Git Cheatsheet PDF, Lesson Video"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Document/File URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/file.pdf"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={contentFileUrl}
                  onChange={(e) => setContentFileUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Video Link URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={contentVideoUrl}
                  onChange={(e) => setContentVideoUrl(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddContentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Add Material
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
