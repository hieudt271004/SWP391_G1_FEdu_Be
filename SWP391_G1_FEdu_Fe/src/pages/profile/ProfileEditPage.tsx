import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { User as UserIcon, Camera, Phone, Mail, Calendar, UserCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Gender } from '../../types/user';
import { http } from '../../services/http';
import { toast } from 'sonner';
import { uploadService } from '../../services/upload.service';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  bod: string;
  avatarUrl: string;
}

const PRESET_AVATARS = [
  { name: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Aria', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
  { name: 'Jack', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
  { name: 'Lily', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily' },
  { name: 'Owen', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Owen' },
  { name: 'Zoe', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe' },
];

const convertDdMmYyyyToYyyyMmDd = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
};

const convertYyyyMmDdToDdMmYyyy = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return dateStr;
};

export function ProfileEditPage() {
  const { user, refetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'OTHER',
    bod: '',
    avatarUrl: '',
  });

  
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || 'OTHER',
        bod: convertDdMmYyyyToYyyyMmDd(user.bod),
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleInputChange = useCallback((field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Định dạng tệp không hợp lệ. Chỉ chấp nhận PNG, JPEG, JPG, WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadService.uploadToCloudinary(file, 'avatars');
      setProfileData((prev) => ({ ...prev, avatarUrl: result.url }));
      toast.success('Tải ảnh đại diện lên thành công!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Tải ảnh lên thất bại, vui lòng thử lại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleSaveChanges = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    setLoading(true);
    try {
      await http.put('/user/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        gender: profileData.gender,
        bod: convertYyyyMmDdToDdMmYyyy(profileData.bod),
        avatarUrl: profileData.avatarUrl,
      });

      await refetchUser();
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Cập nhật thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }, [profileData, refetchUser]);

  const handleCancel = useCallback(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || 'OTHER',
        bod: convertDdMmYyyyToYyyyMmDd(user.bod),
        avatarUrl: user.avatarUrl || '',
      });
      toast.info('Đã khôi phục các thay đổi');
    }
  }, [user]);

  const fullName = useMemo(() => `${profileData.firstName} ${profileData.lastName}`.trim(), [profileData.firstName, profileData.lastName]);
  const initials = useMemo(() => fullName ? ((profileData.firstName[0] || '') + (profileData.lastName[0] || '')).toUpperCase() : '??', [fullName, profileData.firstName, profileData.lastName]);
  
  const roleName = useMemo(() => {
    if (user?.roles.includes('TEACHER')) return 'Giảng viên';
    if (user?.roles.includes('STUDENT')) return 'Học viên';
    if (user?.roles.includes('ADMIN')) return 'Quản trị viên';
    return 'User';
  }, [user?.roles]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in transition-all duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {}
        <div className="md:col-span-1 rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary/5 to-secondary -z-10" />
          
          <div 
            className="relative group mt-4 cursor-pointer" 
            onClick={() => !isUploading && !loading && fileInputRef.current?.click()}
          >
            <Avatar className="size-28 border-4 border-background shadow-md transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={profileData.avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isUploading ? (
              <div className="absolute inset-0 bg-background/80 rounded-full flex flex-col items-center justify-center border-4 border-background shadow-md">
                <Loader2 className="size-8 text-primary animate-spin" />
                <span className="text-[10px] font-bold text-muted-foreground mt-1">Đang tải...</span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="text-white size-6" />
              </div>
            )}
          </div>
          
          <h2 className="mt-4 text-xl font-bold text-foreground">{fullName || roleName}</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Mail className="size-4" />{profileData.email}</p>
          
          <Badge variant="secondary" className="mt-4 px-3 py-1 rounded-full text-xs font-semibold">
            {roleName}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || loading}
            className="mt-6 w-full py-2 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Camera className="size-3.5" /> Thay đổi ảnh
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading || loading}
          />
          
          {}
          <div className="mt-6 w-full pt-4 border-t border-border">
            <p className="text-[10px] uppercase font-bold text-muted-foreground text-left mb-3">Hoặc chọn ảnh đại diện mẫu</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  type="button"
                  key={avatar.name}
                  onClick={() => !isUploading && !loading && setProfileData((prev) => ({ ...prev, avatarUrl: avatar.url }))}
                  className={`group rounded-xl border p-1.5 flex flex-col items-center hover:border-primary hover:bg-accent transition-all ${
                    isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  } ${
                    profileData.avatarUrl === avatar.url ? 'border-primary bg-accent' : 'border-border bg-transparent'
                  }`}
                  disabled={isUploading || loading}
                >
                  <Avatar className="size-9 transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={avatar.url} alt={avatar.name} />
                    <AvatarFallback className="text-[10px]">{avatar.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-bold text-muted-foreground mt-1">{avatar.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {}
        <Card className="md:col-span-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserCheck className="size-5 text-foreground" /> Cập nhật thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-muted-foreground font-semibold text-xs">Tên (First Name) *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Nhập tên của bạn"
                    required
                    className="rounded-xl transition-all py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-muted-foreground font-semibold text-xs">Họ (Last Name) *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Nhập họ của bạn"
                    required
                    className="rounded-xl transition-all py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="email" className="text-muted-foreground font-semibold text-xs flex items-center gap-1">
                  Địa chỉ Email <ShieldAlert className="size-3.5 text-amber-500" />
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-accent/40 pl-10 rounded-xl border-border text-muted-foreground text-sm cursor-not-allowed py-2.5"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Email tài khoản không thể thay đổi</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-muted-foreground font-semibold text-xs">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Nhập số điện thoại"
                      className="pl-10 rounded-xl transition-all py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-muted-foreground font-semibold text-xs">Giới tính</Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) => handleInputChange('gender', value as Gender)}
                  >
                    <SelectTrigger id="gender" className="rounded-xl transition-all py-2.5 text-sm">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="MALE">Nam (Male)</SelectItem>
                      <SelectItem value="FEMALE">Nữ (Female)</SelectItem>
                      <SelectItem value="OTHER">Khác (Other)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bod" className="text-muted-foreground font-semibold text-xs flex items-center gap-1">
                  <Calendar className="size-4 text-muted-foreground" /> Ngày sinh
                </Label>
                <Input
                  id="bod"
                  type="date"
                  value={profileData.bod}
                  onChange={(e) => handleInputChange('bod', e.target.value)}
                  className="rounded-xl transition-all py-2.5 text-sm"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-border">
                <Button 
                  type="submit" 
                  disabled={loading || isUploading}
                  className="flex-1 py-3 font-bold rounded-xl text-sm"
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCancel} 
                  variant="outline" 
                  className="flex-1 py-3 border-border text-muted-foreground font-bold rounded-xl text-sm"
                  disabled={loading || isUploading}
                >
                  Khôi phục
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
