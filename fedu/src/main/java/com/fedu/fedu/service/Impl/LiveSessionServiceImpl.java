package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.res.LiveSessionStateResponse;
import com.fedu.fedu.dto.res.NodeContentResponse;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.Test;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.TestRepository;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.service.LiveSessionService;
import com.fedu.fedu.service.NodeContentService;
import com.fedu.fedu.utils.enums.NodeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;

@Slf4j
@Service
@RequiredArgsConstructor
public class LiveSessionServiceImpl implements LiveSessionService {

    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final TestRepository testRepository;
    private final NodeContentService nodeContentService;
    private final LearningPathService learningPathService;

    
    @Override
    @Transactional
    public LiveSessionStateResponse getTeacherState(Long classroomSubjectId, Long nodeId, Long teacherId) {
        assertTeacherOwns(classroomSubjectId, teacherId);
        LearningNode node = loadOnClassNode(classroomSubjectId, nodeId);
        return buildState(node, false);
    }

    @Override
    @Transactional
    public LiveSessionStateResponse getStudentState(Long classroomSubjectId, Long nodeId, Long studentId) {
        if (!classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)) {
            throw new AccessDeniedException("Học sinh không thuộc lớp-môn này");
        }
        LearningNode node = loadOnClassNode(classroomSubjectId, nodeId);
        if (node.getLearningPath().getPublishedAt() == null) {
            throw new InvalidDataException("Lộ trình của lớp-môn chưa được xuất bản.");
        }
        return buildState(node, true);
    }

    @Override
    @Transactional
    public LiveSessionStateResponse startSession(Long classroomSubjectId, Long nodeId, Long teacherId) {
        assertTeacherOwns(classroomSubjectId, teacherId);
        LearningNode node = loadOnClassNode(classroomSubjectId, nodeId);

        LocalDateTime windowStart = windowStart(node);
        LocalDateTime windowEnd = windowEnd(node);
        if (windowStart == null || windowEnd == null) {
            throw new InvalidDataException("Buổi học chưa được xếp lịch (ngày + ca). Hãy xếp lịch trước khi bắt đầu.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(windowStart) || now.isAfter(windowEnd)) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
            throw new InvalidDataException("Chỉ có thể bắt đầu buổi học trong khung giờ đã xếp ("
                    + windowStart.format(fmt) + " → " + windowEnd.format(fmt) + ").");
        }
        if (isLive(node, now)) {
            throw new InvalidDataException("Buổi học đang diễn ra.");
        }

        node.setSessionStartedAt(now);
        node.setSessionEndedAt(null);
        learningNodeRepository.save(node);

        
        int opened = learningPathService.unlockOnClassNode(classroomSubjectId, nodeId);
        log.info("Live session started: node {} (cs {}), unlocked for {} students", nodeId, classroomSubjectId, opened);

        return buildState(node, false);
    }

    @Override
    @Transactional
    public LiveSessionStateResponse endSession(Long classroomSubjectId, Long nodeId, Long teacherId) {
        assertTeacherOwns(classroomSubjectId, teacherId);
        LearningNode node = loadOnClassNode(classroomSubjectId, nodeId);
        if (node.getSessionStartedAt() == null || node.getSessionEndedAt() != null) {
            throw new InvalidDataException("Buổi học chưa bắt đầu hoặc đã kết thúc.");
        }
        node.setSessionEndedAt(LocalDateTime.now());
        learningNodeRepository.save(node);
        return buildState(node, false);
    }

    @Override
    @Transactional
    public LiveSessionStateResponse releaseTest(Long classroomSubjectId, Long nodeId, Long testId, Long teacherId) {
        assertTeacherOwns(classroomSubjectId, teacherId);
        LearningNode node = loadOnClassNode(classroomSubjectId, nodeId);

        LocalDateTime now = LocalDateTime.now();
        if (!isLive(node, now)) {
            throw new InvalidDataException("Chỉ phát đề khi buổi học đang diễn ra.");
        }

        Test test = testRepository.findByTestIdAndIsDeletedFalse(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));
        if (test.getLearningNode() == null || !test.getLearningNode().getNodeId().equals(nodeId)) {
            throw new InvalidDataException("Đề không thuộc buổi học này.");
        }
        if (test.getDurationMinutes() == null || test.getDurationMinutes() <= 0) {
            throw new InvalidDataException("Đề cần có thời lượng (phút) để phát trong buổi học.");
        }
        if (test.getReleasedAt() != null && test.getReleaseEndsAt() != null
                && !now.isAfter(test.getReleaseEndsAt())) {
            throw new InvalidDataException("Đề này đang trong giờ làm bài.");
        }

        test.setReleasedAt(now);
        test.setReleaseEndsAt(now.plusMinutes(test.getDurationMinutes()));
        testRepository.save(test);
        log.info("Test {} released for node {} (cs {}), ends at {}", testId, nodeId, classroomSubjectId, test.getReleaseEndsAt());

        return buildState(node, false);
    }

    

    private void assertTeacherOwns(Long classroomSubjectId, Long teacherId) {
        if (!classroomSubjectRepository.existsByIdAndLecturerUserId(classroomSubjectId, teacherId)) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
    }

    private LearningNode loadOnClassNode(Long classroomSubjectId, Long nodeId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found"));
        if (node.getNodeType() != NodeType.ON_CLASS) {
            throw new InvalidDataException("Buổi học live chỉ áp dụng cho node 'Trên lớp' (ON_CLASS).");
        }
        if (node.getLearningPath() == null || node.getLearningPath().getClassroomSubject() == null
                || !node.getLearningPath().getClassroomSubject().getId().equals(classroomSubjectId)) {
            throw new InvalidDataException("Node không thuộc lộ trình của lớp-môn này.");
        }
        return node;
    }

    private LocalDateTime windowStart(LearningNode node) {
        if (node.getStudyDate() == null || node.getSlot() == null) return null;
        return node.getStudyDate().atTime(node.getSlot().getStartTime());
    }

    private LocalDateTime windowEnd(LearningNode node) {
        if (node.getStudyDate() == null || node.getSlot() == null) return null;
        return node.getStudyDate().atTime(node.getSlot().getEndTime());
    }

    
    private boolean isLive(LearningNode node, LocalDateTime now) {
        LocalDateTime end = windowEnd(node);
        return node.getSessionStartedAt() != null
                && node.getSessionEndedAt() == null
                && end != null
                && !now.isAfter(end);
    }

    private LiveSessionStateResponse buildState(LearningNode node, boolean forStudent) {
        LocalDateTime now = LocalDateTime.now();
        boolean live = isLive(node, now);
        LocalDateTime windowStart = windowStart(node);
        LocalDateTime windowEnd = windowEnd(node);
        boolean canStart = !forStudent && windowStart != null && windowEnd != null
                && !now.isBefore(windowStart) && !now.isAfter(windowEnd) && !live;

        NodeContentResponse content = nodeContentService.getNodeContent(node.getNodeId());
        if (forStudent && content.getTests() != null) {
            content.getTests().removeIf(t -> t.getReleasedAt() == null);
        }

        LiveSessionStateResponse.ActiveTestInfo activeTest = testRepository
                .findByLearningNodeNodeIdAndIsDeletedFalse(node.getNodeId())
                .stream()
                .filter(t -> t.getReleasedAt() != null && t.getReleaseEndsAt() != null
                        && !now.isAfter(t.getReleaseEndsAt()))
                .max(Comparator.comparing(Test::getReleasedAt))
                .map(t -> LiveSessionStateResponse.ActiveTestInfo.builder()
                        .testId(t.getTestId())
                        .title(t.getTitle())
                        .durationMinutes(t.getDurationMinutes())
                        .releasedAt(t.getReleasedAt())
                        .releaseEndsAt(t.getReleaseEndsAt())
                        .build())
                .orElse(null);

        return LiveSessionStateResponse.builder()
                .nodeId(node.getNodeId())
                .nodeTitle(node.getTitle())
                .studyDate(node.getStudyDate())
                .slotName(node.getSlot() != null ? node.getSlot().getSlotName() : null)
                .sessionWindowStart(windowStart)
                .sessionWindowEnd(windowEnd)
                .sessionStartedAt(node.getSessionStartedAt())
                .sessionEndedAt(node.getSessionEndedAt())
                .live(live)
                .canStart(canStart)
                .serverTime(now)
                .content(content)
                .activeTest(activeTest)
                .build();
    }
}
