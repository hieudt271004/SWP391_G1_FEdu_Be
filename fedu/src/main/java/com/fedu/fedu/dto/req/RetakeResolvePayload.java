package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.RetakeRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RetakeResolvePayload {

    @NotNull(message = "status is required")
    private RetakeRequestStatus status;

    private String rejectReason;
}
