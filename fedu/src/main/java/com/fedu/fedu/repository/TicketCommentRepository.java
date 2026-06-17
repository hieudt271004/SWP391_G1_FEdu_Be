package com.fedu.fedu.repository;

import com.fedu.fedu.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findBySupportTicketTicketIdOrderByCreatedAtAsc(Long ticketId);
}
