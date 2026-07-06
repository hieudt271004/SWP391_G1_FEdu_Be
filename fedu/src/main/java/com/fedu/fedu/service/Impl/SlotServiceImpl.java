package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.SlotRequest;
import com.fedu.fedu.dto.res.SlotResponse;
import com.fedu.fedu.entity.Slot;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.repository.SlotRepository;
import com.fedu.fedu.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotServiceImpl implements SlotService {

    private final SlotRepository slotRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SlotResponse> getAllSlots() {
        return slotRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SlotResponse getSlotById(Long id) {
        Slot slot = slotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca học với id: " + id));
        return mapToResponse(slot);
    }

    @Override
    @Transactional
    public SlotResponse createSlot(SlotRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new InvalidDataException("Giờ bắt đầu phải trước giờ kết thúc");
        }

        String trimmedName = request.getSlotName().trim();
        boolean nameExists = slotRepository.findAll().stream()
                .anyMatch(s -> s.getSlotName().equalsIgnoreCase(trimmedName));
        if (nameExists) {
            throw new InvalidDataException("Tên ca học '" + trimmedName + "' đã tồn tại");
        }

        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();
        boolean timeOverlap = slotRepository.findAll().stream()
                .anyMatch(s -> start.isBefore(s.getEndTime()) && s.getStartTime().isBefore(end));
        if (timeOverlap) {
            throw new InvalidDataException("Khung giờ của ca học bị trùng lặp với ca học khác đã có");
        }

        Slot slot = Slot.builder()
                .slotName(trimmedName)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        slotRepository.save(slot);
        return mapToResponse(slot);
    }

    @Override
    @Transactional
    public SlotResponse updateSlot(Long id, SlotRequest request) {
        Slot slot = slotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca học với id: " + id));

        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new InvalidDataException("Giờ bắt đầu phải trước giờ kết thúc");
        }

        String trimmedName = request.getSlotName().trim();
        boolean nameExists = slotRepository.findAll().stream()
                .anyMatch(s -> s.getSlotName().equalsIgnoreCase(trimmedName) && !s.getSlotId().equals(id));
        if (nameExists) {
            throw new InvalidDataException("Tên ca học '" + trimmedName + "' đã tồn tại");
        }

        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();
        boolean timeOverlap = slotRepository.findAll().stream()
                .anyMatch(s -> !s.getSlotId().equals(id) && start.isBefore(s.getEndTime()) && s.getStartTime().isBefore(end));
        if (timeOverlap) {
            throw new InvalidDataException("Khung giờ của ca học bị trùng lặp với ca học khác đã có");
        }

        slot.setSlotName(trimmedName);
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());

        slotRepository.save(slot);
        return mapToResponse(slot);
    }

    @Override
    @Transactional
    public void deleteSlot(Long id) {
        Slot slot = slotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca học với id: " + id));
        slotRepository.delete(slot);
    }

    private SlotResponse mapToResponse(Slot slot) {
        return SlotResponse.builder()
                .slotId(slot.getSlotId())
                .slotName(slot.getSlotName())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .build();
    }
}
