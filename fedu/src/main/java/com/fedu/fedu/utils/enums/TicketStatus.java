package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum TicketStatus {
    @JsonProperty("OPEN")
    OPEN,

    @JsonProperty("PROCESSING")
    PROCESSING,

    @JsonProperty("RESOLVED")
    RESOLVED,

    @JsonProperty("CLOSED")
    CLOSED
}
