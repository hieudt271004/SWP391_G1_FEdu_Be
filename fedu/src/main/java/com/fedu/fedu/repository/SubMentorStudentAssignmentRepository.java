package com.fedu.fedu.repository;

import com.fedu.fedu.entity.SubMentorStudentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubMentorStudentAssignmentRepository extends JpaRepository<SubMentorStudentAssignment, Long> {

    /** Kiểm tra cặp (sub-mentor, student) đã tồn tại chưa (chống tạo trùng). */
    boolean existsBySubMentorCss_IdAndStudentCss_Id(Long subMentorCssId, Long studentCssId);

    /** Lấy tất cả assignment của một sub-mentor (để biết họ kèm những học sinh nào). */
    List<SubMentorStudentAssignment> findBySubMentorCss_Id(Long subMentorCssId);

    /** Lấy tất cả assignment của một học sinh (để biết họ được kèm bởi ai). */
    List<SubMentorStudentAssignment> findByStudentCss_Id(Long studentCssId);

    /** Lấy danh sách student_css_id mà một sub-mentor phụ trách (dùng để lọc ticket). */
    @Query("SELECT a.studentCss.id FROM SubMentorStudentAssignment a WHERE a.subMentorCss.id = :subMentorCssId")
    List<Long> findStudentCssIdsBySubMentorCssId(@Param("subMentorCssId") Long subMentorCssId);

    /** Xóa một assignment cụ thể theo cặp (sub-mentor, student). */
    void deleteBySubMentorCss_IdAndStudentCss_Id(Long subMentorCssId, Long studentCssId);

    /** Xóa tất cả các assignment mà học sinh này đang được kèm cặp. */
    void deleteByStudentCss_Id(Long studentCssId);

    /** Xóa tất cả các assignment mà sub-mentor này đang kèm. */
    void deleteBySubMentorCss_Id(Long subMentorCssId);
}
