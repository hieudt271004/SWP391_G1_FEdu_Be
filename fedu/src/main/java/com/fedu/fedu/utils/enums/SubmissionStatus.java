package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum SubmissionStatus {
    @JsonProperty("PENDING")
    PENDING,

    @JsonProperty("SUBMITTED")
    SUBMITTED,

    @JsonProperty("LATE")
    LATE,

    @JsonProperty("GRADED")
    GRADED
}
