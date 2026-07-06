import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Info, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { studentService, StudentScheduleEntry } from "../../services/student.service";
import { slotService, SlotResponse } from "../../services/slot.service";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

export function StudentSchedulePage() {
  const [schedule, setSchedule] = useState<StudentScheduleEntry[]>([]);
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current week state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Fetch slots and schedule
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [slotsRes, scheduleRes] = await Promise.all([
        slotService.getAllSlots(),
        studentService.getStudentSchedule(),
      ]);
      setSlots(slotsRes || []);
      setSchedule(scheduleRes || []);
    } catch (e: any) {
      setError(e.response?.data?.message || "Không thể tải thời khóa biểu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: Get start and end of week for a given date (Monday to Sunday)
  const getWeekDays = (date: Date) => {
    const currentDay = date.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(date);
    monday.setDate(date.getDate() + distanceToMonday);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const temp = new Date(monday);
      temp.setDate(monday.getDate() + i);
      weekDays.push(temp);
    }
    return weekDays;
  };

  const weekDays = getWeekDays(currentDate);
  const startOfWeek = weekDays[0];
  const endOfWeek = weekDays[6];

  const navigateWeek = (direction: "prev" | "next") => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(nextDate);
  };

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatDateYear = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDayName = (dayIndex: number) => {
    const names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
    return names[dayIndex];
  };

  // Check if two dates are same day
  const isSameDay = (d1: Date, dateStr: string) => {
    const d2 = new Date(dateStr);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Get nodes scheduled in a specific slot and day
  const getEntriesForCell = (day: Date, slotId: number) => {
    return schedule.filter(
      (entry) => entry.slotId === slotId && isSameDay(day, entry.studyDate)
    );
  };

  const statusBadge = (status: StudentScheduleEntry["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-1 py-0 hover:bg-emerald-500/15">Hoàn thành</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] px-1 py-0 hover:bg-amber-500/15">Đang học</Badge>;
      case "OPEN":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] px-1 py-0 hover:bg-blue-500/15">Sẵn sàng</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground text-[10px] px-1 py-0">Chưa mở</Badge>;
    }
  };

  const getTimeStatusBadge = (studyDate: string | undefined, startTime: string | undefined, endTime: string | undefined) => {
    if (!studyDate || !startTime || !endTime) {
      return <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full border border-border">Chưa xếp lịch</Badge>;
    }
    try {
      const now = new Date();
      const startStr = `${studyDate}T${startTime.substring(0, 5)}:00`;
      const endStr = `${studyDate}T${endTime.substring(0, 5)}:00`;
      
      const startTimeObj = new Date(startStr);
      const endTimeObj = new Date(endStr);
      
      if (isNaN(startTimeObj.getTime()) || isNaN(endTimeObj.getTime())) {
        return <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full border border-border">Chưa xếp lịch</Badge>;
      }
      
      if (now < startTimeObj) {
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Chưa bắt đầu</Badge>;
      } else if (now >= startTimeObj && now <= endTimeObj) {
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-250 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">Đang diễn ra</Badge>;
      } else {
        return <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Đã kết thúc</Badge>;
      }
    } catch (e) {
      return <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full border border-border">Lỗi lịch học</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Thời khóa biểu</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi tất cả lịch học trên lớp của các lớp môn học bạn đang tham gia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-sm font-semibold bg-card text-primary shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatDateYear(startOfWeek)} - {formatDateYear(endOfWeek)}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateWeek("next")} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 text-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">Đang tải lịch học của bạn...</p>
        </div>
      ) : slots.length === 0 ? (
        <Card className="border-dashed border-2 py-16 flex flex-col items-center justify-center text-center">
          <CardContent className="space-y-3">
            <div className="bg-accent/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Chưa có ca học nào trên hệ thống</h3>
              <p className="text-sm text-muted-foreground">Lịch học của bạn sẽ hiển thị sau khi Admin cài đặt ca học.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Calendar Grid Desktop */}
          <div className="hidden lg:block overflow-x-auto border border-border rounded-lg bg-card shadow-sm">
            <div className="grid grid-cols-8 border-b border-border bg-accent/40 text-center font-semibold text-sm min-w-[1000px]">
              <div className="py-4 border-r border-border text-primary font-bold">Ca / Giờ</div>
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`py-3 border-r border-border last:border-r-0 flex flex-col items-center justify-center gap-0.5 ${
                    new Date().toDateString() === day.toDateString()
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="font-bold text-primary">{getDayName(idx)}</span>
                  <span className="text-xs font-medium">{formatDateLabel(day)}</span>
                </div>
              ))}
            </div>

            {slots.map((slot) => (
              <div key={slot.slotId} className="grid grid-cols-8 border-b border-border last:border-b-0 min-h-[140px] min-w-[1000px]">
                {/* Slot Details Column */}
                <div className="p-3 border-r border-border bg-accent/20 flex flex-col justify-center gap-1 text-center">
                  <span className="font-bold text-sm text-primary">{slot.slotName}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                  </span>
                </div>

                {/* Days Columns */}
                {weekDays.map((day, idx) => {
                  const cellEntries = getEntriesForCell(day, slot.slotId);
                  const isConflict = cellEntries.length > 1;

                  return (
                    <div
                      key={idx}
                      className={`p-2 border-r border-border last:border-r-0 flex flex-col gap-2 relative ${
                        isConflict ? "bg-red-50/50 dark:bg-red-950/20" : ""
                      } ${
                        new Date().toDateString() === day.toDateString()
                          ? "bg-primary/[0.02]"
                          : ""
                      }`}
                    >
                      {/* Conflict Warnings */}
                      {isConflict && (
                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200 dark:border-red-800">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>Trùng lịch ca học!</span>
                        </div>
                      )}

                      {cellEntries.map((entry) => (
                        <div
                          key={entry.nodeId}
                          className={`flex flex-col gap-1.5 p-2 rounded-md border text-left bg-background shadow-xs hover:shadow-md transition-shadow ${
                            isConflict
                              ? "border-red-300 dark:border-red-800 ring-1 ring-red-300 dark:ring-red-800"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase tracking-wider">
                              {entry.subjectCode} - {entry.className}
                            </span>
                            <span className="text-xs font-bold text-primary line-clamp-2 leading-tight">
                              {entry.title}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {entry.description}
                          </p>
                          <div className="flex items-center pt-1 mt-auto border-t border-dashed border-border">
                            {getTimeStatusBadge(entry.studyDate, entry.startTime, entry.endTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Calendar List View Mobile / Tablet */}
          <div className="lg:hidden space-y-4">
            {weekDays.map((day, idx) => {
              const daySchedule = schedule.filter((entry) => isSameDay(day, entry.studyDate));
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <Card key={idx} className={`border ${isToday ? "border-primary bg-primary/[0.01]" : "border-border bg-card"}`}>
                  <CardHeader className="py-3 px-4 border-b border-border bg-accent/15 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                      <span className="font-extrabold">{getDayName(idx)}</span>
                      <span className="text-xs font-normal text-muted-foreground">({formatDateYear(day)})</span>
                    </CardTitle>
                    {isToday && <Badge className="bg-primary text-primary-foreground text-[10px]">Hôm nay</Badge>}
                  </CardHeader>
                  <CardContent className="p-3 divide-y divide-border/60">
                    {daySchedule.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">Không có lịch học</p>
                    ) : (
                      daySchedule.map((entry) => {
                        const clashes = daySchedule.filter((e) => e.slotId === entry.slotId);
                        const isConflict = clashes.length > 1;

                        return (
                          <div key={entry.nodeId} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
                                  {entry.slotName}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-medium font-mono">
                                  {entry.startTime?.substring(0, 5)} - {entry.endTime?.substring(0, 5)}
                                </span>
                              </div>
                              {getTimeStatusBadge(entry.studyDate, entry.startTime, entry.endTime)}
                            </div>

                            {isConflict && (
                              <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/35 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 dark:border-red-800 w-fit">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>Trùng lịch ca học!</span>
                              </div>
                            )}

                            <div>
                              <h4 className="text-xs font-bold font-mono text-muted-foreground uppercase">
                                {entry.subjectCode} - {entry.subjectName} ({entry.className})
                              </h4>
                              <p className="text-sm font-semibold text-primary mt-0.5">{entry.title}</p>
                              {entry.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {entry.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
