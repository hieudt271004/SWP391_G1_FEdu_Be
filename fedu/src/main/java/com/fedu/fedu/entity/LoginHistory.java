package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(name = "login_history")
public class LoginHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "last_login")
    private LocalDate lastLogin;

    @OneToOne
    @JoinColumn(name = "user_id")
    private UserAccount userAccount;
}
