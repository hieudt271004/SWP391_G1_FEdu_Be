import { useState, useEffect, useRef } from "react";
import { X, Loader2, Upload, Trash2, Calendar, Phone, Mail, User, Shield, Info } from "lucide-react";
import { adminService } from "../../services/admin.service";
import { uploadService } from "../../services/upload.service";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

interface AdminUser {
  id?: number;
  name: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  role: string;
  status: "active" | "inactive";
  avatar: string;
  avatarUrl?: string;
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AdminUser | null;
  mode: "add" | "edit";
  onSuccess?: () => void;
}

export function UserDetailModal({ isOpen, onClose, user, mode, onSuccess }: UserDetailModalProps) {
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string;
    role: string;
    status: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth: string; 
  }>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    avatarUrl: "",
    role: "STUDENT",
    status: "ACTIVE",
    gender: "OTHER",
    dateOfBirth: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && user) {
        
        const rawGender = user.gender ? user.gender.toUpperCase() : "OTHER";
        const normalizedGender = (rawGender === "MALE" || rawGender === "FEMALE" || rawGender === "OTHER") 
          ? rawGender 
          : "OTHER";

        
        let dateOfBirthVal = "";
        if (user.dateOfBirth && user.dateOfBirth !== "—") {
          const parts = user.dateOfBirth.split("/");
          if (parts.length === 3) {
            dateOfBirthVal = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          } else {
            
            const dashParts = user.dateOfBirth.split("-");
            if (dashParts.length === 3) {
              dateOfBirthVal = user.dateOfBirth;
            }
          }
        }

        
        const cleanPhone = user.phone === "—" ? "" : user.phone || "";

        setFormData({
          email: user.email || "",
          password: "",
          firstName: user.name ? user.name.split(" ")[0] : "",
          lastName: user.name ? user.name.split(" ").slice(1).join(" ") : "",
          phone: cleanPhone,
          avatarUrl: user.avatarUrl || "",
          role: (user.role === "Giảng viên" || user.role === "TEACHER") ? "TEACHER" : (user.role === "ADMIN" || user.role === "Admin") ? "ADMIN" : "STUDENT",
          status: user.status === "inactive" ? "INACTIVE" : "ACTIVE",
          gender: normalizedGender,
          dateOfBirth: dateOfBirthVal,
        });
      } else {
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          avatarUrl: "",
          role: "STUDENT",
          status: "ACTIVE",
          gender: "OTHER",
          dateOfBirth: "",
        });
      }
      setError(null);
    }
  }, [isOpen, user, mode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      setError("Chỉ chấp nhận tệp hình ảnh (.jpg, .jpeg, .png, .webp).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const result = await uploadService.uploadToCloudinary(file, "avatars");
      setFormData((prev) => ({ ...prev, avatarUrl: result.url }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      
      let mappedBod: string | undefined = undefined;
      if (formData.dateOfBirth) {
        const parts = formData.dateOfBirth.split("-");
        if (parts.length === 3) {
          mappedBod = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      if (mode === "add") {
        await adminService.createUser({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          avatarUrl: formData.avatarUrl || undefined,
          status: formData.status as "ACTIVE" | "INACTIVE" | "NONE",
          userRole: formData.role,
        });
        toast.success(`Đã thêm mới người dùng "${formData.firstName} ${formData.lastName}" thành công.`);
      } else {
        if (!user || !user.id) {
          throw new Error("Không tìm thấy thông tin người dùng cần cập nhật");
        }

        await adminService.updateUser(user.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          gender: formData.gender,
          bod: mappedBod,
          avatarUrl: formData.avatarUrl || undefined,
          status: formData.status as "ACTIVE" | "INACTIVE" | "NONE",
          userRole: formData.role,
        });
        toast.success(`Đã cập nhật thông tin người dùng "${formData.firstName} ${formData.lastName}" thành công.`);
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  
  const initials = ((formData.firstName[0] || "") + (formData.lastName[0] || "")).toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-2xl bg-card text-card-foreground border border-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans animate-in fade-in-50 zoom-in-95 duration-200">
        
        {}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {mode === "add" ? "Thêm người dùng mới" : "Chỉnh sửa thông tin"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "add" ? "Tạo tài khoản học viên, giảng viên hoặc admin mới" : "Cập nhật thông tin cá nhân và vai trò người dùng"}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={submitting || uploading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {}
        <form id="userDetailForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg animate-in fade-in slide-in-from-top-1">
              <X className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {}
          <div className="space-y-6">
            
            {}
            <div className="bg-accent/30 rounded-lg p-5 border border-border/40 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group w-20 h-20 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center border border-border shadow-sm">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">{initials}</span>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="text-[10px] text-white font-medium">Đang tải...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Ảnh đại diện</h4>
                <p className="text-xs text-muted-foreground">Chấp nhận JPG, PNG dung lượng dưới 5MB</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Tải ảnh lên
                  </button>
                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all duration-200 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Gỡ bỏ
                    </button>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Địa chỉ Email <span className="text-destructive">*</span>
              </label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="example@email.com" 
                required
                disabled={mode === "edit"}
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-input-background text-foreground border border-border/80 rounded-lg text-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  First Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Họ và chữ đệm"
                  required
                  autoComplete="given-name"
                  className="w-full px-4 py-2.5 bg-input-background text-foreground border border-border/80 rounded-lg text-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Last Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Tên"
                  required
                  autoComplete="family-name"
                  className="w-full px-4 py-2.5 bg-input-background text-foreground border border-border/80 rounded-lg text-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none"
                />
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+84 123 456 789"
                  autoComplete="tel"
                  className="w-full px-4 py-2.5 bg-input-background text-foreground border border-border/80 rounded-lg text-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Giới tính
                </label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => handleChange("gender", val)}
                >
                  <SelectTrigger className="w-full h-10 bg-input-background border-border text-foreground">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className="w-full px-4 py-2.5 bg-input-background text-foreground border border-border/80 rounded-lg text-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  Mật khẩu {mode === "add" && <span className="text-destructive">*</span>}
                </label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={mode === "add" ? "Tối thiểu 8 ký tự" : "Bỏ trống nếu không đổi"} 
                  required={mode === "add"}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 bg-input-background text-foreground border border-border/80 rounded-lg text-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none"
                />
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Role (Vai trò)</label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => handleChange("role", val)}
                >
                  <SelectTrigger className="w-full h-10 bg-input-background border-border text-foreground">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="STUDENT">Học viên</SelectItem>
                    <SelectItem value="TEACHER">Giảng viên</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Status (Trạng thái)</label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleChange("status", val)}
                >
                  <SelectTrigger className="w-full h-10 bg-input-background border-border text-foreground">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ACTIVE">Hoạt động (ACTIVE)</SelectItem>
                    <SelectItem value="INACTIVE">Ngưng (INACTIVE)</SelectItem>
                    <SelectItem value="NONE">Khác (NONE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "add" && (
              <div className="flex gap-2.5 p-4 rounded-lg bg-accent/40 border border-border/30 text-xs text-muted-foreground mt-4">
                <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <p>
                  <strong>Lưu ý:</strong> API backend hiện không nhận dữ liệu giới tính và ngày sinh khi <em>tạo mới</em> tài khoản. Các trường này sẽ được cập nhật khi chỉnh sửa thông tin của người dùng.
                </p>
              </div>
            )}
          </div>
        </form>

        {}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-accent/20">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || uploading}
            className="px-5 py-2.5 text-sm font-semibold border border-border bg-card hover:bg-accent text-foreground rounded-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            form="userDetailForm"
            disabled={submitting || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
          >
            {(submitting || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "add" ? "Thêm người dùng" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}