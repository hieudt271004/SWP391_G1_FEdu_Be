package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeType;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "learning_nodes")
public class LearningNode extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "node_id")
    private Long nodeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id", nullable = false)
    private LearningPath learningPath;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "node_type")
    private NodeType nodeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "node_status")
    private NodeStatus status;

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Builder.Default
    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = true;

    @Column(name = "branch_name")
    private String branchName;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}
