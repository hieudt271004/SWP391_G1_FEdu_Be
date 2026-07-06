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

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | null>(null);

  const [slotName, setSlotName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete states
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
    <div className="space-y-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Header Breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#030213" }}>Quản lý ca học</h1>
        <div className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "#717182" }}>
          <span>Quản trị viên</span><ChevronRight className="w-4 h-4" />
          <span style={{ color: "#030213", fontWeight: 600 }}>Quản lý ca học</span>
        </div>
      </div>

      {/* Top Bar Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 text-white transition-colors hover:bg-[#1c1b2d] border-none cursor-pointer"
          style={{ backgroundColor: "#030213", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Thêm ca học
        </button>
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#030213" }} />
          <span style={{ marginLeft: "0.75rem", color: "#717182", fontWeight: 500 }}>Đang tải danh sách ca học...</span>
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
        /* List View: Bảng */
        <div className="overflow-hidden" style={{ backgroundColor: "white", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: "10px" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#030213", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  {["ID", "TÊN CA HỌC", "GIỜ BẮT ĐẦU", "GIỜ KẾT THÚC", "HÀNH ĐỘNG"].map((h) => (
                    <th
                      key={h}
                      style={{
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 650,
                        textTransform: "uppercase",
                        padding: "16px 24px",
                        textAlign: h === "HÀNH ĐỘNG" ? "right" : "left",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr
                    key={slot.slotId}
                    style={{
                      borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                      backgroundColor: "white",
                      fontSize: "0.875rem"
                    }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "#717182" }}>#{slot.slotId}</td>
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "#030213" }}>{slot.slotName}</td>
                    <td style={{ padding: "16px 24px", color: "#717182" }}>{slot.startTime.substring(0, 5)}</td>
                    <td style={{ padding: "16px 24px", color: "#717182" }}>{slot.endTime.substring(0, 5)}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(slot)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" style={{ color: "#717182" }} />
                        </button>
                        <button
                          onClick={() => confirmDelete(slot)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: "#991b1b" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
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

      {/* Delete Confirmation Dialog */}
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
