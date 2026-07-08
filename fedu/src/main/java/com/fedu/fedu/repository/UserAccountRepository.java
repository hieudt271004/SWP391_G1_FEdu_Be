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
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndUserIdNot(String phone, long userId);

    Optional<UserAccount> findByEmail(String email);

    @Query("select ur.role.roleName from UserRole ur where ur.userAccount.userId = :userId")
    List<UserRole> findAllRoleByUserId(long userId);

    List<UserAccount> findAll();

    // Fetch-join roles để tránh N+1 (userRoles là EAGER nên findAll() bắn 1 query/user)
    @Query("select distinct u from UserAccount u left join fetch u.userRoles ur left join fetch ur.role")
    List<UserAccount> findAllWithRoles();

    List<UserAccount> findAllByStatus(UserStatus status);

    @Query("SELECT COUNT(DISTINCT ur.userAccount) FROM UserRole ur WHERE ur.role.roleName = :role AND ur.userAccount.isDeleted = false AND ur.userAccount.status = :status")
    long countByRoleAndStatus(UserRole role, UserStatus status);
}
