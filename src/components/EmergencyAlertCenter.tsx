import React, { useState, useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { X, Activity, Volume2, VolumeX, User, ShieldCheck, HeartPulse, Bell, Info, ArrowRight } from "lucide-react";
import { patientsService } from "@/services/patientsService";
import { toast } from "sonner";
import { Badge } from "./ui/badge";

const EmergencyAlertCenter = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [recommendations, setRecommendations] = useState<Record<string, string>>({});
    const [monitorActive, setMonitorActive] = useState(true);
    const [acknowledgedFallbackIds, setAcknowledgedFallbackIds] = useState<Set<string>>(new Set());
    const prevAlertsCount = useRef(0);

    const fetchAlerts = async () => {
        try {
            let activeAlerts = await patientsService.getActiveAlerts();
            setMonitorActive(true);

            if (!activeAlerts || activeAlerts.length === 0) {
                const patients = await patientsService.getActivePatients();
                const criticalPatients = patients.filter((p: any) =>
                    (p.clinicalStatus?.toLowerCase() === "critical" || (p.bpm && parseInt(p.bpm) < 60)) &&
                    !acknowledgedFallbackIds.has(p.id)
                );

                activeAlerts = criticalPatients.map((p: any) => ({
                    id: `fallback-${p.id}`,
                    patient_id: p.id,
                    patient_name: p.name,
                    message: `Abnormal vitals: BPM ${p.bpm || 'N/A'}, SpO2 ${p.spo2 || 'N/A'}. Assessment required.`,
                    alert_time: new Date().toISOString(),
                    status: 'active',
                    bed: p.bed
                }));
            }

            if (activeAlerts.length > prevAlertsCount.current) {
                if (!isMuted) playAlertSound();
            }
            setAlerts(activeAlerts || []);
            prevAlertsCount.current = (activeAlerts || []).length;
        } catch (err: any) {
            setMonitorActive(false);
        }
    };

    const playAlertSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) { }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 4000);
        return () => clearInterval(interval);
    }, [isMuted, acknowledgedFallbackIds]);

    const handleResolve = async (id: string) => {
        const rec = recommendations[id] || "Reviewed and Actioned";
        const originalAlerts = [...alerts];
        const alertToResolve = alerts.find(a => a.id === id);

        setAlerts(prev => prev.filter(a => a.id !== id));

        if (id.startsWith("fallback-") && alertToResolve?.patient_id) {
            setAcknowledgedFallbackIds(prev => new Set(prev).add(alertToResolve.patient_id));
        }

        try {
            toast.success("Clinical Note Saved", {
                description: "Recommendation recorded successfully.",
                className: "bg-white border-slate-200 text-slate-900 shadow-xl rounded-2xl"
            });
            await patientsService.resolveAlert(id, rec);
            setRecommendations(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } catch (err) {
            setAlerts(originalAlerts);
            toast.error("Sync Failed");
        }
    };

    if (!alerts || alerts.length === 0) {
        return (
            <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm select-none">
                    <div className={`h-2 w-2 rounded-full ${monitorActive ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Clinical Monitor Active</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <Card className={`relative overflow-hidden border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 bg-white ${isExpanded ? 'w-[380px] rounded-[24px]' : 'w-16 h-16 rounded-full'}`}>

                {/* Clean Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
                            <Activity className="h-5 w-5 text-rose-600" />
                        </div>
                        {isExpanded && (
                            <div className="flex flex-col">
                                <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Active Alerts</h2>
                                <span className="text-[10px] text-slate-500 font-medium tracking-wide">Emergency Response Center</span>
                            </div>
                        )}
                    </div>
                    {isExpanded && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-400 transition-colors">
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {isExpanded ? (
                    <div className="px-5 py-6 space-y-5 max-h-[550px] overflow-y-auto custom-scrollbar">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="relative rounded-2xl border border-slate-100 bg-white p-5 hover:border-slate-300 transition-all duration-300 group shadow-sm">
                                <div className="absolute top-0 right-0 p-3">
                                    <Badge variant="outline" className="text-[9px] border-slate-100 text-slate-400 font-black uppercase bg-slate-50">
                                        BED {alert.bed || '--'}
                                    </Badge>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div className="flex flex-col pt-0.5">
                                            <span className="text-16px font-bold text-slate-900 leading-none">{alert.patient_name}</span>
                                            <div className="flex items-center gap-1 mt-2">
                                                <HeartPulse className="h-3 w-3 text-rose-600" />
                                                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-tighter">Clinical Crisis</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                        <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-[13px] leading-snug text-slate-600 font-medium italic">
                                            {alert.message}
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-1">
                                        <div className="group/input relative">
                                            <input
                                                type="text"
                                                placeholder="Clinical recommendation..."
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium"
                                                value={recommendations[alert.id] || ""}
                                                onChange={(e) => setRecommendations({ ...recommendations, [alert.id]: e.target.value })}
                                                onKeyDown={(e) => e.key === 'Enter' && handleResolve(alert.id)}
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleResolve(alert.id)}
                                            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white font-bold text-[13px] hover:bg-rose-700 transition-all duration-300 shadow-md active:scale-[0.98]"
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            Record Action
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                                        <span>Logged: {new Date(alert.alert_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        Monitor Hub
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full h-full flex flex-col items-center justify-center bg-rose-600 hover:bg-rose-700 transition-all duration-300 group/min"
                    >
                        <Bell className="h-7 w-7 text-white" />
                        <span className="absolute -top-1 -right-1 bg-white text-rose-600 text-[11px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-rose-600 shadow-lg">
                            {alerts.length}
                        </span>
                    </button>
                )}

                {isExpanded && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            Synchronized
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">V4.2 Clinical Suite</span>
                    </div>
                )}
            </Card>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 0px;
                }
            `}</style>
        </div>
    );
};

export default EmergencyAlertCenter;
