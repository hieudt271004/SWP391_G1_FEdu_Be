package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum Gender {

    @JsonProperty("MALE")
    MALE,

    @JsonProperty("FEMALE")
    FEMALE,

    @JsonProperty("OTHER")
    OTHER;
}
