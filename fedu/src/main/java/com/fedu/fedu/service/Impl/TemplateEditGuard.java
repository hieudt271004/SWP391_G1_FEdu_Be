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









@Component
@RequiredArgsConstructor
public class TemplateEditGuard {

    private final UserAccountRepository userAccountRepository;

    
    public void assertTemplateEditable(LearningPath path) {
        if (path == null || path.getClassroomSubject() != null) return; 
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return; 
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isAdminTemplate(path)) {
            
            
            UserAccount actor = userAccountRepository.findByEmail(auth.getName()).orElse(null);
            boolean owns = actor != null && path.getCreatedBy() != null
                    && path.getCreatedBy().getUserId() == actor.getUserId();
            if (!owns) {
                throw new AccessDeniedException("Template cá nhân chỉ giáo viên tạo ra nó được chỉnh sửa");
            }
            return;
        }

        
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

    
    public void assertNodeEditable(LearningNode node) {
        if (node != null) assertTemplateEditable(node.getLearningPath());
    }

    
    public boolean isAdminTemplate(LearningPath template) {
        UserAccount creator = template.getCreatedBy();
        if (creator == null) return true;
        return creator.getUserRoles() != null && creator.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getRoleName() == UserRole.ADMIN);
    }
}
