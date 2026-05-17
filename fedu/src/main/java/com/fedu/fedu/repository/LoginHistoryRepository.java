package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LoginHistory;
import com.fedu.fedu.entity.UserAccount;
import org.apache.catalina.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    Optional<LoginHistory> findByUserAccount(UserAccount account);
}
