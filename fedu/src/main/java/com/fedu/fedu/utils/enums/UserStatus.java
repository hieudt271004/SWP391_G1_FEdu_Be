package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum UserStatus {

    @JsonProperty("ACTIVE")
    ACTIVE,

    @JsonProperty("INACTIVE")
    INACTIVE,

    @JsonProperty("NONE")
    NONE;
}
