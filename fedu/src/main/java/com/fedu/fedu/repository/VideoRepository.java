package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    List<Video> findByNodeMaterialMaterialIdAndIsDeletedFalse(Long materialId);
}
