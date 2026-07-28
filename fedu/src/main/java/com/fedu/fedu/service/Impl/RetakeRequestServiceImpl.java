package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.RetakeRequestPayload;
import com.fedu.fedu.dto.req.RetakeResolvePayload;
import com.fedu.fedu.dto.res.RetakeRequestResponse;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.RetakeRequestService;
import com.fedu.fedu.utils.enums.AttemptStatus;
import com.fedu.fedu.utils.enums.RetakeRequestStatus;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RetakeRequestServiceImpl implements RetakeRequestService {

    private final RetakeRequestRepository retakeRequestRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final StudentTestAttemptRepository studentTestAttemptRepository;
    private final LearningPathRepository learningPathRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final NodeEdgeRepository nodeEdgeRepository;
    private final TestRepository testRepository;
    private final UserAccountRepository userAccountRepository;
    private final StudentMaterialProgressRepository studentMaterialProgressRepository;

    @Override
    @Transactional
    public RetakeRequestResponse createRequest(Long studentId, RetakeRequestPayload payload) {
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(payload.getClassroomSubjectId(), studentId)
                .orElseThrow(() -> new AccessDeniedException("Học sinh không thuộc lớp-môn này"));

        Test test = testRepository.findById(payload.getTestId())
                .orElseThrow(() -> new ResourceNotFoundException("Bài kiểm tra không tồn tại"));

        // Check if there is already a PENDING request
        Optional<RetakeRequest> pending = retakeRequestRepository
                .findFirstByStudentUserIdAndTestTestIdAndStatus(studentId, payload.getTestId(), RetakeRequestStatus.PENDING);
        if (pending.isPresent()) {
            throw new InvalidDataException("Bạn đã có một yêu cầu thi lại đang chờ duyệt cho bài kiểm tra này.");
        }

        RetakeRequest request = RetakeRequest.builder()
                .student(css.getStudent())
                .classroomSubject(css.getClassroomSubject())
                .test(test)
                .status(RetakeRequestStatus.PENDING)
                .requestReason(payload.getRequestReason())
                .build();

        RetakeRequest saved = retakeRequestRepository.save(request);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public RetakeRequestResponse resolveRequest(Long teacherId, Long requestId, RetakeResolvePayload payload) {
        RetakeRequest request = retakeRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu thi lại không tồn tại"));

        ClassroomSubject cs = request.getClassroomSubject();
        if (!classroomSubjectRepository.existsByIdAndLecturerUserId(cs.getId(), teacherId)) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }

        if (request.getStatus() != RetakeRequestStatus.PENDING) {
            throw new InvalidDataException("Yêu cầu này đã được xử lý trước đó.");
        }

        UserAccount teacher = userAccountRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Giảng viên không tồn tại"));

        request.setStatus(payload.getStatus());
        request.setResolvedAt(LocalDateTime.now());
        request.setResolvedBy(teacher);
        if (payload.getStatus() == RetakeRequestStatus.REJECTED) {
            request.setRejectReason(payload.getRejectReason());
        } else if (payload.getStatus() == RetakeRequestStatus.APPROVED) {
            // Process approval logic
            processRetakeApproval(request);
        }

        RetakeRequest saved = retakeRequestRepository.save(request);
        return mapToResponse(saved);
    }

    private void processRetakeApproval(RetakeRequest request) {
        Long studentId = request.getStudent().getUserId();
        Long classroomSubjectId = request.getClassroomSubject().getId();
        Long testId = request.getTest().getTestId();

        // 1. Soft-delete previous attempts for this test
        List<StudentTestAttempt> attempts = studentTestAttemptRepository
                .findByStudentUserIdAndTestTestId(studentId, testId);
        for (StudentTestAttempt att : attempts) {
            if (att.getStatus() == AttemptStatus.SUBMITTED
                    || att.getStatus() == AttemptStatus.IN_PROGRESS
                    || att.getStatus() == AttemptStatus.PENDING_REVIEW) {
                att.setStatus(AttemptStatus.CANCELLED);
                studentTestAttemptRepository.save(att);
            }
        }

        // 2. Determine if it is the Entry Placement Test
        ClassroomSubject cs = request.getClassroomSubject();
        boolean isEntryPlacement = cs.getQuizStart() != null && cs.getQuizStart().getTestId().equals(testId);

        if (isEntryPlacement) {
            // Entry placement reset
            ClassroomSubjectStudent css = classroomSubjectStudentRepository
                    .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student enrollment not found"));

            css.setCurrentLevel(null);
            classroomSubjectStudentRepository.save(css);
            
            LearningPath path = learningPathRepository
                    .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                    .orElse(null);
            if (path != null) {
                List<StudentNodeProgress> progressList = studentNodeProgressRepository
                        .findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
                Set<Long> resetNodeIds = new HashSet<>();
                for (StudentNodeProgress p : progressList) {
                    LearningNode n = p.getLearningNode();
                    if (n.getNodeType() == com.fedu.fedu.utils.enums.NodeType.ON_CLASS) continue;
                    boolean levelSpecific = n.getLevel() != null;
                    boolean chungTest = n.getLevel() == null && n.getTestKind() != null
                            && n.getTestKind() != com.fedu.fedu.utils.enums.NodeTestKind.NONE;
                    if (!levelSpecific && !chungTest) continue;
                    p.setStatus(StudentProgressStatus.LOCKED);
                    p.setCompletedAt(null);
                    p.setUnlockedAt(null);
                    resetNodeIds.add(n.getNodeId());
                }
                studentNodeProgressRepository.saveAll(progressList);
                resetNodeItemProgress(studentId, resetNodeIds);
            }
        } else {
            // Learning path node test retake
            LearningNode testNode = request.getTest().getLearningNode();
            if (testNode != null) {
                LearningPath path = testNode.getLearningPath();
                if (path != null) {
                    // Reset the status of this test node to OPEN so student can retake
                    List<StudentNodeProgress> progressList = studentNodeProgressRepository
                            .findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
                    
                    StudentNodeProgress testNodeProgress = progressList.stream()
                            .filter(p -> p.getLearningNode().getNodeId().equals(testNode.getNodeId()))
                            .findFirst().orElse(null);

                    if (testNodeProgress != null) {
                        testNodeProgress.setStatus(StudentProgressStatus.OPEN);
                        testNodeProgress.setCompletedAt(null);
                        studentNodeProgressRepository.save(testNodeProgress);
                    }

                    // Lock all downstream level-specific nodes
                    ClassroomSubjectStudent css = classroomSubjectStudentRepository
                            .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                            .orElse(null);
                    Integer currentLevel = css != null ? css.getCurrentLevel() : null;
                    if (currentLevel != null) {
                        lockDownstreamLevelSpecificNodes(studentId, testNode, path.getPathId(), currentLevel);
                    }
                }
            }
        }
    }

    private void lockDownstreamLevelSpecificNodes(Long studentId, LearningNode startNode, Long pathId, Integer currentLevel) {
        List<StudentNodeProgress> list = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, pathId);
        Map<Long, StudentNodeProgress> progressMap = list.stream()
                .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(), p -> p, (a, b) -> a));

        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(pathId);
        Map<Long, List<NodeEdge>> outgoing = new HashMap<>();
        for (NodeEdge e : edges) {
            outgoing.computeIfAbsent(e.getFromNode().getNodeId(), k -> new ArrayList<>()).add(e);
        }

        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(startNode.getNodeId());
        visited.add(startNode.getNodeId());

        boolean first = true;
        Set<Long> resetNodeIds = new HashSet<>();
        while (!queue.isEmpty()) {
            Long currId = queue.poll();
            if (!first) {
                StudentNodeProgress p = progressMap.get(currId);
                if (p != null) {
                    LearningNode n = p.getLearningNode();
                    // Lock level-specific nodes
                    if (n.getLevel() != null && p.getStatus() != StudentProgressStatus.LOCKED) {
                        p.setStatus(StudentProgressStatus.LOCKED);
                        p.setCompletedAt(null);
                        studentNodeProgressRepository.save(p);
                        resetNodeIds.add(n.getNodeId());
                    }
                }
            }
            first = false;

            for (NodeEdge edge : outgoing.getOrDefault(currId, Collections.emptyList())) {
                if (visited.add(edge.getToNode().getNodeId())) {
                    queue.add(edge.getToNode().getNodeId());
                }
            }
        }
        resetNodeItemProgress(studentId, resetNodeIds);
    }

    /**
     * Reset tiến độ NỘI DUNG bên trong các node vừa bị khóa lại để học sinh học lại được:
     * xóa đánh dấu hoàn thành học liệu và hủy các lượt thi của test thuộc node đó.
     * Nếu không reset, mọi item trong node vẫn "đã xong" → không còn sự kiện hoàn thành nào
     * để node tự COMPLETED lại → lộ trình kẹt vĩnh viễn. Bài nộp exercise được GIỮ
     * (chứa bài làm + điểm giáo viên chấm) — exercise không phải làm lại.
     */
    private void resetNodeItemProgress(Long studentId, Set<Long> nodeIds) {
        if (nodeIds.isEmpty()) return;

        studentMaterialProgressRepository.deleteByStudentAndNodeIds(studentId, nodeIds);

        List<StudentTestAttempt> attempts = studentTestAttemptRepository
                .findByStudentUserIdAndTestLearningNodeNodeIdIn(studentId, nodeIds);
        List<StudentTestAttempt> toCancel = new ArrayList<>();
        for (StudentTestAttempt att : attempts) {
            if (att.getStatus() != AttemptStatus.CANCELLED) {
                att.setStatus(AttemptStatus.CANCELLED);
                toCancel.add(att);
            }
        }
        if (!toCancel.isEmpty()) {
            studentTestAttemptRepository.saveAll(toCancel);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<RetakeRequestResponse> getStudentRequests(Long studentId, Long classroomSubjectId) {
        return retakeRequestRepository
                .findByStudentUserIdAndClassroomSubjectIdOrderByRequestedAtDesc(studentId, classroomSubjectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RetakeRequestResponse> getTeacherPendingRequests(Long teacherId, Long classroomSubjectId) {
        if (!classroomSubjectRepository.existsByIdAndLecturerUserId(classroomSubjectId, teacherId)) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }

        // Trả về mọi trạng thái: FE tách danh sách chờ duyệt (PENDING) và lịch sử đã xử lý
        // (APPROVED/REJECTED/COMPLETED) từ cùng một nguồn.
        return retakeRequestRepository
                .findByClassroomSubjectIdOrderByRequestedAtAsc(classroomSubjectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RetakeRequestResponse mapToResponse(RetakeRequest request) {
        String studentName = request.getStudent().getFirstName() + " " + request.getStudent().getLastName();
        String csName = request.getClassroomSubject().getClassroom().getClassName() + " - " 
                + request.getClassroomSubject().getSubject().getSubjectName();
        String resolvedByName = request.getResolvedBy() != null 
                ? request.getResolvedBy().getFirstName() + " " + request.getResolvedBy().getLastName()
                : null;

        return RetakeRequestResponse.builder()
                .id(request.getId())
                .studentId(request.getStudent().getUserId())
                .studentEmail(request.getStudent().getEmail())
                .studentName(studentName)
                .classroomSubjectId(request.getClassroomSubject().getId())
                .classroomSubjectName(csName)
                .testId(request.getTest().getTestId())
                .testTitle(request.getTest().getTitle())
                .status(request.getStatus())
                .requestReason(request.getRequestReason())
                .rejectReason(request.getRejectReason())
                .requestedAt(request.getRequestedAt())
                .resolvedAt(request.getResolvedAt())
                .resolvedByName(resolvedByName)
                .build();
    }
}
