package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "permission_id")
    private long permissionId;

    @Column(name = "permission_name", nullable = false, unique = true)
    private String permissionName;

    @Column(name = "description", nullable = false)
    private String url;

}
