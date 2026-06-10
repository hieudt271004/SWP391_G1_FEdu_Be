package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum TicketLevel {
    @JsonProperty("SUB_MENTOR")
    SUB_MENTOR,

    @JsonProperty("LECTURER")
    LECTURER
}
