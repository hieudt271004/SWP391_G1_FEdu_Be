package com.fedu.fedu.utils;

import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.utils.enums.ClassroomStatus;

/**
 * Guard vòng đời lớp học dùng chung cho các thao tác GHI.
 * Lớp đã kết thúc (COMPLETED) hoặc đã xóa → chỉ được xem, mọi thao tác ghi bị chặn.
 * Admin muốn thao tác lại thì "Mở lại lớp" trước.
 */
public final class ClassroomGuards {

    private ClassroomGuards() {
    }

    public static void assertOpen(Classroom classroom) {
        if (classroom == null || Boolean.TRUE.equals(classroom.getIsDeleted())) {
            throw new ResourceNotFoundException("Lớp học không tồn tại hoặc đã bị xóa");
        }
        if (classroom.getStatus() == ClassroomStatus.COMPLETED) {
            throw new InvalidDataException("Lớp học đã kết thúc — chỉ có thể xem, không thể thao tác.");
        }
    }

    public static void assertOpen(ClassroomSubject classroomSubject) {
        if (classroomSubject == null) {
            throw new ResourceNotFoundException("Lớp-môn không tồn tại");
        }
        assertOpen(classroomSubject.getClassroom());
    }

    /**
     * Guard theo node: chỉ áp khi node thuộc lộ trình của một lớp-môn cụ thể.
     * Node của lộ trình mẫu (classroomSubject == null) hoặc test không gắn node thì bỏ qua.
     */
    public static void assertOpenForNode(com.fedu.fedu.entity.LearningNode node) {
        if (node == null || node.getLearningPath() == null) {
            return;
        }
        ClassroomSubject cs = node.getLearningPath().getClassroomSubject();
        if (cs != null) {
            assertOpen(cs);
        }
    }
}
