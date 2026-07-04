package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeTestKind;
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



    /** Chặng thứ mấy trong lộ trình (1..subject.learningpathLength). */
    @Column(name = "stage_order")
    private Integer stageOrder;

    /** Mức của node: null = node chung mọi mức; 1=yếu, 2=tb, 3=khá = node thuộc nhánh mức cụ thể. */
    @Column(name = "level")
    private Integer level;

    /** Loại test của node: NONE = không phải node test; GATE = test chốt chặn; PLACEMENT = test năng lực phân luồng. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "test_kind")
    private NodeTestKind testKind = NodeTestKind.NONE;

    /** Mức nào LÀM test phân luồng/năng lực này (vd "1,2"); null = không áp dụng / mọi mức. */
    @Column(name = "applies_levels")
    private String appliesLevels;

    /** GATE: điểm ≥ gateUpMin → lên nhánh; ≤ gateDownMax → xuống nhánh; giữa = giữ nguyên. */
    @Column(name = "gate_up_min", precision = 5, scale = 2)
    private java.math.BigDecimal gateUpMin;

    @Column(name = "gate_down_max", precision = 5, scale = 2)
    private java.math.BigDecimal gateDownMax;

    /** PLACEMENT: điểm ≤ placementYeuMax → Yếu; ≤ placementTbMax → TB; còn lại → Khá. */
    @Column(name = "placement_yeu_max", precision = 5, scale = 2)
    private java.math.BigDecimal placementYeuMax;

    @Column(name = "placement_tb_max", precision = 5, scale = 2)
    private java.math.BigDecimal placementTbMax;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}
