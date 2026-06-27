package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Lưu trữ các file tài liệu (PDF, Word, v.v.) đính kèm trong NodeMaterial.
 * Sử dụng tên "FileEntity" để tránh xung đột với java.io.File.
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "files")
public class FileEntity extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id")
    private Long fileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private NodeMaterial nodeMaterial;

    @Column(name = "file_url", columnDefinition = "TEXT", nullable = false)
    private String fileUrl;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    // id asset trên Cloudinary; null = file không thuộc Cloudinary.
    @Column(name = "public_id")
    private String publicId;

    // Cloudinary resource_type: image / raw / video — cần để gọi destroy đúng loại
    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}
