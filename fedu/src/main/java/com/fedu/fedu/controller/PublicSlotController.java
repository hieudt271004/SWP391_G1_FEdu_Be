package com.fedu.fedu.controller;

import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.SlotResponse;
import com.fedu.fedu.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/public/slots")
@RequiredArgsConstructor
public class PublicSlotController {

    private final SlotService slotService;

    @GetMapping
    public ResponseData<List<SlotResponse>> getAllSlots() {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách ca học thành công", slotService.getAllSlots());
    }
}
