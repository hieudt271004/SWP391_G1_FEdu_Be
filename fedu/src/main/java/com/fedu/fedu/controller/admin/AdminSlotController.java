package com.fedu.fedu.controller.admin;

import com.fedu.fedu.dto.req.SlotRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.SlotResponse;
import com.fedu.fedu.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/slots")
@RequiredArgsConstructor
public class AdminSlotController {

    private final SlotService slotService;

    @GetMapping
    public ResponseData<List<SlotResponse>> getAllSlots() {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách ca học thành công", slotService.getAllSlots());
    }

    @GetMapping("/{id}")
    public ResponseData<SlotResponse> getSlotById(@PathVariable Long id) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy thông tin ca học thành công", slotService.getSlotById(id));
    }

    @PostMapping
    public ResponseData<SlotResponse> createSlot(@Valid @RequestBody SlotRequest request) {
        return new ResponseData<>(HttpStatus.CREATED.value(), "Tạo ca học thành công", slotService.createSlot(request));
    }

    @PutMapping("/{id}")
    public ResponseData<SlotResponse> updateSlot(@PathVariable Long id, @Valid @RequestBody SlotRequest request) {
        return new ResponseData<>(HttpStatus.OK.value(), "Cập nhật ca học thành công", slotService.updateSlot(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseData<Void> deleteSlot(@PathVariable Long id) {
        slotService.deleteSlot(id);
        return new ResponseData<>(HttpStatus.OK.value(), "Xóa ca học thành công");
    }
}
