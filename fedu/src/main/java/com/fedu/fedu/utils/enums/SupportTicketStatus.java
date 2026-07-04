package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum SupportTicketStatus {

    /** Ticket mới, chưa được xử lý. */
    @JsonProperty("NONE")
    NONE,

    /** Sub-mentor hoặc giảng viên đã trả lời, ticket hoàn thành. */
    @JsonProperty("DONE")
    DONE,

    /** Sub-mentor leo thang lên giảng viên, chờ giảng viên xử lý. */
    @JsonProperty("SEND")
    SEND
}
