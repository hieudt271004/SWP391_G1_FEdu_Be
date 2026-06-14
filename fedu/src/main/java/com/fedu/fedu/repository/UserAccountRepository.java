package com.fedu.fedu.repository;

import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.utils.enums.UserStatus;
import com.fedu.fedu.utils.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    boolean existsByEmail(String email);

    Optional<UserAccount> findByEmail(String email);

    @Query("select ur.role.roleName from UserRole ur where ur.userAccount.userId = :userId")
    List<String> findAllRoleByUserId(long userId);

    List<UserAccount> findAll();

    List<UserAccount> findAllByStatus(UserStatus status);

    @Query("SELECT COUNT(DISTINCT ur.userAccount) FROM UserRole ur WHERE ur.role.roleName = :role AND ur.userAccount.isDeleted = false AND ur.userAccount.status = :status")
    long countByRoleAndStatus(UserRole role, UserStatus status);
}
