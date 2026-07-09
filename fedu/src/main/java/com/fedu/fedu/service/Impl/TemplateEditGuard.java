package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.utils.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Gác cổng chỉnh sửa TEMPLATE (áp cho cả nội dung node/edge/câu hỏi):
 * - Template của khoa: chỉ admin được sửa, và bị đóng băng khi môn đang xuất bản.
 *   Vòng đời: draft (soạn/sửa template) → publish môn (teacher được clone, template khóa sửa)
 *   → unpublish (sửa tiếp; các lớp đã clone không bị ảnh hưởng) → publish lại (clone được bản mới).
 * - Template cá nhân: chỉ CHÍNH CHỦ (hoặc admin) được sửa, không đóng băng theo môn.
 * Không áp dụng cho path đã clone về lớp (quyền giảng viên phụ trách check ở tầng gọi).
 */
@Component
@RequiredArgsConstructor
public class TemplateEditGuard {

    private final UserAccountRepository userAccountRepository;

    /** Chặn thêm/sửa/xóa template ngoài quyền: khoa (admin + môn chưa publish), cá nhân (chính chủ). */
    public void assertTemplateEditable(LearningPath path) {
        if (path == null || path.getClassroomSubject() != null) return; // path của lớp: theo quyền GV phụ trách
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return; // test/seed
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isAdminTemplate(path)) {
            // Template cá nhân là RIÊNG TƯ: chỉ chính giáo viên tạo ra nó được sửa
            // (admin cũng không — admin chỉ quản lý template của khoa), không đóng băng theo môn.
            UserAccount actor = userAccountRepository.findByEmail(auth.getName()).orElse(null);
            boolean owns = actor != null && path.getCreatedBy() != null
                    && path.getCreatedBy().getUserId() == actor.getUserId();
            if (!owns) {
                throw new AccessDeniedException("Template cá nhân chỉ giáo viên tạo ra nó được chỉnh sửa");
            }
            return;
        }

        // Template của khoa: teacher không được đụng; admin bị khóa khi môn đang xuất bản
        if (!isAdmin) {
            throw new AccessDeniedException("Template của khoa chỉ quản trị viên được chỉnh sửa");
        }
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
