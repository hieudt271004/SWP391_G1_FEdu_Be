import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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

  // Sync profile data when user context is loaded
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

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Định dạng tệp không hợp lệ. Chỉ chấp nhận PNG, JPEG, JPG, WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (5MB)
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
        
        {/* Left Column - Profile Overview */}
        <div className="md:col-span-1 rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 -z-10" />
          
          <div 
            className="relative group mt-4 cursor-pointer" 
            onClick={() => !isUploading && !loading && fileInputRef.current?.click()}
          >
            <Avatar className="size-28 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={profileData.avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isUploading ? (
              <div className="absolute inset-0 bg-white/80 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-md">
                <Loader2 className="size-8 text-indigo-600 animate-spin" />
                <span className="text-[10px] font-bold text-slate-500 mt-1">Đang tải...</span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="text-white size-6" />
              </div>
            )}
          </div>
          
          <h2 className="mt-4 text-xl font-bold text-slate-800">{fullName || roleName}</h2>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5"><Mail className="size-4" />{profileData.email}</p>
          
          <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
            {roleName}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || loading}
            className="mt-6 w-full py-2 bg-white/50 border-slate-200 hover:bg-slate-50 text-slate-600 transition-all font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
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
          
          {/* Preset Avatars Selection */}
          <div className="mt-6 w-full pt-4 border-t border-slate-100/60">
            <p className="text-[10px] uppercase font-bold text-slate-400 text-left mb-3">Hoặc chọn ảnh đại diện mẫu</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  type="button"
                  key={avatar.name}
                  onClick={() => !isUploading && !loading && setProfileData((prev) => ({ ...prev, avatarUrl: avatar.url }))}
                  className={`group rounded-xl border p-1.5 flex flex-col items-center hover:border-indigo-500 hover:bg-indigo-50/10 transition-all ${
                    isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  } ${
                    profileData.avatarUrl === avatar.url ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100'
                  }`}
                  disabled={isUploading || loading}
                >
                  <Avatar className="size-9 transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={avatar.url} alt={avatar.name} />
                    <AvatarFallback className="text-[10px]">{avatar.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-bold text-slate-500 mt-1">{avatar.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Profile Details Form */}
        <Card className="md:col-span-2 rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
          <CardHeader className="border-b border-slate-100/50 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="size-5 text-indigo-500" /> Cập nhật thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-600 font-semibold text-xs">Tên (First Name) *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Nhập tên của bạn"
                    required
                    className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-600 font-semibold text-xs">Họ (Last Name) *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Nhập họ của bạn"
                    required
                    className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="email" className="text-slate-600 font-semibold text-xs flex items-center gap-1">
                  Địa chỉ Email <ShieldAlert className="size-3.5 text-amber-500" />
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-slate-50/50 pl-10 rounded-xl border-slate-100 text-slate-500 text-sm cursor-not-allowed py-2.5"
                  />
                </div>
                <p className="text-xxs text-slate-400">Email tài khoản không thể thay đổi</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-600 font-semibold text-xs">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Nhập số điện thoại"
                      className="pl-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-slate-600 font-semibold text-xs">Giới tính</Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) => handleInputChange('gender', value as Gender)}
                  >
                    <SelectTrigger id="gender" className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all py-2.5 text-sm">
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
                <Label htmlFor="bod" className="text-slate-600 font-semibold text-xs flex items-center gap-1">
                  <Calendar className="size-4 text-slate-400" /> Ngày sinh
                </Label>
                <Input
                  id="bod"
                  type="date"
                  value={profileData.bod}
                  onChange={(e) => handleInputChange('bod', e.target.value)}
                  className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all py-2.5 text-sm"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100/50">
                <Button 
                  type="submit" 
                  disabled={loading || isUploading}
                  className="flex-1 py-3 text-white transition-opacity hover:opacity-95 font-bold rounded-xl text-sm"
                  style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCancel} 
                  variant="outline" 
                  className="flex-1 py-3 border-slate-200 text-slate-500 font-bold rounded-xl text-sm"
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
