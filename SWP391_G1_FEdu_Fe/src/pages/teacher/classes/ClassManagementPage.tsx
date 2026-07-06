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
import { Badge } from '../../../components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Map,
  Loader,
  ChevronRight,
  Plus,
  Trash2,
  BookOpen,
  X,
  HelpCircle,
  AlertTriangle,
  Edit2,
  FileText,
  Film,
  Award,
  Download,
  ExternalLink,
  Users,
  Undo2,
  Play,
  Settings
} from 'lucide-react';
import { teacherService } from '../../../services/teacher.service';
import { classroomService } from '../../../services/classroom.service';
import {
  learningPathService,
  LearningNodeResponse,
  ClassroomGraphResponse,
  NodeContentResponse,
  StudentInClassResponse
} from '../../../services/learningPath.service';
import { toast } from 'sonner';
import { LearningPathFlow } from '../../../components/learningPath/LearningPathFlow';
import { MaterialPreview, resolveAssetUrl } from '../../../components/learningPath/MaterialPreview';
import {
  computeDesiredEdges,
  syncEdges,
  resolveNodePlacement,
  LEVEL_OPTIONS,
  type AddNodeKind,
} from '../../../components/learningPath/learningPathWiring';
import { uploadService } from '../../../services/upload.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Checkbox } from '../../../components/ui/checkbox';

interface Student {
  id: string;
  fullName: string;
  progress: number;
  userId: number;
}

export function ClassManagementPage() {
  const navigate = useNavigate();
  const { classroomSubjectId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState({ classCode: '', courseCode: '', subjectId: 0 });
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Classroom Publish Flow State
  const [graphData, setGraphData] = useState<ClassroomGraphResponse | null>(null);

  // Derive active path details for the selected level
  const activePath = graphData?.paths?.find((p) => p.level === selectedLevel);
  const activePathId = activePath?.pathId || graphData?.pathId || null;
  const nodes = activePath ? activePath.nodes || [] : graphData?.nodes || [];
  const edges = activePath ? activePath.edges || [] : graphData?.edges || [];

  const [selectedNode, setSelectedNode] = useState<LearningNodeResponse | null>(null);

  // Student Assignment States
  const [assignedStudentIds, setAssignedStudentIds] = useState<number[]>([]);
  const [siblingAssignments, setSiblingAssignments] = useState<Record<number, { nodeId: number; nodeTitle: string }>>({});
  const [loadingNodeStudents, setLoadingNodeStudents] = useState(false);
  const [savingNodeStudents, setSavingNodeStudents] = useState(false);

  // Modals state
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [selectedNodeForContent, setSelectedNodeForContent] = useState<LearningNodeResponse | null>(null);

  // Custom delete confirm dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<{ nodeId: number, title: string } | null>(null);
  const [understandDelete, setUnderstandDelete] = useState(false);

  // Publish / Unpublish states
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [understandPublish, setUnderstandPublish] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [understandUnpublish, setUnderstandUnpublish] = useState(false);
  const [showUnpublishError, setShowUnpublishError] = useState(false);
  const [unpublishErrorMsg, setUnpublishErrorMsg] = useState('');
  const [actionState, setActionState] = useState<'idle' | 'publishing' | 'unpublishing' | 'deleting'>('idle');

  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [nKind, setNKind] = useState<AddNodeKind>('AT_HOME');
  const [nLevel, setNLevel] = useState<'' | 1 | 2 | 3>('');
  const [nStage, setNStage] = useState(1);
  const [nApplies, setNApplies] = useState<number[]>([]);
  const [nUpMin, setNUpMin] = useState('');
  const [nDownMax, setNDownMax] = useState('');
  const [nYeuMax, setNYeuMax] = useState('');
  const [nTbMax, setNTbMax] = useState('');
  const [tDuration, setTDuration] = useState('15');
  const [numQuestions, setNumQuestions] = useState('0');
  const [addingNode, setAddingNode] = useState(false);

  // Edit Node Modal & Form State
  const [isEditNodeOpen, setIsEditNodeOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<LearningNodeResponse | null>(null);
  const [editNodeTitle, setEditNodeTitle] = useState('');
  const [editNodeDesc, setEditNodeDesc] = useState('');
  const [editNodeType, setEditNodeType] = useState<'AT_HOME' | 'ON_CLASS'>('AT_HOME');
  const [editNodeStatus, setEditNodeStatus] = useState<'LOCKED' | 'OPEN' | 'HIDDEN'>('LOCKED');
  const [editNodeOrder, setEditNodeOrder] = useState<number>(1);
  const [editNodeRequired, setEditNodeRequired] = useState(true);
  const [editingNode, setEditingNode] = useState(false);

  // Edit Node Thresholds
  const [editPlacementYeuMax, setEditPlacementYeuMax] = useState<string>('');
  const [editPlacementTbMax, setEditPlacementTbMax] = useState<string>('');
  const [editGateUpMin, setEditGateUpMin] = useState<string>('');
  const [editGateDownMax, setEditGateDownMax] = useState<string>('');

  // Sidebar Question Builder States
  const [editingTTitle, setEditingTTitle] = useState("");
  const [editingTDuration, setEditingTDuration] = useState("15");
  const [editingTPass, setEditingTPass] = useState("0");
  const [editingNumQuestions, setEditingNumQuestions] = useState("0");
  const [builderQuestions, setBuilderQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [editingNodeTest, setEditingNodeTest] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Node content state
  const [nodeContents, setNodeContents] = useState<Record<number, NodeContentResponse>>({});
  const [nodeContentsLoading, setNodeContentsLoading] = useState<Record<number, boolean>>({});

  // New Content Form State
  const [contentType, setContentType] = useState<'MATERIAL' | 'TEST'>('MATERIAL');
  const [materialType, setMaterialType] = useState<'FILE' | 'VIDEO' | 'EXTERNAL'>('FILE');
  const [contentTitle, setContentTitle] = useState('');
  const [isMaterialRequired, setIsMaterialRequired] = useState(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');

  // Video URL State
  const [contentVideoUrl, setContentVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | ''>('');
  const [videoDescription, setVideoDescription] = useState('');

  // External URL State
  const [contentFileUrl, setContentFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');

  // Test State
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testDuration, setTestDuration] = useState<number | ''>('');
  const [testPassingPercentage, setTestPassingPercentage] = useState<number | ''>(80);

  // Submitting state
  const [submittingContent, setSubmittingContent] = useState(false);

  const handleNumQuestionsChange = (val: string) => {
    setEditingNumQuestions(val);
    const num = Math.max(0, parseInt(val, 10) || 0);
    setBuilderQuestions((prev) => {
      const next = [...prev];
      while (next.length < num) {
        next.push({
          questionContent: "",
          questionType: "MULTIPLE_CHOICE",
          answers: [
            { answerContent: "", isCorrect: false },
            { answerContent: "", isCorrect: false },
            { answerContent: "", isCorrect: false },
            { answerContent: "", isCorrect: false },
          ],
        });
      }
      return next.slice(0, num);
    });
    setActiveQuestionIdx(0);
  };

  const handleQuestionTypeChange = (idx: number, type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'ESSAY') => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          questionType: type,
          answers: type === 'ESSAY'
            ? [{ answerContent: "", isCorrect: true }]
            : [
                { answerContent: "", isCorrect: false },
                { answerContent: "", isCorrect: false },
                { answerContent: "", isCorrect: false },
                { answerContent: "", isCorrect: false },
              ]
        };
      }
      return next;
    });
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

  const addAnswerOption = (qIdx: number) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[qIdx]) {
        next[qIdx] = {
          ...next[qIdx],
          answers: [...next[qIdx].answers, { answerContent: "", isCorrect: false }]
        };
      }
      return next;
    });
  };

  const updateAnswerField = (qIdx: number, aIdx: number, field: string, value: any) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[qIdx] && next[qIdx].answers[aIdx]) {
        const newAnswers = [...next[qIdx].answers];
        newAnswers[aIdx] = { ...newAnswers[aIdx], [field]: value };
        next[qIdx] = { ...next[qIdx], answers: newAnswers };
      }
      return next;
    });
  };

  const removeAnswerOption = (qIdx: number, aIdx: number) => {
    setBuilderQuestions((prev) => {
      const next = [...prev];
      if (next[qIdx]) {
        next[qIdx] = {
          ...next[qIdx],
          answers: next[qIdx].answers.filter((_: any, i: number) => i !== aIdx)
        };
      }
      return next;
    });
  };

  const startEditingNodeTest = async (test: any) => {
    setEditingNodeTest(test);
    setEditingTTitle(test.title);
    setEditingTDuration(String(test.durationMinutes || 15));
    setEditingTPass(String(test.passingPercentage || 0));
    setSaving(true);
    try {
      const qList = await learningPathService.getTeacherTestQuestions(test.testId);
      setEditingNumQuestions(String(qList.length));
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
      setEditingNumQuestions("0");
      setBuilderQuestions([]);
      setActiveQuestionIdx(0);
    } finally {
      setSaving(false);
    }
  };

  const saveSidebarNodeTest = async () => {
    if (!selectedNode) return;
    const isTestNode = selectedNode.testKind === 'PLACEMENT' || selectedNode.testKind === 'GATE' || selectedNode.testKind === 'FREE_CHOICE';
    const testTitleToUse = isTestNode ? selectedNode.title : editingTTitle.trim();
    if (!testTitleToUse) {
      toast.error("Nhập tiêu đề bài test");
      return;
    }
    const numQ = Math.max(0, parseInt(editingNumQuestions, 10) || 0);
    
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
      // 1. Delete old test first
      const nodeContent = nodeContents[selectedNode.nodeId];
      const testIdToDelete = isTestNode 
        ? (nodeContent?.tests && nodeContent.tests.length > 0 ? nodeContent.tests[0].testId : null)
        : (editingNodeTest ? editingNodeTest.testId : null);
        
      if (testIdToDelete) {
        await learningPathService.deleteTeacherNodeTest(testIdToDelete);
      }

      // 2. Create new test
      const testRes = await learningPathService.addTeacherNodeTest(selectedNode.nodeId, {
        title: testTitleToUse,
        durationMinutes: Number(editingTDuration) || 15,
        passingPercentage: selectedNode.testKind === 'PLACEMENT' ? 0 : (Number(editingTPass) || 0),
      });

      const createdTestId = testRes.testId;

      // 3. Create questions sequentially
      for (let i = 0; i < numQ; i++) {
        const q = builderQuestions[i];
        if (!q) continue;
        await learningPathService.addPlacementQuestion(createdTestId, {
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
      await fetchNodeContent(selectedNode.nodeId);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Không lưu được bài test");
    } finally {
      setSaving(false);
    }
  };

  const fetchNodeContent = async (nodeId: number) => {
    try {
      setNodeContentsLoading((prev) => ({ ...prev, [nodeId]: true }));
      const content = await learningPathService.getTeacherNodeContent(nodeId);
      setNodeContents((prev) => ({ ...prev, [nodeId]: content }));

      const node = nodes.find(n => n.nodeId === nodeId);
      const isTestNode = node?.testKind === "PLACEMENT" || node?.testKind === "GATE" || node?.testKind === "FREE_CHOICE";
      
      if (isTestNode && content.tests && content.tests.length > 0) {
        const activeTest = content.tests[0];
        setEditingTTitle(activeTest.title);
        setEditingTDuration(String(activeTest.durationMinutes || 15));
        setEditingTPass(String(activeTest.passingPercentage || 0));
        
        try {
          const qList = await learningPathService.getTeacherTestQuestions(activeTest.testId);
          setEditingNumQuestions(String(qList.length));
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
          setEditingNumQuestions("0");
          setBuilderQuestions([]);
          setActiveQuestionIdx(0);
        }
      } else {
        setEditingTTitle("");
        setEditingTDuration("15");
        setEditingTPass("0");
        setEditingNumQuestions("0");
        setBuilderQuestions([]);
        setActiveQuestionIdx(0);
      }
    } catch (err: any) {
      console.error(`Error loading content for node ${nodeId}:`, err);
      toast.error(err.response?.data?.message || 'Không thể tải nội dung bài học');
    } finally {
      setNodeContentsLoading((prev) => ({ ...prev, [nodeId]: false }));
    }
  };

  const handleSelectNode = async (node: LearningNodeResponse) => {
    setSelectedNode(node);
    setEditingNodeTest(null);
    await fetchNodeContent(node.nodeId);

    setLoadingNodeStudents(true);
    try {
      const currentAssigned = await learningPathService.getNodeStudents(node.nodeId);
      setAssignedStudentIds(currentAssigned.map(s => s.userId));

      const siblingNodes = nodes.filter(n => n.stageOrder === node.stageOrder && n.nodeId !== node.nodeId);
      const siblingMap: Record<number, { nodeId: number; nodeTitle: string }> = {};

      await Promise.all(
        siblingNodes.map(async (sibling) => {
          const studs = await learningPathService.getNodeStudents(sibling.nodeId);
          studs.forEach(student => {
            siblingMap[student.userId] = { nodeId: sibling.nodeId, nodeTitle: sibling.title };
          });
        })
      );

      setSiblingAssignments(siblingMap);
    } catch (err) {
      console.error('Error fetching student assignments:', err);
      toast.error('Không thể tải thông tin phân bổ sinh viên');
    } finally {
      setLoadingNodeStudents(false);
    }
  };

  const handleAssignStudent = async (studentUserId: number, checked: boolean) => {
    if (!selectedNode) return;

    let newIds = [...assignedStudentIds];
    if (checked) {
      const sibling = siblingAssignments[studentUserId];
      if (sibling) {
        toast.info(`Di chuyển sinh viên khỏi bài học: "${sibling.nodeTitle}" sang bài học hiện tại.`);
      }
      newIds.push(studentUserId);
    } else {
      newIds = newIds.filter(id => id !== studentUserId);
    }

    setAssignedStudentIds(newIds);
    if (checked) {
      const updatedSiblingMap = { ...siblingAssignments };
      delete updatedSiblingMap[studentUserId];
      setSiblingAssignments(updatedSiblingMap);
    }

    try {
      await learningPathService.assignStudentsToNode(selectedNode.nodeId, newIds);
      toast.success('Cập nhật phân bổ sinh viên thành công!');
    } catch (err: any) {
      console.error('Error assigning student:', err);
      toast.error(err.response?.data?.message || 'Không thể lưu phân bổ sinh viên');
      if (checked) {
        setAssignedStudentIds(assignedStudentIds.filter(id => id !== studentUserId));
        if (siblingAssignments[studentUserId]) {
          const revertedMap = { ...siblingAssignments };
          revertedMap[studentUserId] = siblingAssignments[studentUserId];
          setSiblingAssignments(revertedMap);
        }
      } else {
        setAssignedStudentIds([...assignedStudentIds, studentUserId]);
      }
    }
  };

  const toggleNode = async (id: number) => {
    const nextState = !expandedNodes[id];
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: nextState,
    }));

    if (nextState) {
      await fetchNodeContent(id);
    }
  };

  const fetchGraphData = async (classroomSubjectIdVal: number) => {
    try {
      const graph = await learningPathService.getClassroomGraph(classroomSubjectIdVal);
      setGraphData(graph);
    } catch (err) {
      console.error('Error fetching classroom learning path graph:', err);
    }
  };


  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!classroomSubjectId) return;

      try {
        setLoading(true);
        const [classData, studentsData] = await Promise.all([
          teacherService.getClassroomSubjectById(Number(classroomSubjectId)),
          classroomService.getStudents(Number(classroomSubjectId)),
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
          progress: 0,
          userId: item.userId,
        }));
        setStudents(formatted);
        await fetchGraphData(Number(classroomSubjectId));
      } catch (err: any) {
        console.error('Error loading classroom management:', err);
        setError(err.response?.data?.message || 'Failed to load classroom data');
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomSubjectId]);

  // Cross-tab consistency
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && classroomSubjectId) {
        fetchGraphData(Number(classroomSubjectId))
          .catch(err => console.error('Error auto-refreshing graph:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [classroomSubjectId]);

  const handleAddNodeClick = () => {
    setNewNodeTitle('');
    setNewNodeDesc('');
    setNKind('AT_HOME');
    setNLevel('');
    setNStage(1);
    setNApplies([]);
    setNUpMin('');
    setNDownMax('');
    setNYeuMax('');
    setNTbMax('');
    setTDuration('15');
    setNumQuestions('0');
    setIsAddNodeOpen(true);
  };

  const handleAddContentClick = (node: LearningNodeResponse) => {
    setSelectedNodeForContent(node);
    setContentType('MATERIAL');
    setMaterialType('FILE');
    setContentTitle('');
    setIsMaterialRequired(true);
    setSelectedFile(null);
    setFileDescription('');
    setContentVideoUrl('');
    setVideoDuration('');
    setVideoDescription('');
    setContentFileUrl('');
    setFileName('');
    setFileType('');
    setTestTitle('');
    setTestDescription('');
    setTestDuration('');
    setTestPassingPercentage(80);
    setIsAddContentOpen(true);
  };

  const handleAddContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeForContent) return;

    setSubmittingContent(true);
    try {
      if (contentType === 'MATERIAL') {
        if (!contentTitle.trim()) {
          toast.error('Tiêu đề tài liệu không được để trống');
          setSubmittingContent(false);
          return;
        }

        const formData = new FormData();
        formData.append('title', contentTitle.trim());
        formData.append('required', String(isMaterialRequired));

        if (materialType === 'FILE') {
          if (!selectedFile) {
            toast.error('Vui lòng chọn file tải lên');
            setSubmittingContent(false);
            return;
          }
          const uploaded = await uploadService.uploadToCloudinary(selectedFile, 'materials');
          formData.append('fileUrl', uploaded.url);
          formData.append('fileName', selectedFile.name);
          formData.append('fileType', selectedFile.type || uploaded.format || '');
          formData.append('publicId', uploaded.publicId);
          if (fileDescription.trim()) {
            formData.append('fileDescription', fileDescription.trim());
          }
        } else if (materialType === 'VIDEO') {
          if (!contentVideoUrl.trim()) {
            toast.error('Vui lòng nhập đường dẫn video');
            setSubmittingContent(false);
            return;
          }
          formData.append('videoUrl', contentVideoUrl.trim());
          formData.append('videoTitle', contentTitle.trim());
          if (videoDuration) {
            formData.append('videoDuration', String(videoDuration));
          }
          if (videoDescription.trim()) {
            formData.append('videoDescription', videoDescription.trim());
          }
        } else if (materialType === 'EXTERNAL') {
          if (!contentFileUrl.trim()) {
            toast.error('Vui lòng nhập đường dẫn tài liệu');
            setSubmittingContent(false);
            return;
          }
          formData.append('fileUrl', contentFileUrl.trim());
          formData.append('fileName', fileName.trim() || contentTitle.trim());
          if (fileType.trim()) {
            formData.append('fileType', fileType.trim());
          }
          if (fileDescription.trim()) {
            formData.append('fileDescription', fileDescription.trim());
          }
        }

        await learningPathService.addTeacherNodeMaterial(selectedNodeForContent.nodeId, formData);
        toast.success('Thêm tài liệu học tập thành công!');
      } else {
        // Create Test
        if (!testTitle.trim()) {
          toast.error('Vui lòng nhập tiêu đề bài kiểm tra');
          setSubmittingContent(false);
          return;
        }
        await learningPathService.addTeacherNodeTest(selectedNodeForContent.nodeId, {
          title: testTitle.trim(),
          description: testDescription.trim() || undefined,
          durationMinutes: testDuration ? Number(testDuration) : undefined,
          passingPercentage: testPassingPercentage ? Number(testPassingPercentage) : undefined,
        });
        toast.success('Thêm bài kiểm tra thành công!');
      }

      setIsAddContentOpen(false);
      await fetchNodeContent(selectedNodeForContent.nodeId);
    } catch (err: any) {
      console.error('Lỗi khi thêm nội dung:', err);
      toast.error(err.response?.data?.message || 'Không thể thêm nội dung cho bài học');
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleDeleteMaterial = async (nodeId: number, materialId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return;
    try {
      await learningPathService.deleteTeacherNodeMaterial(materialId);
      toast.success('Xóa tài liệu học tập thành công!');
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      console.error('Lỗi khi xóa tài liệu:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  const handleDeleteTest = async (nodeId: number, testId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này không?')) return;
    try {
      await learningPathService.deleteTeacherNodeTest(testId);
      toast.success('Xóa bài kiểm tra thành công!');
      await fetchNodeContent(nodeId);
    } catch (err: any) {
      console.error('Lỗi khi xóa bài kiểm tra:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa bài kiểm tra');
    }
  };

  const triggerRemoveNodeDialog = (nodeId: number, title: string) => {
    setNodeToDelete({ nodeId, title });
    setUnderstandDelete(false);
    setShowDeleteConfirm(true);
  };

  const handleRemoveNodeConfirm = async () => {
    if (!nodeToDelete) return;
    try {
      await learningPathService.deleteLearningNode(nodeToDelete.nodeId);
      toast.success(`Node "${nodeToDelete.title}" deleted successfully`);
      setShowDeleteConfirm(false);
      if (selectedNode && selectedNode.nodeId === nodeToDelete.nodeId) {
        setSelectedNode(null);
      }
      setNodeToDelete(null);
      if (classroomSubjectId) {
        await fetchGraphData(Number(classroomSubjectId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete node');
    }
  };

  const rewireAll = async () => {
    if (!classroomSubjectId) return;
    const g = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
    await syncEdges(g.edges, computeDesiredEdges(g.nodes), {
      createEdge: (r) => learningPathService.createNodeEdge(r),
      deleteEdge: (id) => learningPathService.deleteNodeEdge(id),
    });
    await fetchGraphData(Number(classroomSubjectId));
  };

  const handleAddNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) {
      toast.error('Tiêu đề bài học không được để trống');
      return;
    }
    if (!activePathId) {
      toast.error('Chưa tải được lộ trình học tập');
      return;
    }
    if (nodes.length === 0 && nKind !== 'PLACEMENT') {
      toast.error('Node đầu tiên của lộ trình phải là Test năng lực.');
      return;
    }
    if (nKind === 'PLACEMENT' && (!tDuration || Number(tDuration) <= 0)) {
      toast.error('Thời lượng bài test phải lớn hơn 0');
      return;
    }

    const placement = resolveNodePlacement({
      kind: nKind,
      stage: nStage,
      applies: nApplies,
      level: nLevel,
      existingNodes: nodes,
    });
    if ('error' in placement) {
      toast.error(placement.error);
      return;
    }

    const numQ = Math.max(0, parseInt(numQuestions, 10) || 0);

    setAddingNode(true);
    try {
      if (nKind === 'FREE_CHOICE') {
        // Test tự do = 3 node test (Yếu/TB/Khá) cùng chặng; mỗi node route về nhánh của nó.
        const variants: { lv: 1 | 2 | 3; name: string }[] = [
          { lv: 1, name: 'Yếu' },
          { lv: 2, name: 'TB' },
          { lv: 3, name: 'Khá' },
        ];
        for (const v of variants) {
          await learningPathService.createLearningNode({
            classroomPathId: activePathId,
            title: `${newNodeTitle.trim()} – ${v.name}`,
            description: newNodeDesc.trim() || undefined,
            nodeType: 'AT_HOME',
            testKind: 'FREE_CHOICE',
            appliesLevels: String(v.lv),
            displayOrder: 0,
            isRequired: true,
            stageOrder: nStage,
            level: v.lv,
          });
        }
      } else {
        const created = await learningPathService.createLearningNode({
          classroomPathId: activePathId,
          title: newNodeTitle.trim(),
          description: newNodeDesc.trim() || undefined,
          nodeType: nKind === 'ON_CLASS' ? 'ON_CLASS' : 'AT_HOME',
          testKind: nKind === 'GATE' ? 'GATE' : nKind === 'PLACEMENT' ? 'PLACEMENT' : 'NONE',
          appliesLevels: placement.appliesLevels,
          gateUpMin: nKind === 'GATE' && nUpMin !== '' ? Number(nUpMin) : undefined,
          gateDownMax: nKind === 'GATE' && nDownMax !== '' ? Number(nDownMax) : undefined,
          placementYeuMax: nKind === 'PLACEMENT' && nYeuMax !== '' ? Number(nYeuMax) : undefined,
          placementTbMax: nKind === 'PLACEMENT' && nTbMax !== '' ? Number(nTbMax) : undefined,
          displayOrder: 0,
          isRequired: true,
          stageOrder: nStage,
          level: placement.level,
        });

        // Node Test năng lực: tạo luôn bài test + N câu hỏi mẫu (giống admin).
        if (nKind === 'PLACEMENT') {
          const testRes = await learningPathService.addTeacherNodeTest(created.nodeId, {
            title: newNodeTitle.trim(),
            durationMinutes: Number(tDuration) || 15,
            passingPercentage: 0,
          });
          for (let i = 0; i < numQ; i++) {
            await learningPathService.addPlacementQuestion(testRes.testId, {
              questionContent: `Câu hỏi ${i + 1}`,
              questionType: 'MULTIPLE_CHOICE',
              score: 1,
              answers: [
                { answerContent: 'Đáp án A', isCorrect: true },
                { answerContent: 'Đáp án B', isCorrect: false },
                { answerContent: 'Đáp án C', isCorrect: false },
                { answerContent: 'Đáp án D', isCorrect: false },
              ],
            });
          }
        }
      }

      await rewireAll();
      toast.success('Đã thêm bài học');
      setIsAddNodeOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Không thể thêm bài học');
    } finally {
      setAddingNode(false);
    }
  };

  const handleEditNodeClick = (node: LearningNodeResponse) => {
    setNodeToEdit(node);
    setEditNodeTitle(node.title);
    setEditNodeDesc(node.description || '');
    setEditNodeType(node.nodeType);
    setEditNodeStatus(node.status);
    setEditNodeOrder(node.displayOrder || 1);
    setEditNodeRequired(node.isRequired ?? true);
    setEditPlacementYeuMax(node.placementYeuMax != null ? String(node.placementYeuMax) : '');
    setEditPlacementTbMax(node.placementTbMax != null ? String(node.placementTbMax) : '');
    setEditGateUpMin(node.gateUpMin != null ? String(node.gateUpMin) : '');
    setEditGateDownMax(node.gateDownMax != null ? String(node.gateDownMax) : '');
    setIsEditNodeOpen(true);
  };

  const handleEditNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeToEdit) return;
    if (!editNodeTitle.trim()) {
      toast.error('Tiêu đề node không được để trống');
      return;
    }

    try {
      setEditingNode(true);
      const updated = await learningPathService.updateLearningNode(nodeToEdit.nodeId, {
        title: editNodeTitle.trim(),
        description: editNodeDesc.trim(),
        nodeType: editNodeType,
        status: editNodeStatus,
        displayOrder: editNodeOrder,
        isRequired: editNodeRequired,
        placementYeuMax: nodeToEdit.testKind === 'PLACEMENT' ? (editPlacementYeuMax === '' ? null : Number(editPlacementYeuMax)) : undefined,
        placementTbMax: nodeToEdit.testKind === 'PLACEMENT' ? (editPlacementTbMax === '' ? null : Number(editPlacementTbMax)) : undefined,
        gateUpMin: nodeToEdit.testKind === 'GATE' ? (editGateUpMin === '' ? null : Number(editGateUpMin)) : undefined,
        gateDownMax: nodeToEdit.testKind === 'GATE' ? (editGateDownMax === '' ? null : Number(editGateDownMax)) : undefined,
      });

      toast.success('Cập nhật node thành công!');
      setIsEditNodeOpen(false);
      if (selectedNode && selectedNode.nodeId === nodeToEdit.nodeId) {
        setSelectedNode(updated);
      }
      setNodeToEdit(null);

      if (classroomSubjectId) {
        await fetchGraphData(Number(classroomSubjectId));
      }
    } catch (err: any) {
      console.error('Lỗi khi cập nhật node:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin node');
    } finally {
      setEditingNode(false);
    }
  };

  const handlePublish = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;

    if (!graphData?.quizStartTestId) {
      toast.error('Vui lòng khởi tạo và cấu hình bài test phân loại đầu vào trước khi xuất bản lộ trình.');
      setShowPublishConfirm(false);
      setUnderstandPublish(false);
      return;
    }

    try {
      setActionState('publishing');
      const res = await learningPathService.publishClassroomPath(Number(classroomSubjectId), graphData.pathId);

      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);

      setShowPublishConfirm(false);
      setUnderstandPublish(false);
      toast.success('Xuất bản lộ trình học thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xuất bản lộ trình học');
    } finally {
      setActionState('idle');
    }
  };

  const handleUnpublish = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;
    try {
      setActionState('unpublishing');
      await learningPathService.unpublishClassroomPath(Number(classroomSubjectId), graphData.pathId);

      const updatedGraph = await learningPathService.getClassroomGraph(Number(classroomSubjectId));
      setGraphData(updatedGraph);

      setShowUnpublishConfirm(false);
      setUnderstandUnpublish(false);
      toast.success('Gỡ xuất bản lộ trình học thành công!');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setUnpublishErrorMsg(err.response?.data?.message || 'Không thể unpublish — đã có học sinh hoàn thành node.');
        setShowUnpublishError(true);
      } else {
        toast.error(err.response?.data?.message || 'Không thể gỡ xuất bản lộ trình học');
      }
    } finally {
      setActionState('idle');
    }
  };

  const handleDeleteDraft = async () => {
    if (!classroomSubjectId || !graphData?.pathId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản nháp này không? Lộ trình sẽ bị xóa vĩnh viễn.')) return;

    try {
      setActionState('deleting');
      await learningPathService.deleteDraftPath(Number(classroomSubjectId), graphData.pathId);

      toast.success('Đã xóa bản nháp lộ trình học thành công!');
      navigate(`/teacher/classroom-subjects/${classroomSubjectId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa bản nháp lộ trình học');
    } finally {
      setActionState('idle');
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

  const isTestNode = selectedNode && (selectedNode.testKind === 'PLACEMENT' || selectedNode.testKind === 'GATE' || selectedNode.testKind === 'FREE_CHOICE');

  const renderQuestionBuilder = () => {
    const numQ = Math.max(0, parseInt(editingNumQuestions, 10) || 0);
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
              className="lp-input text-xs w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
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
                        className="lp-input flex-1 py-1 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
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
                  className="lp-input text-xs w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
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

  const isPublished = graphData?.state === 'PUBLISHED';
  const lockTooltip = "Lộ trình đã publish. Unpublish trước khi sửa.";

  return (
    <div className="space-y-6 relative font-sans text-slate-800">
      {/* Sticky Published Banner */}
      {isPublished && (
        <div
          className="sticky top-0 z-40 w-full bg-emerald-600 text-white py-2.5 px-4 rounded-[6px] shadow-sm flex items-center gap-2 mb-4 font-semibold text-sm animate-in slide-in-from-top duration-300"
          role="alert"
        >
          <CheckCircle2 className="size-5 shrink-0" />
          <span>Lộ trình đang ở trạng thái PUBLISHED. Mọi hoạt động chỉnh sửa cấu trúc (thêm/sửa/xóa node và edge) đều bị khóa.</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-[6px] border-slate-200 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold text-[#030213] tracking-tight">
            Lớp {classInfo.classCode} - {classInfo.courseCode} (Quản lý lộ trình)
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div title={isPublished ? lockTooltip : undefined}>
            <Button
              onClick={handleAddNodeClick}
              disabled={isPublished}
              className="text-white flex items-center gap-1 disabled:opacity-50 transition-all rounded-[6px] shadow-xs px-4 py-2 text-xs font-semibold h-9"
              style={{ backgroundColor: '#030213' }}
            >
              <Plus className="size-4" />
              Thêm bài học
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="rounded-[10px] border border-slate-200/60 shadow-xs overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100/80 bg-slate-50/40 py-4">
            <CardTitle className="text-base font-bold text-[#030213] flex items-center gap-2">
              <Map className="size-4 text-slate-500" />
              Thiết lập lộ trình học tập
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
              {/* Column 1: Roadmap Flow Graph — giới hạn ~3 node ngang, panel chi tiết phủ phần còn lại */}
              <div className="space-y-3 lg:w-[560px] lg:shrink-0">
                {nodes.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-[10px] bg-slate-50/40">
                    <Map className="size-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-medium mb-4">Chưa có bài học nào trong lộ trình lớp học.</p>
                    <div title={isPublished ? lockTooltip : undefined}>
                      <Button
                        onClick={() => setIsAddNodeOpen(true)}
                        disabled={isPublished}
                        size="sm"
                        className="text-white rounded-[6px] shadow-xs hover:opacity-95 font-semibold text-xs py-1.5"
                        style={{ backgroundColor: '#030213' }}
                      >
                        Tạo bài học đầu tiên
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[550px] overflow-auto rounded-xl border border-slate-200 bg-slate-50/30 p-2">
                    <LearningPathFlow
                      nodes={nodes}
                      edges={edges}
                      selectedNodeId={selectedNode?.nodeId ?? null}
                      onNodeClick={(clickedNode) => handleSelectNode(clickedNode)}
                    />
                  </div>
                )}
              </div>

              {/* Column 2: Selected Node Sidebar Details Panel */}
              <div className="flex-1 min-w-0 border border-slate-200 rounded-xl bg-slate-50/40 p-4 space-y-4 h-[580px] overflow-y-auto">
                {!selectedNode ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400">
                    <Map className="w-10 h-10 mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-800">Chọn một bài học trên sơ đồ</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Nhấp chọn node trên sơ đồ lộ trình bên trái để xem nội dung chi tiết & chỉnh sửa.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Node Header Info */}
                    <div className="space-y-2 border-b border-slate-200/80 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Chi tiết bài học
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal bg-slate-50 text-slate-650 border-slate-250 rounded-[4px]">
                            {selectedNode.nodeType === 'ON_CLASS' ? 'Trên lớp' : 'Tự học'}
                          </Badge>
                          {selectedNode.isRequired && (
                            <Badge className="text-[9px] py-0 px-1 font-normal bg-rose-50 text-rose-700 border-rose-250 rounded-[4px]" variant="outline">
                              Bắt buộc
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">{selectedNode.title}</h3>
                      {selectedNode.description && (
                        <p className="text-xs text-slate-650 leading-relaxed italic">{selectedNode.description}</p>
                      )}
                      <div className="text-[10px] text-slate-500 font-medium">
                        Trạng thái hiển thị: <span className="font-semibold text-slate-700">{selectedNode.status === 'OPEN' ? 'Mở' : selectedNode.status === 'LOCKED' ? 'Khóa' : 'Ẩn'}</span>
                      </div>

                      {(() => {
                        const incomingEdges = edges.filter((e) => e.toNodeId === selectedNode.nodeId);
                        const incomingNodes = incomingEdges.map(e => nodes.find(n => n.nodeId === e.fromNodeId)).filter(Boolean);
                        if (incomingNodes.length > 0) {
                          return (
                            <div className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200/60 p-1.5 rounded-[4px] mt-1.5">
                              <span className="font-bold text-slate-800">Yêu cầu trước: </span>
                              {incomingNodes.map(inNode => inNode?.title).join(', ')}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {isTestNode ? (
                      <div className="space-y-3 bg-indigo-50/20 border border-indigo-100 p-3.5 rounded-lg shadow-2xs">
                        <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                          {selectedNode.testKind === 'PLACEMENT' ? 'Cấu hình bài test năng lực' : 
                           selectedNode.testKind === 'GATE' ? 'Cấu hình bài test chặng' : 'Cấu hình bài test tự chọn'}
                        </h4>
                        <div className="space-y-3">
                          <div className={`grid gap-3 ${selectedNode.testKind === 'PLACEMENT' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Thời lượng</label>
                              <input 
                                type="number" 
                                min={1} 
                                className="w-full border border-slate-300/50 bg-white rounded-[6px] px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 lp-input" 
                                value={editingTDuration} 
                                onChange={(e) => setEditingTDuration(e.target.value)} 
                              />
                            </div>
                            {selectedNode.testKind !== 'PLACEMENT' && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">% đạt</label>
                                <input 
                                  type="number" 
                                  min={0} 
                                  max={100}
                                  className="w-full border border-slate-300/50 bg-white rounded-[6px] px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 lp-input" 
                                  value={editingTPass} 
                                  onChange={(e) => setEditingTPass(e.target.value)} 
                                />
                              </div>
                            )}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Số câu hỏi</label>
                              <input 
                                type="number" 
                                min={0} 
                                className="w-full border border-slate-300/50 bg-white rounded-[6px] px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 lp-input" 
                                value={editingNumQuestions} 
                                onChange={(e) => handleNumQuestionsChange(e.target.value)} 
                              />
                            </div>
                          </div>

                          {renderQuestionBuilder()}

                          <Button
                            type="button"
                            onClick={saveSidebarNodeTest}
                            disabled={saving}
                            className="w-full text-white font-semibold rounded-[6px] shadow-xs px-4 text-xs h-8 mt-2"
                            style={{ backgroundColor: '#030213' }}
                          >
                            {saving ? 'Đang lưu...' : 'Lưu bài test'}
                          </Button>
                        </div>
                      </div>
                    ) : editingNodeTest ? (
                      <div className="space-y-3 bg-indigo-50/20 border border-indigo-100 p-3.5 rounded-lg shadow-2xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-indigo-700 text-[11px] uppercase tracking-wider">
                            Cấu hình: {editingNodeTest.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setEditingNodeTest(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 underline"
                          >
                            Quay lại
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1 col-span-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Thời lượng</label>
                              <input 
                                type="number" 
                                min={1} 
                                className="w-full border border-slate-300/50 bg-white rounded-[6px] px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 lp-input" 
                                value={editingTDuration} 
                                onChange={(e) => setEditingTDuration(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-1 col-span-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">% đạt</label>
                              <input 
                                type="number" 
                                min={0} 
                                max={100}
                                className="w-full border border-slate-300/50 bg-white rounded-[6px] px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 lp-input" 
                                value={editingTPass} 
                                onChange={(e) => setEditingTPass(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-1 col-span-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Số câu hỏi</label>
                              <input 
                                type="number" 
                                min={0} 
                                className="w-full border border-slate-300/50 bg-white rounded-[6px] px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 lp-input" 
                                value={editingNumQuestions} 
                                onChange={(e) => handleNumQuestionsChange(e.target.value)} 
                              />
                            </div>
                          </div>

                          {renderQuestionBuilder()}

                          <Button
                            type="button"
                            onClick={saveSidebarNodeTest}
                            disabled={saving}
                            className="w-full text-white font-semibold rounded-[6px] shadow-xs px-4 text-xs h-8 mt-2"
                            style={{ backgroundColor: '#030213' }}
                          >
                            {saving ? 'Đang lưu...' : 'Lưu bài test'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Node Content lists (materials, tests, exercises) */}
                        <div className="space-y-4">
                          {/* Materials & Videos */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-650 uppercase tracking-wider">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="size-3.5 text-slate-500" />
                                Tài liệu & Video ({nodeContents[selectedNode.nodeId]?.materials?.length || 0})
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPublished}
                                className="h-6 text-[10px] text-primary hover:bg-primary/5 rounded font-bold px-1.5"
                                onClick={() => handleAddContentClick(selectedNode)}
                              >
                                + Thêm tài liệu
                              </Button>
                            </div>
                            {nodeContentsLoading[selectedNode.nodeId] ? (
                              <div className="flex items-center gap-2 text-xs text-slate-500 py-1 pl-2">
                                <Loader className="size-3 animate-spin" /> Tải tài liệu...
                              </div>
                            ) : !(nodeContents[selectedNode.nodeId]?.materials) || nodeContents[selectedNode.nodeId].materials.length === 0 ? (
                              <p className="text-xs text-slate-400 italic pl-1">Chưa có tài liệu học tập.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {(nodeContents[selectedNode.nodeId]?.materials || []).map((material) => (
                                  <div
                                    key={material.materialId}
                                    className="rounded-[6px] border border-slate-200/50 bg-white p-2 text-xs shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      {material.video ? <Film className="size-3.5 text-slate-500 shrink-0" /> : <FileText className="size-3.5 text-slate-500 shrink-0" />}
                                      <span className="truncate text-[11px] font-medium text-slate-700">{material.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      {material.video && (
                                        <a href={material.video.videoUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-750">
                                          <ExternalLink className="size-3" />
                                        </a>
                                      )}
                                      {material.file && (
                                        <a href={resolveAssetUrl(material.file.fileUrl)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-750">
                                          <Download className="size-3" />
                                        </a>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-5 rounded text-red-500 hover:text-red-700 hover:bg-red-55/10 rounded-[6px] shrink-0"
                                        disabled={isPublished}
                                        onClick={() => handleDeleteMaterial(selectedNode.nodeId, material.materialId)}
                                      >
                                        <X className="size-3" />
                                      </Button>
                                    </div>
                                    </div>
                                    <div className="max-w-2xl">
                                      <MaterialPreview material={material} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quizzes & Tests */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-650 uppercase tracking-wider">
                              <span className="flex items-center gap-1.5">
                                <Award className="size-3.5 text-slate-500" />
                                Bài kiểm tra ({nodeContents[selectedNode.nodeId]?.tests?.length || 0})
                              </span>
                            </div>
                            {nodeContentsLoading[selectedNode.nodeId] ? (
                              <div className="flex items-center gap-2 text-xs text-slate-500 py-1 pl-2">
                                <Loader className="size-3 animate-spin" /> Tải kiểm tra...
                              </div>
                            ) : !(nodeContents[selectedNode.nodeId]?.tests) || nodeContents[selectedNode.nodeId].tests.length === 0 ? (
                              <p className="text-xs text-slate-400 italic pl-1">Chưa có bài kiểm tra.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {(nodeContents[selectedNode.nodeId]?.tests || []).map((test) => (
                                  <div
                                    key={test.testId}
                                    className="flex items-center justify-between p-2 rounded-[6px] border border-slate-200/50 bg-white hover:bg-slate-50/50 text-xs transition-colors shadow-2xs"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <Award className="size-3.5 text-indigo-500 shrink-0" />
                                      <span className="truncate text-[11px] font-semibold text-slate-700">{test.title}</span>
                                      <span className="text-[10px] text-slate-400 shrink-0">({test.durationMinutes} ph)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-5 rounded text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 shrink-0"
                                        disabled={isPublished}
                                        onClick={() => startEditingNodeTest(test)}
                                      >
                                        <Settings className="size-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-5 rounded text-red-500 hover:text-red-700 hover:bg-red-55/10 rounded-[6px] shrink-0"
                                        disabled={isPublished}
                                        onClick={() => handleDeleteTest(selectedNode.nodeId, test.testId)}
                                      >
                                        <X className="size-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Node actions (edit, delete) */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60 w-full font-sans">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-slate-700 border-slate-250 hover:bg-slate-50 text-xs h-8 rounded-lg font-semibold"
                        onClick={() => handleEditNodeClick(selectedNode)}
                      >
                        <Edit2 className="size-3.5 mr-1" /> Sửa bài học
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8 rounded-lg font-semibold"
                        disabled={isPublished}
                        onClick={() => triggerRemoveNodeDialog(selectedNode.nodeId, selectedNode.title)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden helper element for aria accessibility */}
      {isPublished && (
        <span id="lock-reason" className="sr-only">
          {lockTooltip}
        </span>
      )}

      {/* CUSTOM CONFIRM DIALOG FOR NODE DELETION */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => { if (!open) { setShowDeleteConfirm(false); setUnderstandDelete(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="size-5 shrink-0" />
              <span>Xác nhận xóa bài học</span>
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ xóa vĩnh viễn bài học khỏi lộ trình của lớp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài học <strong>"{nodeToDelete?.title}"</strong>? Mọi liên kết prerequisite edges liên quan đến bài học này cũng sẽ bị xóa.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="understand-delete"
                checked={understandDelete}
                onCheckedChange={(val) => setUnderstandDelete(!!val)}
              />
              <label
                htmlFor="understand-delete"
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi đồng ý xóa bài học và chấp nhận mất các liên kết prerequisites đi kèm.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowDeleteConfirm(false); setUnderstandDelete(false); }}
              className="rounded-[6px] border-slate-200"
            >
              Hủy
            </Button>
            <Button
              onClick={handleRemoveNodeConfirm}
              disabled={!understandDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-[6px]"
            >
              Xóa bài học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD NODE MODAL */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-150">
              <h2 className="text-base font-bold text-[#030213]">Tạo bài học mới</h2>
              <button onClick={() => setIsAddNodeOpen(false)} className="text-slate-400 hover:text-slate-650">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tiêu đề bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu Git & GitHub..."
                  className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mô tả bài học</label>
                <textarea
                  placeholder="Nhập mô tả ngắn gọn nội dung bài học..."
                  rows={3}
                  className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Loại</label>
                <select
                  className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 font-medium"
                  value={nKind}
                  onChange={(e) => setNKind(e.target.value as AddNodeKind)}
                >
                  <option value="AT_HOME">Tự học</option>
                  <option value="GATE">Test phân luồng</option>
                  <option value="PLACEMENT">Test năng lực</option>
                  <option value="FREE_CHOICE">Test tự do chọn</option>
                </select>
              </div>

              {nKind === 'AT_HOME' || nKind === 'ON_CLASS' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Mức năng lực</label>
                    <select
                      className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800 font-medium"
                      value={nLevel}
                      onChange={(e) => setNLevel(e.target.value === '' ? '' : (Number(e.target.value) as 1 | 2 | 3))}
                    >
                      {LEVEL_OPTIONS.map((o) => (
                        <option key={String(o.value)} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Chặng (stage)</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                      value={nStage}
                      onChange={(e) => setNStage(Number(e.target.value) || 1)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {nKind === 'GATE' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Mức làm test</label>
                        <div className="flex gap-3 pt-2">
                          {[1, 2, 3].map((lv) => (
                            <label key={lv} className="flex items-center gap-1 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={nApplies.includes(lv)}
                                onChange={() => setNApplies((p) => (p.includes(lv) ? p.filter((x) => x !== lv) : [...p, lv]))}
                              />
                              {lv === 1 ? 'Yếu' : lv === 2 ? 'TB' : 'Khá'}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Chặng (stage)</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                          value={nStage}
                          onChange={(e) => setNStage(Number(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Mức làm test</label>
                        <p className="pt-2 text-sm text-slate-500">
                          {nKind === 'FREE_CHOICE' ? 'HS tự chọn 1 trong 3 mức' : 'Mọi mức (Yếu · TB · Khá)'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Chặng (stage)</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                          value={nStage}
                          onChange={(e) => setNStage(Number(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  )}

                  {nKind === 'PLACEMENT' && (
                    <>
                      <p className="text-xs text-slate-500">
                        Test năng lực phải đứng riêng một chặng; mọi học sinh đều làm và được phân về mức theo điểm.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Điểm Yếu tối đa (%)</label>
                          <input type="number" className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800" value={nYeuMax} onChange={(e) => setNYeuMax(e.target.value)} placeholder="vd 40" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Điểm TB tối đa (%)</label>
                          <input type="number" className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800" value={nTbMax} onChange={(e) => setNTbMax(e.target.value)} placeholder="vd 70" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Thời lượng làm test (phút)</label>
                          <input type="number" min={1} className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800" value={tDuration} onChange={(e) => setTDuration(e.target.value)} placeholder="vd 15" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Số lượng câu hỏi</label>
                          <input type="number" min={0} className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} placeholder="vd 5" />
                        </div>
                      </div>
                    </>
                  )}

                  {nKind === 'GATE' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Ngưỡng lên (≥ %)</label>
                        <input type="number" className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800" value={nUpMin} onChange={(e) => setNUpMin(e.target.value)} placeholder="vd 80" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Ngưỡng xuống (≤ %)</label>
                        <input type="number" className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800" value={nDownMax} onChange={(e) => setNDownMax(e.target.value)} placeholder="vd 40" />
                      </div>
                    </div>
                  )}

                  {nKind === 'FREE_CHOICE' && (
                    <p className="text-xs text-slate-500">
                      Sẽ tạo <b>3 node test</b> (Yếu / TB / Khá) cùng chặng. Mọi nhánh đều nối vào cả 3; học sinh tự chọn
                      làm bài nào, đạt ≥ ngưỡng % của bài đó thì học tiếp nhánh tương ứng. Mỗi node thêm 1 bài test + ngưỡng % ở phần chi tiết.
                    </p>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-150 pt-4">
                <Button type="button" variant="outline" className="rounded-[6px] border-slate-200" onClick={() => setIsAddNodeOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={addingNode}
                  className="text-white font-semibold rounded-[6px] shadow-xs px-4 disabled:opacity-60"
                  style={{ backgroundColor: '#030213' }}
                >
                  {addingNode ? 'Đang lưu...' : 'Tạo bài học'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CONTENT MODAL */}
      {isAddContentOpen && selectedNodeForContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-150">
              <div>
                <h2 className="text-base font-bold text-[#030213]">Thêm nội dung bài học</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Bài học: {selectedNodeForContent.title}</p>
              </div>
              <button onClick={() => setIsAddContentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddContentSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Loại nội dung</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType('MATERIAL')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] border transition-colors ${
                      contentType === 'MATERIAL'
                        ? 'bg-[#030213]/5 border-[#030213]/25 text-[#030213]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                    }`}
                  >
                    Tài liệu học tập
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('TEST')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] border transition-colors ${
                      contentType === 'TEST'
                        ? 'bg-[#030213]/5 border-[#030213]/25 text-[#030213]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                    }`}
                  >
                    Bài kiểm tra (Test)
                  </button>
                </div>
              </div>

              {contentType === 'MATERIAL' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tiêu đề tài liệu *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Slide bài giảng số 1, Video thực hành..."
                      className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Hình thức tài liệu</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMaterialType('FILE')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-[6px] border transition-colors ${
                          materialType === 'FILE'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                        }`}
                      >
                        Tải file lên
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType('VIDEO')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-[6px] border transition-colors ${
                          materialType === 'VIDEO'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                        }`}
                      >
                        Video URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType('EXTERNAL')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-[6px] border transition-colors ${
                          materialType === 'EXTERNAL'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                        }`}
                      >
                        Link ngoài
                      </button>
                    </div>
                  </div>

                  {materialType === 'FILE' && (
                    <div className="space-y-3 p-3 bg-slate-50/50 border border-slate-200 rounded-[6px] animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Chọn tập tin từ máy *</label>
                        <input
                          type="file"
                          required
                          className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Mô tả file (Tùy chọn)</label>
                        <input
                          type="text"
                          placeholder="e.g. Đọc tài liệu PDF trước khi lên lớp..."
                          className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                          value={fileDescription}
                          onChange={(e) => setFileDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {materialType === 'VIDEO' && (
                    <div className="space-y-3 p-3 bg-slate-50/50 border border-slate-200 rounded-[6px] animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Đường dẫn Video URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                          value={contentVideoUrl}
                          onChange={(e) => setContentVideoUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Thời lượng (giây)</label>
                          <input
                            type="number"
                            placeholder="Ví dụ: 600"
                            className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value ? Number(e.target.value) : '')}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Mô tả ngắn</label>
                          <input
                            type="text"
                            placeholder="e.g. Video giảng lý thuyết..."
                            className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                            value={videoDescription}
                            onChange={(e) => setVideoDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {materialType === 'EXTERNAL' && (
                    <div className="space-y-3 p-3 bg-slate-50/50 border border-slate-200 rounded-[6px] animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-750">Đường dẫn URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://example.com/document"
                          className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                          value={contentFileUrl}
                          onChange={(e) => setContentFileUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Tên hiển thị</label>
                          <input
                            type="text"
                            placeholder="e.g. Slide bài đọc..."
                            className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-750">Định dạng (Type)</label>
                          <input
                            type="text"
                            placeholder="e.g. PDF, Website..."
                            className="w-full border border-slate-300/50 bg-white rounded-[6px] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-800"
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isMatRequiredChk"
                      className="rounded text-slate-800 focus:ring-slate-800 size-4 cursor-pointer"
                      checked={isMaterialRequired}
                      onChange={(e) => setIsMaterialRequired(e.target.checked)}
                    />
                    <label htmlFor="isMatRequiredChk" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      Tài liệu bắt buộc hoàn thành (Required Material)
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tiêu đề bài kiểm tra *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bài test trắc nghiệm số 1..."
                      className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Mô tả bài kiểm tra</label>
                    <textarea
                      placeholder="Mô tả nội dung bài kiểm tra hoặc quy chế thi..."
                      rows={2}
                      className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Thời gian làm bài (Phút)</label>
                      <input
                        type="number"
                        placeholder="Ví dụ: 15"
                        min="1"
                        className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                        value={testDuration}
                        onChange={(e) => setTestDuration(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Tỷ lệ điểm đạt (%)</label>
                      <input
                        type="number"
                        placeholder="Ví dụ: 80"
                        min="0"
                        max="100"
                        className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                        value={testPassingPercentage}
                        onChange={(e) => setTestPassingPercentage(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-150 pt-4">
                <Button type="button" variant="outline" disabled={submittingContent} className="rounded-[6px] border-slate-200" onClick={() => setIsAddContentOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingContent}
                  className="text-white flex items-center gap-1.5 font-semibold rounded-[6px] shadow-xs px-4"
                  style={{ backgroundColor: '#030213' }}
                >
                  {submittingContent && <Loader className="size-4 animate-spin" />}
                  Lưu nội dung
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NODE MODAL */}
      {isEditNodeOpen && nodeToEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-150">
              <h2 className="text-base font-bold text-[#030213]">Chỉnh sửa bài học</h2>
              <button onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEditNodeSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tiêu đề bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu, Lab 1..."
                  className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                  value={editNodeTitle}
                  onChange={(e) => setEditNodeTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mô tả chi tiết</label>
                <textarea
                  placeholder="Nhập mô tả ngắn gọn nội dung bài học..."
                  rows={3}
                  className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800"
                  value={editNodeDesc}
                  onChange={(e) => setEditNodeDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Hình thức học</label>
                  <select
                    className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 font-medium"
                    value={editNodeType}
                    onChange={(e) => setEditNodeType(e.target.value as 'AT_HOME' | 'ON_CLASS')}
                  >
                    <option value="AT_HOME">Tự học (At Home)</option>
                    <option value="ON_CLASS">Trên lớp (On Class)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Trạng thái khóa học</label>
                  <select
                    className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 font-medium"
                    value={editNodeStatus}
                    onChange={(e) => setEditNodeStatus(e.target.value as 'LOCKED' | 'OPEN' | 'HIDDEN')}
                  >
                    <option value="LOCKED">Bị khóa (LOCKED)</option>
                    <option value="OPEN">Mở (OPEN)</option>
                    <option value="HIDDEN">Ẩn (HIDDEN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 lp-input"
                    value={editNodeOrder}
                    onChange={(e) => setEditNodeOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              {nodeToEdit.testKind === 'PLACEMENT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Điểm Yếu tối đa (%)</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 lp-input"
                      value={editPlacementYeuMax}
                      onChange={(e) => setEditPlacementYeuMax(e.target.value)}
                      placeholder="vd 40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Điểm TB tối đa (%)</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 lp-input"
                      value={editPlacementTbMax}
                      onChange={(e) => setEditPlacementTbMax(e.target.value)}
                      placeholder="vd 70"
                    />
                  </div>
                </div>
              )}

              {nodeToEdit.testKind === 'GATE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Ngưỡng lên (≥ %)</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 lp-input"
                      value={editGateUpMin}
                      onChange={(e) => setEditGateUpMin(e.target.value)}
                      placeholder="vd 80"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Ngưỡng xuống (≤ %)</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300/50 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white text-slate-800 lp-input"
                      value={editGateDownMax}
                      onChange={(e) => setEditGateDownMax(e.target.value)}
                      placeholder="vd 40"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsRequiredChk"
                  className="rounded text-slate-800 focus:ring-slate-800 size-4 cursor-pointer"
                  checked={editNodeRequired}
                  onChange={(e) => setEditNodeRequired(e.target.checked)}
                />
                <label htmlFor="editIsRequiredChk" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Mốc bài học bắt buộc (Required Milestone)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={editingNode}
                  className="rounded-[6px] border-slate-200"
                  onClick={() => { setIsEditNodeOpen(false); setNodeToEdit(null); }}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={editingNode}
                  className="text-white flex items-center gap-1.5 font-semibold rounded-[6px] shadow-xs px-4"
                  style={{ backgroundColor: '#030213' }}
                >
                  {editingNode && <Loader className="size-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Publish */}
      <Dialog open={showPublishConfirm} onOpenChange={(open) => { if (!open) { setShowPublishConfirm(false); setUnderstandPublish(false); } }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Xác nhận Publish lộ trình học</DialogTitle>
            <DialogDescription>
              Hành động này sẽ chính thức kích hoạt lộ trình học cho sinh viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              Lộ trình sẽ mở khóa các bài học đầu tiên (entry nodes) cho <strong>{students.length} học sinh</strong> đang enroll trong lớp học này.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100">
              <strong>Chú ý:</strong> Hành động không thể hủy bỏ (unpublish) nếu đã có bất kỳ học sinh nào hoàn thành tối thiểu một bài học trong lộ trình.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="understand-publish"
                checked={understandPublish}
                onCheckedChange={(val) => setUnderstandPublish(!!val)}
              />
              <label
                htmlFor="understand-publish"
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi hiểu và đồng ý publish lộ trình học cho sinh viên lớp này.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowPublishConfirm(false); setUnderstandPublish(false); }}
              disabled={actionState === 'publishing'}
            >
              Hủy
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!understandPublish || actionState === 'publishing'}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              {actionState === 'publishing' ? (
                <>
                  <Loader className="size-4 animate-spin mr-1" />
                  Đang seed tiến độ cho {students.length} học sinh...
                </>
              ) : (
                'Publish ngay'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Unpublish */}
      <Dialog open={showUnpublishConfirm} onOpenChange={(open) => { if (!open) { setShowUnpublishConfirm(false); setUnderstandUnpublish(false); } }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Xác nhận rút lại lộ trình học (Unpublish)</DialogTitle>
            <DialogDescription>
              Rút lại lộ trình học để chỉnh sửa thêm bản nháp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Toàn bộ tiến độ học tập và ghi nhận bài học hiện tại của học sinh sẽ bị xóa sạch khỏi hệ thống.
            </p>
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
              <strong>Cảnh báo:</strong> Hãy đảm bảo chưa có học sinh nào hoàn thành bất kỳ bài học nào, nếu không hệ thống sẽ từ chối rút lại lộ trình.
            </p>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="understand-unpublish"
                checked={understandUnpublish}
                onCheckedChange={(val) => setUnderstandUnpublish(!!val)}
              />
              <label
                htmlFor="understand-unpublish"
                className="text-xs text-gray-700 leading-tight cursor-pointer select-none font-medium"
              >
                Tôi xác nhận muốn xóa sạch tiến trình hiện tại để đưa lộ trình về trạng thái nháp.
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowUnpublishConfirm(false); setUnderstandUnpublish(false); }}
              disabled={actionState === 'unpublishing'}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUnpublish}
              disabled={!understandUnpublish || actionState === 'unpublishing'}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {actionState === 'unpublishing' ? <Loader className="size-4 animate-spin mr-1" /> : null}
              Xác nhận Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Error Modal (already completed nodes) */}
      <Dialog open={showUnpublishError} onOpenChange={setShowUnpublishError}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" />
              <span>Không thể unpublish</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600 leading-relaxed">
            {unpublishErrorMsg || 'Đã có học sinh hoàn thành node, không thể unpublish.'}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => setShowUnpublishError(false)}>
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <style>{`
        .lp-input {
          color: #0f172a !important;
          background-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
