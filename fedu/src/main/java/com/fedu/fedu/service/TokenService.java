package com.fedu.fedu.service;

import com.fedu.fedu.entity.UserAccount;
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

    public void saveLoginTokens(UserAccount user, String accessToken, String refreshToken) {
        Token t = tokenRepository.findByUserAccount_Email(user.getEmail())
                .orElseGet(() -> Token.builder().userAccount(user).build());
        t.setAccessToken(accessToken);
        t.setRefreshToken(refreshToken);
        tokenRepository.save(t);
    }
    public void saveResetToken(UserAccount user, String resetToken) {
        Token t = tokenRepository.findByUserAccount_Email(user.getEmail())
                .orElseGet(() -> Token.builder().userAccount(user).build());
        t.setResetToken(resetToken);
        tokenRepository.save(t);
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

    public boolean isAccessTokenActive(String email, String accessToken) {
        return tokenRepository.findByUserAccount_Email(email)
                .map(t -> accessToken.equals(t.getAccessToken()))
                .orElse(false);
    }
}
