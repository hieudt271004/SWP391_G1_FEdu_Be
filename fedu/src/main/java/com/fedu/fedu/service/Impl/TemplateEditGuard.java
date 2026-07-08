package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.utils.enums.UserRole;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Đóng băng template của khoa theo trạng thái xuất bản của môn.
 * Vòng đời: draft (soạn/sửa template) → publish môn (teacher được clone, template khóa sửa)
 * → unpublish (sửa tiếp; các lớp đã clone không bị ảnh hưởng) → publish lại (clone được bản mới).
 * Không áp dụng cho path đã clone về lớp và template cá nhân của teacher.
 */
@Component
public class TemplateEditGuard {

    /** Chặn thêm/sửa/xóa template của khoa khi môn của nó đang xuất bản. */
    public void assertTemplateEditable(LearningPath path) {
        if (path == null || path.getClassroomSubject() != null) return; // path của lớp: theo quyền GV phụ trách
        if (SecurityContextHolder.getContext().getAuthentication() == null) return; // test/seed
        if (!isAdminTemplate(path)) return; // template cá nhân: chủ sở hữu sửa tự do
        Subject subject = path.getSubject();
        if (subject != null && "published".equalsIgnoreCase(subject.getStatus())) {
            throw new InvalidDataException(
                    "Môn đang xuất bản — cần gỡ xuất bản môn trước khi chỉnh sửa lộ trình mẫu. "
                            + "Các lớp đã clone không bị ảnh hưởng.");
        }
    }

    /** Như {@link #assertTemplateEditable} nhưng đi từ node (nội dung, edge, câu hỏi...). */
    public void assertNodeEditable(LearningNode node) {
        if (node != null) assertTemplateEditable(node.getLearningPath());
    }

    /** Template "của khoa": do admin tạo, hoặc dữ liệu cũ không ghi người tạo. */
    public boolean isAdminTemplate(LearningPath template) {
        UserAccount creator = template.getCreatedBy();
        if (creator == null) return true;
        return creator.getUserRoles() != null && creator.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getRoleName() == UserRole.ADMIN);
    }
}
