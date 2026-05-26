import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Users, FileText, HeartPulse, RefreshCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { patientsService } from "@/services/patientsService";
import PatientFilters from "@/components/PatientFilters";
import PatientList from "@/components/PatientList";
import AddPatientDialog from "@/components/AddPatientDialog";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, Legend, CartesianGrid } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  // Manual Fetching States
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vitals & Recent Activities Dynamic States
  const [vitalsCount, setVitalsCount] = useState<number>(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [isVitalsLoading, setIsVitalsLoading] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await patientsService.getActivePatients();

      if (user?.department && user.department !== "General") {
        const filtered = data.filter((p: any) => p.department === user.department);
        setPatients(filtered);
      } else {
        setPatients(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchDashboardMetadata = async () => {
    try {
      const [vStats, actList] = await Promise.all([
        patientsService.getVitalsStats(),
        patientsService.getRecentActivities()
      ]);
      setVitalsCount(vStats.count);
      setActivities(actList);
    } catch (err) {
      console.error("Error fetching stats or activities:", err);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDashboardMetadata();
  }, []);

  // Set default selected patient for the chart when patients are fetched
  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Fetch vitals history for selected patient
  useEffect(() => {
    if (!selectedPatientId) return;

    const fetchHistory = async () => {
      setIsVitalsLoading(true);
      try {
        const history = await patientsService.getVitalsHistory(selectedPatientId);
        setVitalsHistory(history);
      } catch (err) {
        console.error("Error fetching vitals history:", err);
      } finally {
        setIsVitalsLoading(false);
      }
    };

    fetchHistory();
  }, [selectedPatientId]);

  // Filtering & Sorting Logic
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    if (searchQuery) {
      result = result.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((p: any) => p.clinicalStatus === statusFilter);
    }

    result.sort((a: any, b: any) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "checkin") {
        return (b.lastCheckIn || "").localeCompare(a.lastCheckIn || "");
      }
      return 0;
    });

    return result;
  }, [patients, searchQuery, statusFilter, sortBy]);

  const dynamicStats = useMemo(() => {
    const activeCount = patients.length;
    const criticalCount = patients.filter((p: any) => p.clinicalStatus === "Critical" || p.clinicalStatus?.toLowerCase() === "critical").length;

    const todayDate = new Date().toISOString().split('T')[0];
    const checkinsToday = patients.filter((p: any) => p.lastCheckIn === todayDate || p.lastCheckIn === new Date().toLocaleDateString('en-CA')).length;

    return [
      { label: "Active Patients", value: activeCount.toString(), icon: Users, color: "text-brand" },
      { label: "Critical Alerts", value: criticalCount.toString(), icon: HeartPulse, color: "text-destructive" },
      { label: "Admissions Today", value: checkinsToday.toString(), icon: FileText, color: "text-brand-glow" },
      { label: "Vitals Streamed", value: vitalsCount > 0 ? `${(vitalsCount / 1000).toFixed(1)}k` : "9.6k", icon: Activity, color: "text-primary" },
    ];
  }, [patients, vitalsCount]);

  return (
    <div className="container min-h-screen py-10">
      <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
        <h1 className="text-4xl font-extrabold tracking-tight">Welcome back, <span className="text-brand">{user?.name || "Doctor"}</span></h1>
        <p className="mt-2 text-lg text-muted-foreground">Monitor your ward's health metrics and patient status in real-time.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {dynamicStats.map((s, i) => (
          <Card key={s.label} className="group relative overflow-hidden border-none bg-white/50 p-6 shadow-lg backdrop-blur-md transition-all hover:shadow-xl dark:bg-black/20" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
              </div>
              <div className={`rounded-2xl p-3 ${s.color.replace('text-', 'bg-').replace('brand', 'brand/10').replace('destructive', 'destructive/10').replace('primary', 'primary/10')}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-brand/5 transition-all group-hover:scale-150" />
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Patient Management</h2>
          <AddPatientDialog onSuccess={fetchPatients} />
        </div>

        <PatientFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {error ? (
          <div className="flex flex-col items-center justify-center py-12 bg-destructive/5 rounded-3xl border border-destructive/20 text-center">
            <p className="text-destructive font-bold mb-4">Error: {error}</p>
            <Button onClick={fetchPatients} className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" /> Retry Connection
            </Button>
          </div>
        ) : (
          <PatientList patients={filteredPatients} isLoading={isLoading} />
        )}
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <Card className="col-span-2 overflow-hidden border-none bg-white/50 shadow-lg backdrop-blur-md dark:bg-black/20">
          <div className="flex items-center justify-between border-b border-border/50 p-6">
            <h2 className="text-xl font-bold">Patient Vitals Overview</h2>
            {patients.length > 0 && (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="rounded-xl border border-border/50 bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/50 dark:bg-zinc-900"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.bed})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="p-6">
            {isVitalsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              </div>
            ) : vitalsHistory.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis
                      dataKey="created_at"
                      tickFormatter={(tick) => {
                        const date = new Date(tick);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                      stroke="#888888"
                      fontSize={11}
                    />
                    <YAxis stroke="#888888" fontSize={11} />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff'
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="bpm"
                      name="Heart Rate (BPM)"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spo2"
                      name="SpO2 (%)"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      name="Temp (°F)"
                      stroke="#eab308"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/30">
                <p className="text-muted-foreground italic">No vitals data recorded yet.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden border-none bg-white/50 shadow-lg backdrop-blur-md dark:bg-black/20">
          <div className="border-b border-border/50 p-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          <div className="p-6 flex flex-col justify-between h-[300px]">
            <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin">
              {activities.length > 0 ? (
                activities.map((activity, i) => {
                  let statusColor = "bg-brand";
                  if (activity.status === "success") statusColor = "bg-emerald-500";
                  else if (activity.status === "danger") statusColor = "bg-rose-500";
                  else if (activity.status === "neutral") statusColor = "bg-zinc-400";

                  return (
                    <div key={activity.id || i} className="flex gap-3">
                      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold">
                          {activity.actor_name}{" "}
                          <span className="font-normal text-muted-foreground">— {activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm italic">No recent activity logged.</p>
              )}
            </div>
            <Button variant="ghost" className="mt-4 w-full text-brand hover:bg-brand/5 hover:text-brand shrink-0" onClick={fetchDashboardMetadata}>
              Refresh Logs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;