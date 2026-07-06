import { http } from './http';

export interface SlotResponse {
  slotId: number;
  slotName: string;
  startTime: string;
  endTime: string;
}

export interface SlotRequest {
  slotName: string;
  startTime: string;
  endTime: string;
}

export const slotService = {
  getAllSlots: () =>
    http.get<SlotResponse[]>('/public/slots'),

  adminGetSlots: () =>
    http.get<SlotResponse[]>('/admin/slots'),
  adminGetSlotById: (id: number) =>
    http.get<SlotResponse>(`/admin/slots/${id}`),
  adminCreateSlot: (request: SlotRequest) =>
    http.post<SlotResponse>('/admin/slots', request),
  adminUpdateSlot: (id: number, request: SlotRequest) =>
    http.put<SlotResponse>(`/admin/slots/${id}`, request),
  adminDeleteSlot: (id: number) =>
    http.delete<void>(`/admin/slots/${id}`),
};
