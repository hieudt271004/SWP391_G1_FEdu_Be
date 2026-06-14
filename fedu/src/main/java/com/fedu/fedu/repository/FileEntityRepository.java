package com.fedu.fedu.repository;

import com.fedu.fedu.entity.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileEntityRepository extends JpaRepository<FileEntity, Long> {
    List<FileEntity> findByNodeMaterialMaterialIdAndIsDeletedFalse(Long materialId);
}
