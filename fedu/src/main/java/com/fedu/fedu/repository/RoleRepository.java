package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Role;
import com.fedu.fedu.utils.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(UserRole roleName);
}
