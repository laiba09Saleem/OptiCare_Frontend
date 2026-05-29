import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User, Mail, Phone, Briefcase, Calendar,
    Edit3, Save, X, CheckCircle, Building2, Stethoscope,
    Sun, Moon, Sunset, PhoneCall, Clock, Video,
    FileText, AlertCircle, CheckCircle2, CalendarCheck,
    CalendarDays, ChevronLeft, ChevronRight, Bell,
    Plus, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface DoctorProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone: string;
    age: number;
    department: string;
    avatar_url: string;
    hospital_id: string;
    is_active: boolean;
    created_at: string;
}
interface Shift {
    id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    shift_type: "morning" | "evening" | "night" | "on-call";
}
interface Appointment {
    id: string;
    appointment_time: string;
    status: "scheduled" | "completed" | "cancelled" | "emergency";
    meeting_link: string | null;
    notes: string | null;
    patient_name: string;
    patient_age: number;
}

/* ─── Config ─── */
const AVATAR_GRADIENTS = [
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-500",
];

const SHIFT_CFG: Record<string, { icon: React.ElementType; label: string; gradient: string; badge: string }> = {
    morning: { icon: Sun, label: "Morning", gradient: "from-amber-400 to-orange-400", badge: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40" },
    evening: { icon: Sunset, label: "Evening", gradient: "from-orange-400 to-rose-400", badge: "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40" },
    night: { icon: Moon, label: "Night", gradient: "from-indigo-500 to-violet-600", badge: "text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/40" },
    "on-call": { icon: PhoneCall, label: "On-Call", gradient: "from-rose-500 to-pink-500", badge: "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/40" },
};

const APPT_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    scheduled: { label: "Scheduled", cls: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-900/40", icon: CalendarCheck },
    completed: { label: "Completed", cls: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", cls: "text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800", icon: AlertCircle },
    emergency: { label: "Emergency", cls: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40", icon: Bell },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const toYMD = (d: Date) => d.toISOString().slice(0, 10);

/* ─── Helpers ─── */
const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
    new Date(iso).toLocaleDateString("en-PK", opts);
const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
const DoctorProfile = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    /* Profile state */
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ full_name: "", phone: "", age: "", department: "" });

    /* Schedule state */
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingS, setLoadingS] = useState(true);
    const [loadingA, setLoadingA] = useState(true);

    /* Add Shift form state */
    const [showAddShift, setShowAddShift] = useState(false);
    const [addingShift, setAddingShift] = useState(false);
    const [shiftForm, setShiftForm] = useState({
        shift_date: toYMD(new Date()),
        start_time: "08:00",
        end_time: "16:00",
        shift_type: "morning" as "morning" | "evening" | "night" | "on-call",
    });

    /* Calendar state */
    const today = new Date();
    const [calDate, setCalDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDay, setSelectedDay] = useState(toYMD(today));

    /* Fetch everything */
    useEffect(() => {
        apiFetch<DoctorProfile>("/profile")
            .then(d => { setProfile(d); setForm({ full_name: d.full_name || "", phone: d.phone || "", age: d.age?.toString() || "", department: d.department || "" }); })
            .catch(() => toast({ title: "Error", description: "Could not load profile.", variant: "destructive" }))
            .finally(() => setLoading(false));

        apiFetch<Shift[]>("/schedule/shifts").then(setShifts).catch(() => setShifts([])).finally(() => setLoadingS(false));
        apiFetch<Appointment[]>("/schedule/appointments").then(setAppointments).catch(() => setAppointments([])).finally(() => setLoadingA(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch("/profile", {
                method: "PATCH",
                body: JSON.stringify({ full_name: form.full_name, phone: form.phone || null, age: form.age ? parseInt(form.age) : null, department: form.department || null }),
            });
            toast({ title: "✅ Saved", description: "Your profile has been updated." });
            setEditing(false);
            apiFetch<DoctorProfile>("/profile").then(setProfile);
        } catch { toast({ title: "Error", description: "Update failed.", variant: "destructive" }); }
        finally { setSaving(false); }
    };

    const handleAddShift = async () => {
        if (!shiftForm.shift_date || !shiftForm.start_time || !shiftForm.end_time) {
            toast({ title: "Missing fields", description: "Please fill in date and times.", variant: "destructive" });
            return;
        }
        setAddingShift(true);
        try {
            await apiFetch("/schedule/shifts", {
                method: "POST",
                body: JSON.stringify(shiftForm),
            });
            toast({ title: "✅ Shift Added", description: `Shift saved for ${shiftForm.shift_date}` });
            setShowAddShift(false);
            // Re-fetch shifts
            const updated = await apiFetch<Shift[]>("/schedule/shifts");
            setShifts(updated);
        } catch {
            toast({ title: "Error", description: "Could not add shift. Try again.", variant: "destructive" });
        } finally { setAddingShift(false); }
    };

    const handleDeleteShift = async (shiftId: string) => {
        try {
            await apiFetch(`/schedule/shifts/${shiftId}`, { method: "DELETE" });
            setShifts(prev => prev.filter(s => s.id !== shiftId));
            toast({ title: "Shift removed" });
        } catch {
            toast({ title: "Error", description: "Could not delete shift.", variant: "destructive" });
        }
    };

    /* Calendar computed */
    const shiftDates = new Set(shifts.map(s => s.shift_date?.slice(0, 10)));
    const apptDates = new Set(appointments.map(a => a.appointment_time?.slice(0, 10)));
    const year = calDate.getFullYear(), month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calCells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const dayShifts = shifts.filter(s => s.shift_date?.slice(0, 10) === selectedDay);
    const dayAppts = appointments.filter(a => a.appointment_time?.slice(0, 10) === selectedDay);
    const upcoming = appointments.filter(a => a.status === "scheduled" || a.status === "emergency");

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full border-4 border-brand border-t-transparent animate-spin" />
                <p className="text-muted-foreground">Loading profile…</p>
            </div>
        </div>
    );
    if (!profile) return null;

    const initials = profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const avatarGrad = AVATAR_GRADIENTS[(profile.full_name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
    const joinDate = fmtDate(profile.created_at, { year: "numeric", month: "long", day: "numeric" });

    return (
        <div className="min-h-screen py-10 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ══ HERO CARD ══ */}
                <Card className="overflow-hidden border-0 shadow-2xl">
                    {/* Gradient banner */}
                    <div className="h-40 w-full relative" style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 45%,#06b6d4 100%)" }}>
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)",
                            backgroundSize: "40px 40px",
                        }} />
                    </div>

                    <CardContent className="px-6 sm:px-8 pb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 mb-6">
                            {/* Avatar */}
                            <div className={`h-24 w-24 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-background flex-shrink-0`}>
                                {initials}
                            </div>
                            <div className="flex-1 pt-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-extrabold tracking-tight">{profile.full_name}</h1>
                                    {profile.is_active && (
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                            <CheckCircle className="h-3 w-3" /> Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-sm capitalize mt-0.5">
                                    {profile.role}{profile.department ? ` · ${profile.department}` : ""}
                                </p>
                            </div>
                            <Button onClick={() => setEditing(!editing)} variant={editing ? "outline" : "default"} className="gap-2 self-start sm:self-auto mt-2 sm:mt-0">
                                {editing ? <><X className="h-4 w-4" /> Cancel</> : <><Edit3 className="h-4 w-4" /> Edit Profile</>}
                            </Button>
                        </div>

                        {/* Quick-stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { icon: Mail, label: "Email", value: profile.email },
                                { icon: Phone, label: "Phone", value: profile.phone || "—" },
                                { icon: Briefcase, label: "Department", value: profile.department || "—" },
                                { icon: Calendar, label: "Joined", value: joinDate },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-muted/50 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                        <Icon className="h-3.5 w-3.5" />
                                        <span className="text-[10px] uppercase tracking-widest font-semibold">{label}</span>
                                    </div>
                                    <p className="text-sm font-semibold truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ══ EDIT FORM (conditional) ══ */}
                {editing && (
                    <Card className="shadow-xl border border-brand/20 animate-in slide-in-from-top-2 duration-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Edit3 className="h-4 w-4 text-brand" /> Edit Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="p-name">Full Name</Label>
                                    <Input id="p-name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. Muhammad Ali" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="p-phone">Phone</Label>
                                    <Input id="p-phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 1234567" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="p-age">Age</Label>
                                    <Input id="p-age" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="35" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="p-dept">Department / Specialization</Label>
                                    <Input id="p-dept" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Cardiology, Neurology…" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                                <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
                                    {saving ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ══ TABBED CONTENT ══ */}
                <Tabs defaultValue="overview">
                    <TabsList className="grid grid-cols-2 w-full max-w-xs">
                        <TabsTrigger value="overview">
                            <User className="h-4 w-4 mr-1.5" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="schedule">
                            <CalendarDays className="h-4 w-4 mr-1.5" /> My Schedule
                        </TabsTrigger>
                    </TabsList>

                    {/* ── OVERVIEW TAB ── */}
                    <TabsContent value="overview" className="mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="shadow-md">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                                        <Stethoscope className="h-4 w-4 text-violet-500" /> Professional Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-0 text-sm">
                                    {[
                                        { label: "Role", value: profile.role, cap: true },
                                        { label: "Department", value: profile.department || "—" },
                                        { label: "Hospital Ref", value: `…${profile.hospital_id.slice(-8)}` },
                                        { label: "Status", value: profile.is_active ? "Active" : "Inactive" },
                                    ].map(({ label, value, cap }) => (
                                        <div key={label} className="flex justify-between items-center py-2.5 border-b border-border/40 last:border-0">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className={`font-semibold ${cap ? "capitalize" : ""}`}>{value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="shadow-md">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                                        <Building2 className="h-4 w-4 text-cyan-500" /> Account Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-0 text-sm">
                                    {[
                                        { label: "Email", value: profile.email },
                                        { label: "Phone", value: profile.phone || "—" },
                                        { label: "Age", value: profile.age ? `${profile.age} years` : "—" },
                                        { label: "Member Since", value: joinDate },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center py-2.5 border-b border-border/40 last:border-0">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-semibold text-right max-w-[55%] truncate">{value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ── SCHEDULE TAB ── */}
                    <TabsContent value="schedule" className="mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                            {/* ── Mini Calendar ── */}
                            <div className="lg:col-span-2">
                                <Card className="shadow-xl overflow-hidden">
                                    {/* Month nav */}
                                    <div className="flex items-center justify-between px-5 py-3 border-b">
                                        <button onClick={() => setCalDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span className="font-bold text-sm">{MONTHS[month]} {year}</span>
                                        <button onClick={() => setCalDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <CardContent className="p-3">
                                        {/* Day headers */}
                                        <div className="grid grid-cols-7 mb-1">
                                            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
                                        </div>
                                        {/* Cells */}
                                        <div className="grid grid-cols-7 gap-y-1">
                                            {calCells.map((day, i) => {
                                                if (!day) return <div key={`e-${i}`} />;
                                                const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                                const isToday = ymd === toYMD(today);
                                                const isSelected = ymd === selectedDay;
                                                const hasShift = shiftDates.has(ymd);
                                                const hasAppt = apptDates.has(ymd);
                                                return (
                                                    <button key={ymd} onClick={() => setSelectedDay(ymd)}
                                                        className={[
                                                            "relative mx-auto flex flex-col items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all",
                                                            isSelected ? "text-white shadow-md scale-110" :
                                                                isToday ? "text-brand border border-brand/50" :
                                                                    "text-foreground hover:bg-muted",
                                                        ].join(" ")}
                                                        style={isSelected ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)" } : {}}
                                                    >
                                                        {day}
                                                        {(hasShift || hasAppt) && (
                                                            <span className="absolute -bottom-0.5 flex gap-0.5">
                                                                {hasShift && <span className="h-1 w-1 rounded-full bg-amber-400" />}
                                                                {hasAppt && <span className="h-1 w-1 rounded-full bg-sky-400" />}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {/* Legend */}
                                        <div className="flex gap-4 pt-3 mt-2 border-t text-[11px] text-muted-foreground">
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />Shift</span>
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" />Appointment</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary pills */}
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {[
                                        { label: "Shifts", value: shifts.length, color: "bg-amber-500" },
                                        { label: "Upcoming", value: upcoming.length, color: "bg-sky-500" },
                                        { label: "Completed", value: appointments.filter(a => a.status === "completed").length, color: "bg-emerald-500" },
                                        { label: "Emergency", value: appointments.filter(a => a.status === "emergency").length, color: "bg-rose-500" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="rounded-xl bg-muted/60 p-3 flex items-center gap-2">
                                            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${color}`} />
                                            <span className="text-sm font-bold">{value}</span>
                                            <span className="text-xs text-muted-foreground">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Day Detail Panel ── */}
                            <div className="lg:col-span-3 space-y-4">
                                {/* Selected day header */}
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60">
                                    <CalendarDays className="h-4 w-4 text-brand" />
                                    <span className="font-semibold text-sm">
                                        {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
                                    </span>
                                    {selectedDay === toYMD(today) && (
                                        <Badge className="ml-auto text-[10px] bg-brand/10 text-brand border-brand/30">TODAY</Badge>
                                    )}
                                </div>

                                {/* Shifts for this day */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Duty Shifts</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs gap-1 border-brand/40 text-brand hover:bg-brand/10"
                                            onClick={() => { setShowAddShift(v => !v); setShiftForm({ ...shiftForm, shift_date: selectedDay }); }}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {showAddShift ? "Cancel" : "Add Shift"}
                                        </Button>
                                    </div>

                                    {/* ─── Add Shift Inline Form ─── */}
                                    {showAddShift && (
                                        <div className="mb-3 p-4 rounded-xl border border-brand/20 bg-brand/5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            <p className="text-xs font-semibold text-brand">New Shift</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs">Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={shiftForm.shift_date}
                                                        min={toYMD(new Date())}
                                                        onChange={e => setShiftForm({ ...shiftForm, shift_date: e.target.value })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Start Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={shiftForm.start_time}
                                                        onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">End Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={shiftForm.end_time}
                                                        onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs">Shift Type</Label>
                                                    <select
                                                        value={shiftForm.shift_type}
                                                        onChange={e => setShiftForm({ ...shiftForm, shift_type: e.target.value as any })}
                                                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                                                    >
                                                        <option value="morning">☀️ Morning (8AM – 4PM)</option>
                                                        <option value="evening">🌅 Evening (4PM – 12AM)</option>
                                                        <option value="night">🌙 Night (12AM – 8AM)</option>
                                                        <option value="on-call">📞 On-Call</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleAddShift}
                                                disabled={addingShift}
                                                className="w-full h-8 text-sm gap-2"
                                            >
                                                {addingShift
                                                    ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : <Save className="h-3.5 w-3.5" />}
                                                Save Shift
                                            </Button>
                                        </div>
                                    )}

                                    {loadingS ? <Skeleton /> :
                                        dayShifts.length === 0 ? <EmptyDay icon={Clock} text="No shifts this day — add one above ↑" /> :
                                            <div className="space-y-2">
                                                {dayShifts.map(shift => {
                                                    const cfg = SHIFT_CFG[shift.shift_type] || SHIFT_CFG.morning;
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <div key={shift.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cfg.gradient} shadow`}>
                                                                <Icon className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-sm">{cfg.label} Shift</p>
                                                                <p className="text-xs text-muted-foreground">{shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}</p>
                                                            </div>
                                                            <Badge className={`text-xs capitalize ${cfg.badge}`}>{shift.shift_type}</Badge>
                                                            <button
                                                                onClick={() => handleDeleteShift(shift.id)}
                                                                className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                                                title="Delete shift"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>}
                                </div>

                                {/* Appointments for this day */}
                                <div>
                                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Appointments</p>
                                    {loadingA ? <Skeleton /> :
                                        dayAppts.length === 0 ? <EmptyDay icon={CalendarDays} text="No appointments this day" /> :
                                            <div className="space-y-2">
                                                {dayAppts.map(appt => {
                                                    const cfg = APPT_CFG[appt.status] || APPT_CFG.scheduled;
                                                    const SI = cfg.icon;
                                                    return (
                                                        <div key={appt.id} className="flex gap-3 items-start p-3 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                                            <div className="p-2 rounded-xl bg-muted flex-shrink-0">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div>
                                                                        <p className="font-semibold text-sm">{appt.patient_name}</p>
                                                                        {appt.patient_age > 0 && <p className="text-xs text-muted-foreground">{appt.patient_age} yrs</p>}
                                                                    </div>
                                                                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
                                                                        <SI className="h-3 w-3" />{cfg.label}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(appt.appointment_time)}</span>
                                                                    {appt.meeting_link && (
                                                                        <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand hover:underline">
                                                                            <Video className="h-3 w-3" /> Join
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {appt.notes && (
                                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-start gap-1">
                                                                        <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />{appt.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>}
                                </div>

                                {/* All upcoming strip */}
                                {upcoming.length > 0 && (
                                    <div>
                                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">All Upcoming ({upcoming.length})</p>
                                        <div className="space-y-2">
                                            {upcoming.map(appt => (
                                                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                                    <div className="p-2 rounded-xl bg-muted flex-shrink-0">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm">{appt.patient_name}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <CalendarDays className="h-3 w-3" />
                                                            {fmtDate(appt.appointment_time, { weekday: "short", day: "numeric", month: "short" })} — {fmtTime(appt.appointment_time)}
                                                        </p>
                                                    </div>
                                                    {appt.meeting_link && (
                                                        <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-brand hover:underline flex-shrink-0">
                                                            <Video className="h-3.5 w-3.5" /> Join
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
};

/* ── Sub-components ── */
const Skeleton = () => <div className="h-14 rounded-xl bg-muted animate-pulse" />;
const EmptyDay = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed text-muted-foreground">
        <Icon className="h-4 w-4 opacity-40" />
        <span className="text-sm">{text}</span>
    </div>
);

export default DoctorProfile;
