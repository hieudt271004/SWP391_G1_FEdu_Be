package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum UserRole {

    @JsonProperty("ADMIN")
    ADMIN,

    @JsonProperty("TEACHER")
    TEACHER,

    @JsonProperty("STUDENT")
    STUDENT,

    @JsonProperty("USER")
    USER;
}

