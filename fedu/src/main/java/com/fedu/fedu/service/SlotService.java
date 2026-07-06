package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.SlotRequest;
import com.fedu.fedu.dto.res.SlotResponse;

import java.util.List;

public interface SlotService {
    List<SlotResponse> getAllSlots();
    SlotResponse getSlotById(Long id);
    SlotResponse createSlot(SlotRequest request);
    SlotResponse updateSlot(Long id, SlotRequest request);
    void deleteSlot(Long id);
}
