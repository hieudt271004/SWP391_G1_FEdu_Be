package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum SupportTicketStatus {

    
    @JsonProperty("NONE")
    NONE,

    
    @JsonProperty("DONE")
    DONE,

    
    @JsonProperty("SEND")
    SEND
}
