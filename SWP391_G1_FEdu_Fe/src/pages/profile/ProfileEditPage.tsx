import { useState, useEffect } from 'react';
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
import { User as UserIcon, Camera, Phone, Mail, Calendar, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Gender } from '../../types/user';
import { http } from '../../services/http';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";

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
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  
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
      setCustomAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
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
  };

  const handleCancel = () => {
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
  };

  const handleSelectPresetAvatar = (url: string) => {
    setProfileData((prev) => ({ ...prev, avatarUrl: url }));
    setIsAvatarModalOpen(false);
    toast.success('Đã chọn ảnh đại diện mẫu!');
  };

  const handleApplyCustomAvatar = () => {
    if (customAvatarUrl.trim()) {
      setProfileData((prev) => ({ ...prev, avatarUrl: customAvatarUrl }));
      setIsAvatarModalOpen(false);
      toast.success('Đã áp dụng ảnh đại diện tự chọn!');
    } else {
      toast.error('Vui lòng nhập đường dẫn ảnh hợp lệ');
    }
  };

  const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
  const initials = fullName ? ((profileData.firstName[0] || '') + (profileData.lastName[0] || '')).toUpperCase() : '??';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in transition-all duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Column - Profile Overview */}
        <div className="md:col-span-1 rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 -z-10" />
          
          <div className="relative group mt-4 cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
            <Avatar className="size-28 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={profileData.avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Camera className="text-white size-6" />
            </div>
          </div>
          
          <h2 className="mt-4 text-xl font-bold text-slate-800">{fullName || 'Giảng viên'}</h2>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5"><Mail className="size-4" />{profileData.email}</p>
          
          <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
            Giảng viên
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAvatarModalOpen(true)}
            className="mt-6 w-full py-2 bg-white/50 border-slate-200 hover:bg-slate-50 text-slate-600 transition-all font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Camera className="size-3.5" /> Thay đổi ảnh
          </Button>
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
                  disabled={loading}
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
                  disabled={loading}
                >
                  Khôi phục
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Selection Dialog */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Chọn ảnh đại diện</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Chọn một trong các ảnh đại diện mẫu dưới đây hoặc nhập URL ảnh tùy chỉnh.
            </DialogDescription>
          </DialogHeader>

          {/* Grid of Preset Avatars */}
          <div className="grid grid-cols-3 gap-4 my-6">
            {PRESET_AVATARS.map((avatar) => (
              <div 
                key={avatar.name} 
                onClick={() => handleSelectPresetAvatar(avatar.url)}
                className={`group cursor-pointer rounded-xl border p-2 flex flex-col items-center hover:border-indigo-500 hover:bg-indigo-50/10 transition-all ${
                  profileData.avatarUrl === avatar.url ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100'
                }`}
              >
                <Avatar className="size-16 transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={avatar.url} alt={avatar.name} />
                  <AvatarFallback className="text-xs">{avatar.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xxs font-bold text-slate-600 mt-2">{avatar.name}</span>
              </div>
            ))}
          </div>

          {/* Custom Avatar URL Field */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Label htmlFor="customAvatarUrl" className="text-xs font-semibold text-slate-600">Đường dẫn ảnh tùy chỉnh (Avatar URL)</Label>
            <div className="flex gap-2">
              <Input
                id="customAvatarUrl"
                type="url"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 rounded-xl border-slate-200 text-xs py-2"
              />
              <Button 
                onClick={handleApplyCustomAvatar}
                className="rounded-xl text-xs py-2 px-4 text-white"
                style={{ background: "#4338ca" }}
              >
                Áp dụng
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl text-xs font-semibold text-slate-500">Đóng</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
