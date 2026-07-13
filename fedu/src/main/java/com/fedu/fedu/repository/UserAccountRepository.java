package com.fedu.fedu.repository;

import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.utils.enums.UserStatus;
import com.fedu.fedu.utils.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    @Query("SELECT COUNT(u) > 0 FROM UserAccount u WHERE u.email = :email AND u.isDeleted = false")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT COUNT(u) > 0 FROM UserAccount u WHERE u.phone = :phone AND u.isDeleted = false")
    boolean existsByPhone(@Param("phone") String phone);

    @Query("SELECT COUNT(u) > 0 FROM UserAccount u WHERE u.phone = :phone AND u.userId <> :userId AND u.isDeleted = false")
    boolean existsByPhoneAndUserIdNot(@Param("phone") String phone, @Param("userId") long userId);

    @Query("SELECT u FROM UserAccount u WHERE u.email = :email AND u.isDeleted = false")
    Optional<UserAccount> findByEmail(@Param("email") String email);

    @Query("select ur.role.roleName from UserRole ur where ur.userAccount.userId = :userId")
    List<UserRole> findAllRoleByUserId(long userId);

    List<UserAccount> findAll();

    
    @Query("select distinct u from UserAccount u left join fetch u.userRoles ur left join fetch ur.role where u.isDeleted = false")
    List<UserAccount> findAllWithRoles();

    List<UserAccount> findAllByStatus(UserStatus status);

    @Query("SELECT COUNT(DISTINCT ur.userAccount) FROM UserRole ur WHERE ur.role.roleName = :role AND ur.userAccount.isDeleted = false AND ur.userAccount.status = :status")
    long countByRoleAndStatus(UserRole role, UserStatus status);
}
