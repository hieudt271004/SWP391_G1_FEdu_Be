package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum NodeTestKind {
    @JsonProperty("NONE")
    NONE,

    @JsonProperty("GATE")
    GATE,

    @JsonProperty("PLACEMENT")
    PLACEMENT
}
