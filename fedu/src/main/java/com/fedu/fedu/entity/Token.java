package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "tokens")
public class Token extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount userAccount;

    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "reset_token", columnDefinition = "TEXT")
    private String resetToken;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Builder.Default
    @Column(name = "is_revoked")
    private Boolean isRevoked = false;

}