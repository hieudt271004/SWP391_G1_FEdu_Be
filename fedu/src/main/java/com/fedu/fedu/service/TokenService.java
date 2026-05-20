package com.fedu.fedu.service;

import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.entity.Token;
import com.fedu.fedu.repository.TokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final TokenRepository tokenRepository;

    public Token getByUsername(String username) {
        return tokenRepository.findByUserAccount_Email(username)
                .orElseThrow(() -> new ResourceNotFoundException("Not found token"));
    }

    public long save(Token token) {
        Optional<Token> optional = tokenRepository.findByUserAccount_Email(token.getUserAccount().getEmail());
        if (optional.isEmpty()) {
            tokenRepository.save(token);
            return token.getId();
        } else {
            Token t = optional.get();
            t.setAccessToken(token.getAccessToken());
            t.setRefreshToken(token.getRefreshToken());
            if (token.getResetToken() != null) {
                t.setResetToken(token.getResetToken());
            }
            tokenRepository.save(t);
            return t.getId();
        }
    }

    public void delete(String username) {
        Token token = getByUsername(username);
        tokenRepository.delete(token);
    }

    public boolean isExists(long id) {
        if (!tokenRepository.existsById(id)) {
            throw new InvalidDataException("Token not exists");
        }
        return true;
    }
}
