package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum NodeStatus {
    @JsonProperty("LOCKED")
    LOCKED,

    @JsonProperty("OPEN")
    OPEN,

    @JsonProperty("HIDDEN")
    HIDDEN
}
