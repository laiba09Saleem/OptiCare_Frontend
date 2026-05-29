import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarDays, Clock, User, Video, FileText,
    Sun, Moon, Sunset, PhoneCall, AlertCircle, CheckCircle2,
    CalendarCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const shiftConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    morning: { icon: Sun, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
    evening: { icon: Sunset, color: "text-orange-500", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800" },
    night: { icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800" },
    "on-call": { icon: PhoneCall, color: "text-rose-500", bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    scheduled: { label: "Scheduled", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", icon: CalendarCheck },
    completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", icon: AlertCircle },
    emergency: { label: "Emergency", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: AlertCircle },
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

const Schedule = () => {
    const { toast } = useToast();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingShifts, setIsLoadingShifts] = useState(true);
    const [isLoadingAppts, setIsLoadingAppts] = useState(true);

    useEffect(() => {
        apiFetch<Shift[]>("/schedule/shifts")
            .then(setShifts)
            .catch(() => setShifts([]))
            .finally(() => setIsLoadingShifts(false));

        apiFetch<Appointment[]>("/schedule/appointments")
            .then(setAppointments)
            .catch(() => setAppointments([]))
            .finally(() => setIsLoadingAppts(false));
    }, []);

    const upcomingAppts = appointments.filter(
        (a) => a.status === "scheduled" || a.status === "emergency"
    );
    const pastAppts = appointments.filter(
        (a) => a.status === "completed" || a.status === "cancelled"
    );

    return (
        <div className="min-h-screen py-10 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Page Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-brand/10">
                            <CalendarDays className="h-7 w-7 text-brand" />
                        </span>
                        My Schedule
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        View your assigned duty shifts and upcoming patient appointments.
                    </p>
                </div>

                {/* Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Total Shifts", value: shifts.length, icon: Clock, color: "text-violet-500" },
                        { label: "Upcoming Appts", value: upcomingAppts.length, icon: CalendarCheck, color: "text-sky-500" },
                        { label: "Completed", value: pastAppts.filter(a => a.status === "completed").length, icon: CheckCircle2, color: "text-emerald-500" },
                        { label: "Emergency", value: appointments.filter(a => a.status === "emergency").length, icon: AlertCircle, color: "text-rose-500" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-muted ${color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{value}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="shifts">
                    <TabsList className="grid grid-cols-2 w-full max-w-sm">
                        <TabsTrigger value="shifts">Duty Shifts</TabsTrigger>
                        <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    </TabsList>

                    {/* ── SHIFTS TAB ── */}
                    <TabsContent value="shifts" className="mt-4 space-y-3">
                        {isLoadingShifts ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                            ))
                        ) : shifts.length === 0 ? (
                            <EmptyState icon={Clock} message="No duty shifts assigned yet." />
                        ) : (
                            shifts.map((shift) => {
                                const cfg = shiftConfig[shift.shift_type] || shiftConfig.morning;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={shift.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.bg} transition-transform hover:scale-[1.01]`}
                                    >
                                        <div className={`p-3 rounded-xl bg-white/60 dark:bg-black/20 shadow ${cfg.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm">{formatDate(shift.shift_date)}</span>
                                                <Badge variant="outline" className={`capitalize text-xs ${cfg.color}`}>
                                                    {shift.shift_type}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </TabsContent>

                    {/* ── APPOINTMENTS TAB ── */}
                    <TabsContent value="appointments" className="mt-4 space-y-4">
                        {isLoadingAppts ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                            ))
                        ) : appointments.length === 0 ? (
                            <EmptyState icon={CalendarDays} message="No appointments scheduled." />
                        ) : (
                            <>
                                {upcomingAppts.length > 0 && (
                                    <div>
                                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Upcoming</h3>
                                        <div className="space-y-3">
                                            {upcomingAppts.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)}
                                        </div>
                                    </div>
                                )}
                                {pastAppts.length > 0 && (
                                    <div>
                                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2 mt-4">Past</h3>
                                        <div className="space-y-3">
                                            {pastAppts.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
};

/* ── Appointment Card ── */
const AppointmentCard = ({ appt }: { appt: Appointment }) => {
    const cfg = statusConfig[appt.status] || statusConfig.scheduled;
    const StatusIcon = cfg.icon;

    return (
        <Card className="shadow-md hover:shadow-lg transition-all hover:scale-[1.005]">
            <CardContent className="p-4 flex gap-4 items-start">
                <div className="p-2 rounded-xl bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                            <p className="font-semibold text-sm">{appt.patient_name}</p>
                            {appt.patient_age && (
                                <p className="text-xs text-muted-foreground">{appt.patient_age} years old</p>
                            )}
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                        </span>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(appt.appointment_time)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(appt.appointment_time)}
                        </span>
                        {appt.meeting_link && (
                            <a
                                href={appt.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-brand hover:underline"
                            >
                                <Video className="h-3 w-3" /> Join Call
                            </a>
                        )}
                    </div>

                    {appt.notes && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 flex gap-1">
                            <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            {appt.notes}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

/* ── Empty State ── */
const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <div className="p-5 rounded-2xl bg-muted">
            <Icon className="h-10 w-10 opacity-40" />
        </div>
        <p className="text-sm">{message}</p>
    </div>
);

export default Schedule;
