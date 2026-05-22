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

    // lấy token bằng email ở user account
    public Token getByEmail(String email) {
        return tokenRepository.findByUserAccount_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("Not found token"));
    }

    // lưu token cho user
    public long save(Token token) {
        Optional<Token> optional = tokenRepository.findByUserAccount_Email(token.getUserAccount().getEmail());
        // chưa có token
        if (optional.isEmpty()) {
            tokenRepository.save(token);
            return token.getId();
        }
        // nếu user đã có token
        else {
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

    // xóa cứng token bằng email
    public void delete(String email) {
        Token token = getByEmail(email);
        tokenRepository.delete(token);
    }

    public void clearResetToken(String username) {
        Token token = tokenRepository.findByUserAccount_Email(username)
                .orElse(null);
        if (token != null) {
            token.setResetToken(null);
            tokenRepository.save(token);
        }
    }

    // kiểm tra tồn tại token bằng id
    public boolean isExists(long id) {
        if (!tokenRepository.existsById(id)) {
            throw new InvalidDataException("Token not exists");
        }
        return true;
    }
}
