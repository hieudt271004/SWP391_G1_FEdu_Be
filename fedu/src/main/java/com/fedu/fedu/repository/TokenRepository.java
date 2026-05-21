package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    Optional<Token> findByUserAccount_Email(String email);

    @Override
    boolean existsById(Long id);
}
