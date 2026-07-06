package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.res.StudentScheduleEntry;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.service.StudentScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentScheduleServiceImpl implements StudentScheduleService {

    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final LearningNodeRepository learningNodeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<StudentScheduleEntry> getStudentSchedule(Long studentId) {
        List<LearningNode> scheduledNodes = learningNodeRepository.findScheduledNodesForStudent(studentId);

        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findAllByStudentId(studentId);
        Map<Long, String> nodeStatusMap = progressList.stream()
                .filter(p -> p.getLearningNode() != null)
                .collect(Collectors.toMap(
                        p -> p.getLearningNode().getNodeId(),
                        p -> p.getStatus().name(),
                        (existing, replacement) -> existing
                ));

        return scheduledNodes.stream().map(node -> {
            String status = nodeStatusMap.getOrDefault(node.getNodeId(), "LOCKED");
            return StudentScheduleEntry.builder()
                    .nodeId(node.getNodeId())
                    .title(node.getTitle())
                    .description(node.getDescription())
                    .studyDate(node.getStudyDate())
                    .slotId(node.getSlot() != null ? node.getSlot().getSlotId() : null)
                    .slotName(node.getSlot() != null ? node.getSlot().getSlotName() : null)
                    .startTime(node.getSlot() != null ? node.getSlot().getStartTime() : null)
                    .endTime(node.getSlot() != null ? node.getSlot().getEndTime() : null)
                    .subjectName(node.getLearningPath().getSubject().getSubjectName())
                    .subjectCode(node.getLearningPath().getSubject().getSubjectCode())
                    .className(node.getLearningPath().getClassroomSubject().getClassroom().getClassName())
                    .classroomSubjectId(node.getLearningPath().getClassroomSubject().getId())
                    .status(status)
                    .build();
        }).collect(Collectors.toList());
    }
}
