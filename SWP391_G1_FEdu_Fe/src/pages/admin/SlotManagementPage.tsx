import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { slotService, SlotResponse } from "../../services/slot.service";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export function SlotManagementPage() {
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | null>(null);

  const [slotName, setSlotName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<SlotResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await slotService.adminGetSlots();
      setSlots(res || []);
    } catch (e: any) {
      setError(e.message || "Không thể tải danh sách ca học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedSlot(null);
    setSlotName("");
    setStartTime("");
    setEndTime("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slot: SlotResponse) => {
    setModalMode("edit");
    setSelectedSlot(slot);
    setSlotName(slot.slotName);
    setStartTime(slot.startTime.substring(0, 5));
    setEndTime(slot.endTime.substring(0, 5));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotName.trim()) {
      setFormError("Tên ca học không được để trống");
      return;
    }
    if (!startTime || !endTime) {
      setFormError("Giờ bắt đầu và kết thúc không được để trống");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      
      const payload = {
        slotName,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      };

      if (modalMode === "create") {
        await slotService.adminCreateSlot(payload);
      } else {
        if (selectedSlot) {
          await slotService.adminUpdateSlot(selectedSlot.slotId, payload);
        }
      }

      setIsModalOpen(false);
      fetchSlots();
    } catch (e: any) {
      setFormError(e.message || "Có lỗi xảy ra khi lưu ca học");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (slot: SlotResponse) => {
    setSlotToDelete(slot);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!slotToDelete) return;
    try {
      setDeleting(true);
      await slotService.adminDeleteSlot(slotToDelete.slotId);
      setIsDeleteOpen(false);
      fetchSlots();
    } catch (e: any) {
      alert(e.message || "Không thể xóa ca học này");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground bg-background">
      {}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý ca học</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Quản trị viên</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-foreground font-semibold">Quản lý ca học</span>
        </div>
      </div>

      {}
      <div className="flex items-center justify-end">
        <Button onClick={openCreateModal} className="gap-2 h-9 text-xs font-semibold">
          <Plus className="w-4 h-4" /> Thêm ca học
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 text-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchSlots} className="ml-auto text-destructive hover:bg-destructive/20">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Đang tải danh sách ca học...</span>
        </div>
      ) : slots.length === 0 ? (
        <Card className="border-dashed border-2 py-16 flex flex-col items-center justify-center text-center">
          <CardContent className="space-y-4">
            <div className="bg-accent/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Chưa có ca học nào</h3>
              <p className="text-sm text-muted-foreground">Hãy bắt đầu bằng việc tạo ca học đầu tiên.</p>
            </div>
            <Button onClick={openCreateModal} variant="outline" className="mt-2">
              Tạo ca học ngay
            </Button>
          </CardContent>
        </Card>
      ) : (
        
        <div className="overflow-hidden bg-card text-card-foreground border border-border rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary text-primary-foreground border-b border-border">
                  {["ID", "TÊN CA HỌC", "GIỜ BẮT ĐẦU", "GIỜ KẾT THÚC", "HÀNH ĐỘNG"].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-primary-foreground ${
                        h === "HÀNH ĐỘNG" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slots.map((slot) => (
                  <tr
                    key={slot.slotId}
                    className="hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-6 py-4.5 font-semibold text-muted-foreground text-sm">#{slot.slotId}</td>
                    <td className="px-6 py-4.5 font-semibold text-foreground text-sm">{slot.slotName}</td>
                    <td className="px-6 py-4.5 text-muted-foreground text-sm">{slot.startTime.substring(0, 5)}</td>
                    <td className="px-6 py-4.5 text-muted-foreground text-sm">{slot.endTime.substring(0, 5)}</td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent"
                          onClick={() => openEditModal(slot)}
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(slot)}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {modalMode === "create" ? "Thêm ca học mới" : "Chỉnh sửa ca học"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Nhập tên ca học và khung giờ bắt đầu, kết thúc tương ứng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-lg flex items-center gap-2 border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="slotName" className="text-sm font-semibold text-primary">
                Tên ca học
              </Label>
              <Input
                id="slotName"
                placeholder="Ví dụ: Slot 1, Ca sáng 1..."
                value={slotName}
                onChange={(e) => setSlotName(e.target.value)}
                className="bg-background border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-semibold text-primary">
                  Giờ bắt đầu
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-background border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-semibold text-primary">
                  Giờ kết thúc
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-background border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu lại</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Xác nhận xóa ca học?</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              Hành động này không thể hoàn tác. Các bài học đã xếp vào ca học <strong className="text-primary font-semibold">"{slotToDelete?.slotName}"</strong> sẽ bị hủy liên kết ca học.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-border gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <span>Đồng ý xóa</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
