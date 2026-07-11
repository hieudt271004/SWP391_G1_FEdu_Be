package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateNodeQuestionRequest;
import com.fedu.fedu.dto.req.CreateQuestionAnswerRequest;
import com.fedu.fedu.dto.res.NodeQuestionResponse;
import com.fedu.fedu.dto.res.QuestionAnswerResponse;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.NodeQuestionRepository;
import com.fedu.fedu.repository.QuestionAnswerRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.NodeQnaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NodeQnaServiceImpl implements NodeQnaService {

    private final NodeQuestionRepository nodeQuestionRepository;
    private final QuestionAnswerRepository questionAnswerRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final UserAccountRepository userAccountRepository;

    

    @Override
    @Transactional(readOnly = true)
    public List<NodeQuestionResponse> getQuestionsForStudent(Long nodeId, Long studentId) {
        LearningNode node = getNode(nodeId);
        assertStudentEnrolledInNode(node, studentId);
        return buildQuestions(nodeId);
    }

    @Override
    @Transactional
    public NodeQuestionResponse askQuestion(Long nodeId, Long studentId, CreateNodeQuestionRequest request) {
        LearningNode node = getNode(nodeId);
        assertStudentEnrolledInNode(node, studentId);
        UserAccount student = getUser(studentId);

        NodeQuestion question = NodeQuestion.builder()
                .learningNode(node)
                .student(student)
                .content(request.getContent())
                .isDeleted(false)
                .build();
        nodeQuestionRepository.save(question);
        log.info("Student {} asked question {} on node {}", studentId, question.getQuestionId(), nodeId);
        return mapQuestion(question, Collections.emptyList());
    }

    @Override
    @Transactional
    public NodeQuestionResponse updateQuestion(Long questionId, Long studentId, CreateNodeQuestionRequest request) {
        NodeQuestion question = getQuestion(questionId);
        if (question.getStudent() == null || question.getStudent().getUserId() != studentId) {
            throw new AccessDeniedException("Bạn chỉ có thể sửa câu hỏi của mình.");
        }
        question.setContent(request.getContent());
        nodeQuestionRepository.save(question);
        return mapQuestion(question, answersOf(questionId));
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionId, Long studentId) {
        NodeQuestion question = getQuestion(questionId);
        if (question.getStudent() == null || question.getStudent().getUserId() != studentId) {
            throw new AccessDeniedException("Bạn chỉ có thể xóa câu hỏi của mình.");
        }
        question.setIsDeleted(true);
        nodeQuestionRepository.save(question);
    }

    

    @Override
    @Transactional(readOnly = true)
    public List<NodeQuestionResponse> getQuestionsForTeacher(Long nodeId, Long teacherId) {
        LearningNode node = getNode(nodeId);
        assertTeacherOwnsNode(node, teacherId);
        return buildQuestions(nodeId);
    }

    @Override
    @Transactional
    public QuestionAnswerResponse answerQuestion(Long questionId, Long teacherId, CreateQuestionAnswerRequest request) {
        NodeQuestion question = getQuestion(questionId);
        assertTeacherOwnsNode(question.getLearningNode(), teacherId);
        UserAccount lecturer = getUser(teacherId);

        QuestionAnswer answer = QuestionAnswer.builder()
                .nodeQuestion(question)
                .lecturer(lecturer)
                .content(request.getContent())
                .isDeleted(false)
                .build();
        questionAnswerRepository.save(answer);
        log.info("Teacher {} answered question {}", teacherId, questionId);
        return mapAnswer(answer);
    }

    @Override
    @Transactional
    public QuestionAnswerResponse updateAnswer(Long answerId, Long teacherId, CreateQuestionAnswerRequest request) {
        QuestionAnswer answer = getAnswer(answerId);
        if (answer.getLecturer() == null || answer.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn chỉ có thể sửa câu trả lời của mình.");
        }
        answer.setContent(request.getContent());
        questionAnswerRepository.save(answer);
        return mapAnswer(answer);
    }

    @Override
    @Transactional
    public void deleteAnswer(Long answerId, Long teacherId) {
        QuestionAnswer answer = getAnswer(answerId);
        if (answer.getLecturer() == null || answer.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn chỉ có thể xóa câu trả lời của mình.");
        }
        answer.setIsDeleted(true);
        questionAnswerRepository.save(answer);
    }

    

    private LearningNode getNode(Long nodeId) {
        return learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
    }

    private NodeQuestion getQuestion(Long questionId) {
        return nodeQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
    }

    private QuestionAnswer getAnswer(Long answerId) {
        return questionAnswerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found with id: " + answerId));
    }

    private UserAccount getUser(Long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    
    private ClassroomSubject resolveClassroomSubject(LearningNode node) {
        LearningPath path = node.getLearningPath();
        if (path == null || path.getClassroomSubject() == null) {
            throw new InvalidDataException("Bài học này không thuộc lớp-môn nào nên chưa hỗ trợ hỏi đáp.");
        }
        return path.getClassroomSubject();
    }

    private void assertStudentEnrolledInNode(LearningNode node, Long studentId) {
        ClassroomSubject cs = resolveClassroomSubject(node);
        if (!classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)) {
            throw new AccessDeniedException("Bạn không thuộc lớp-môn của bài học này.");
        }
    }

    private void assertTeacherOwnsNode(LearningNode node, Long teacherId) {
        ClassroomSubject cs = resolveClassroomSubject(node);
        if (cs.getLecturer() == null || cs.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này.");
        }
    }

    private List<NodeQuestionResponse> buildQuestions(Long nodeId) {
        List<NodeQuestion> questions =
                nodeQuestionRepository.findByLearningNodeNodeIdAndIsDeletedFalseOrderByCreatedAtAsc(nodeId);
        if (questions.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> questionIds = questions.stream()
                .map(NodeQuestion::getQuestionId)
                .collect(Collectors.toList());
        Map<Long, List<QuestionAnswerResponse>> answersByQuestion = questionAnswerRepository
                .findByNodeQuestionQuestionIdInAndIsDeletedFalseOrderByCreatedAtAsc(questionIds)
                .stream()
                .map(this::mapAnswer)
                .collect(Collectors.groupingBy(QuestionAnswerResponse::getQuestionId));

        return questions.stream()
                .map(q -> mapQuestion(q, answersByQuestion.getOrDefault(q.getQuestionId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    private List<QuestionAnswerResponse> answersOf(Long questionId) {
        return questionAnswerRepository
                .findByNodeQuestionQuestionIdInAndIsDeletedFalseOrderByCreatedAtAsc(List.of(questionId))
                .stream()
                .map(this::mapAnswer)
                .collect(Collectors.toList());
    }

    private NodeQuestionResponse mapQuestion(NodeQuestion q, List<QuestionAnswerResponse> answers) {
        UserAccount student = q.getStudent();
        return NodeQuestionResponse.builder()
                .questionId(q.getQuestionId())
                .nodeId(q.getLearningNode() != null ? q.getLearningNode().getNodeId() : null)
                .content(q.getContent())
                .studentId(student != null ? student.getUserId() : null)
                .studentName(fullName(student))
                .studentAvatarUrl(student != null ? student.getAvatarUrl() : null)
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .answers(answers)
                .build();
    }

    private QuestionAnswerResponse mapAnswer(QuestionAnswer a) {
        UserAccount lecturer = a.getLecturer();
        return QuestionAnswerResponse.builder()
                .answerId(a.getAnswerId())
                .questionId(a.getNodeQuestion() != null ? a.getNodeQuestion().getQuestionId() : null)
                .content(a.getContent())
                .lecturerId(lecturer != null ? lecturer.getUserId() : null)
                .lecturerName(fullName(lecturer))
                .lecturerAvatarUrl(lecturer != null ? lecturer.getAvatarUrl() : null)
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private String fullName(UserAccount u) {
        if (u == null) return null;
        return (u.getFirstName() + " " + u.getLastName()).trim();
    }
}
