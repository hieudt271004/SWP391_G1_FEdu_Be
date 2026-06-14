package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "node_materials")
public class NodeMaterial extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_id")
    private Long materialId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private LearningNode learningNode;

    @Column(name = "title", nullable = false)
    private String title;

    /**
     * Danh sách các video thuộc tài liệu học tập này.
     */
    @OneToMany(mappedBy = "nodeMaterial", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Video> videos = new ArrayList<>();

    /**
     * Danh sách các file tài liệu thuộc bài học này.
     */
    @OneToMany(mappedBy = "nodeMaterial", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FileEntity> files = new ArrayList<>();

    /**
     * Đánh dấu tài liệu này có bắt buộc học không.
     */
    @Column(name = "required")
    private Boolean required = true;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}
