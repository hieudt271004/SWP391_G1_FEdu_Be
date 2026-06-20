package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.ScoreBandRequest;
import com.fedu.fedu.dto.res.ScoreBandResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.QuizScoreBand;
import com.fedu.fedu.entity.Test;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.QuizScoreBandRepository;
import com.fedu.fedu.repository.TestRepository;
import com.fedu.fedu.service.TeacherPlacementService;
import com.fedu.fedu.utils.LearningLevels;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherPlacementServiceImpl implements TeacherPlacementService {

    private static final BigDecimal MAX_PERCENT = BigDecimal.valueOf(100);

    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final TestRepository testRepository;
    private final QuizScoreBandRepository quizScoreBandRepository;

    @Override
    @Transactional
    public void setPlacementQuiz(Long classroomSubjectId, Long testId, Long teacherId) {
        if (!classroomSubjectRepository.existsByIdAndLecturerUserId(classroomSubjectId, teacherId)) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp-môn không tồn tại"));
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài test không tồn tại"));
        cs.setQuizStart(test);
        classroomSubjectRepository.save(cs);
    }

    @Override
    @Transactional
    public List<ScoreBandResponse> configureScoreBands(Long testId, List<ScoreBandRequest> bands, Long teacherId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài test không tồn tại"));
        assertTeacherOwnsTest(test, teacherId);
        validateBands(bands);

        quizScoreBandRepository.deleteByTestTestId(testId);
        List<QuizScoreBand> saved = new ArrayList<>();
        for (ScoreBandRequest b : bands) {
            saved.add(quizScoreBandRepository.save(QuizScoreBand.builder()
                    .test(test)
                    .minScore(b.getMinScore())
                    .maxScore(b.getMaxScore())
                    .targetLevel(b.getTargetLevel())
                    .build()));
        }
        return saved.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScoreBandResponse> getScoreBands(Long testId) {
        return quizScoreBandRepository.findByTestTestIdOrderByMinScoreAsc(testId)
                .stream().map(this::toResponse).toList();
    }

    /** Quyền: giảng viên phụ trách lớp-môn dùng test này (placement qua id_quiz_start, hoặc gate qua node). */
    private void assertTeacherOwnsTest(Test test, Long teacherId) {
        ClassroomSubject owning = classroomSubjectRepository.findByQuizStartTestId(test.getTestId())
                .orElse(null);
        if (owning == null && test.getLearningNode() != null
                && test.getLearningNode().getLearningPath() != null) {
            owning = test.getLearningNode().getLearningPath().getClassroomSubject();
        }
        if (owning != null && owning.getLecturer() != null
                && teacherId != null && owning.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn của bài test này");
        }
        // owning == null (test mức template chưa gắn lớp-môn): cho phép giảng viên cấu hình (đã qua hasRole TEACHER).
    }

    /** Các band phải phủ kín dải [0, 100] liền mạch, không chồng lấn. */
    private void validateBands(List<ScoreBandRequest> bands) {
        if (bands == null || bands.isEmpty()) {
            throw new InvalidDataException("Phải có ít nhất một khoảng điểm");
        }
        List<ScoreBandRequest> sorted = new ArrayList<>(bands);
        sorted.sort(Comparator.comparing(ScoreBandRequest::getMinScore));

        BigDecimal expectedStart = BigDecimal.ZERO;
        for (ScoreBandRequest b : sorted) {
            if (b.getMinScore().compareTo(b.getMaxScore()) > 0) {
                throw new InvalidDataException("minScore phải <= maxScore");
            }
            if (!LearningLevels.isValid(b.getTargetLevel())) {
                throw new InvalidDataException("targetLevel phải từ 1 đến 3");
            }
            if (b.getMinScore().compareTo(expectedStart) != 0) {
                throw new InvalidDataException(
                        "Các khoảng điểm phải liền mạch không chồng lấn, bắt đầu từ 0. Lỗi tại minScore=" + b.getMinScore());
            }
            expectedStart = b.getMaxScore();
        }
        if (expectedStart.compareTo(MAX_PERCENT) != 0) {
            throw new InvalidDataException("Các khoảng điểm phải phủ kín tới 100. Hiện kết thúc tại " + expectedStart);
        }
    }

    private ScoreBandResponse toResponse(QuizScoreBand b) {
        return ScoreBandResponse.builder()
                .bandId(b.getBandId())
                .testId(b.getTest().getTestId())
                .minScore(b.getMinScore())
                .maxScore(b.getMaxScore())
                .targetLevel(b.getTargetLevel())
                .build();
    }
}
