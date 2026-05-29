import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { patientsService } from "@/services/patientsService";
import { checkSubscriptionStatus } from "@/lib/subscriptionUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity, Heart, Thermometer, Droplets, MapPin,
  Calendar, Clock, CreditCard, User, History,
  FileText, Upload, Plus, Eye, AlertCircle, CheckCircle2, Pencil, X, Pill,
  LogOut, ClipboardList, Stethoscope, ChevronRight, Send, Trash2, Printer, Download, FileCheck
} from "lucide-react";
import ReportViewerModal from "./ReportViewerModal";

interface PatientDetailsSheetProps {
  patient: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const PatientDetailsSheet: React.FC<PatientDetailsSheetProps> = ({ patient, isOpen, onClose, onRefresh }) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isWoundUploading, setIsWoundUploading] = useState(false);
  const [isPrescribing, setIsPrescribing] = useState(false);

  // Edit patient state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    department: "",
    clinicalStatus: "",
    bpm: "",
    temp: "",
    spo2: "",
    subscriptionExpiry: "",
    bed: ""
  });

  // Forms
  const [reportForm, setReportForm] = useState({ name: "", type: "Clinical", file: null as File | null });
  const [woundForm, setWoundForm] = useState({ file: null as File | null, clinicalNotes: "" });
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicine_name: "",
    dosage: "",
    duration: "",
    instructions: ""
  });
  const [viewingReport, setViewingReport] = useState<{ url: string; name: string } | null>(null);

  // Queries
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["patient-reports", patient?.id],
    queryFn: () => patientsService.getPatientReports(patient!.id),
    enabled: !!patient?.id && isOpen,
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["patient-prescriptions", patient?.id],
    queryFn: () => patientsService.getPrescriptions(patient!.id),
    enabled: !!patient?.id && isOpen,
  });

  const { data: medicationHistory, isLoading: medicationHistoryLoading } = useQuery({
    queryKey: ["medication-history", patient?.id],
    queryFn: () => patientsService.getMedicationHistory(patient!.id),
    enabled: !!patient?.id && isOpen,
  });

  // Mutations
  const updatePatientMutation = useMutation({
    mutationFn: (data: any) => patientsService.updatePatient(patient!.id, { ...data, age: parseInt(data.age) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Health records synchronized");
      setIsEditing(false);
      onRefresh?.();
    },
    onError: (err: any) => toast.error(err.message || "Sync failure"),
  });

  const uploadReportMutation = useMutation({
    mutationFn: (data: FormData) => patientsService.uploadReport(data),
    onSuccess: () => {
      setReportForm({ name: "", type: "Clinical", file: null });
      queryClient.invalidateQueries({ queryKey: ["patient-reports", patient?.id] });
      setIsUploading(false);
      toast.success("Document attached");
    },
    onError: () => { setIsUploading(false); toast.error("Upload failed"); },
  });

  const addPrescriptionMutation = useMutation({
    mutationFn: (data: any) => patientsService.addPrescription(patient!.id, data),
    onSuccess: () => {
      setPrescriptionForm({ medicine_name: "", dosage: "", duration: "", instructions: "" });
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions", patient?.id] });
      setIsPrescribing(false);
      toast.success("Prescription added successfully");
    },
    onError: (err: any) => { setIsPrescribing(false); toast.error("Prescription failed"); },
  });

  const stopPrescriptionMutation = useMutation({
    mutationFn: (pId: string) => patientsService.deletePrescription(pId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions", patient?.id] });
      toast.info("Medication discontinued");
    },
    onError: () => toast.error("Action denied"),
  });

  const uploadWoundMutation = useMutation({
    mutationFn: (data: FormData) => patientsService.addWoundAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-reports", patient?.id] });
      setWoundForm({ file: null, clinicalNotes: "" });
      setIsWoundUploading(false);
      toast.success("Analysis successful");
    },
    onError: () => { setIsWoundUploading(false); toast.error("Analysis failed"); },
  });

  const dischargeMutation = useMutation({
    mutationFn: () => patientsService.dischargePatient(patient!.id),
    onSuccess: () => {
      toast.success("Bed vacancy updated");
      onClose();
      onRefresh?.();
    },
    onError: () => toast.error("Action denied"),
  });

  const logMedMutation = useMutation({
    mutationFn: (pId: string) => patientsService.logMedication(pId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication-history", patient?.id] });
      toast.success("Log authenticated");
    },
    onError: () => toast.error("Log failed"),
  });

  const handleEditClick = () => {
    if (patient) {
      setEditForm({
        name: patient.name || "",
        age: patient.age?.toString() || "",
        department: patient.department || "Cardiology",
        clinicalStatus: patient.clinicalStatus || "Stable",
        bpm: patient.bpm || "",
        temp: patient.temp || "",
        spo2: patient.spo2 || "",
        subscriptionExpiry: patient.subscriptionExpiry ? new Date(patient.subscriptionExpiry).toISOString().split("T")[0] : "",
        bed: patient.bed || ""
      });
      setIsEditing(true);
    }
  };

  const generateReport = () => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      toast.error("Please disable popup blocker");
      return;
    }

    // Dynamic IDs and Dr Info
    const reportId = `OC-${patient.id.split("-")[0].toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const hospitalId = "OPT-VH-786-KHI";
    const generationTimestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const reportDateStr = new Date().toLocaleDateString('en-GB');
    const attendingDr = "Dr. Zara Saleem";

    // THEME COLOR FROM IMAGE: Vibrant Royal Blue
    const themeColor = "#1D61E0";

    const reportHtml = `
      <html>
        <head>
          <title>Medical Record - ${patient.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; padding: 50px; background: #fff; }
            .header { border-bottom: 4px solid ${themeColor}; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .hospital-name { font-size: 24px; font-weight: 900; color: ${themeColor}; letter-spacing: -0.5px; }
            .report-type { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
            .section-title { background: #f8fafc; padding: 12px 15px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 35px 0 15px 0; border-left: 6px solid ${themeColor}; color: ${themeColor}; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 14px 20px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; font-weight: 800; width: 32%; color: #475569; }
            td { color: #1e293b; font-weight: 500; }
            .vital-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 2px solid ${themeColor}20; border-radius: 16px; overflow: hidden; margin-bottom: 30px; }
            .vital-cell { padding: 25px; border-right: 1px solid #e2e8f0; text-align: center; background: #fff; }
            .vital-cell:last-child { border-right: none; }
            .vital-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
            .vital-value { font-size: 20px; font-weight: 900; color: ${themeColor}; }
            .footer { margin-top: 60px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 25px; text-align: center; }
            @media print { .no-print { display: none; } body { padding: 0; } }
            .btn-print { background: ${themeColor}; color: #fff; padding: 15px 30px; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; margin-bottom: 30px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(29, 97, 224, 0.3); }
          </style>
        </head>
        <body>
          <div class="no-print">
             <button class="btn-print" onclick="window.print()">Download Clinical Copy (PDF)</button>
          </div>
          <div class="header">
            <div class="hospital-name">OptiCare CONFIDENTIAL — MEDICAL RECORD</div>
            <div class="report-type">Assessment Division</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 35px; color: #475569;">
            <div style="line-height: 2;">
              <span style="color: #94a3b8">Generated:</span> <strong>${generationTimestamp}</strong><br>
              <span style="color: #94a3b8">Report ID:</span> <strong>${reportId}</strong><br>
              <span style="color: #94a3b8">Hospital ID:</span> <strong>${hospitalId}</strong>
            </div>
            <div style="text-align: right; line-height: 2;">
              <span style="color: #94a3b8">Report Date:</span> <strong>${reportDateStr}</strong><br>
              <span style="color: #94a3b8">Attending Dr:</span> <strong>${attendingDr}</strong>
            </div>
          </div>

          <div class="section-title">I. Patient Identification</div>
          <table>
            <tr><th>Accession Number</th><td>${patient.id.toUpperCase()}</td></tr>
            <tr><th>Full Name</th><td>${patient.name || "N/A"}</td></tr>
            <tr><th>Age / Gender</th><td>${patient.age || "N/A"} Years / ${patient.gender || "Female"}</td></tr>
            <tr><th>Blood Group</th><td>${patient.bloodGroup || "N/A"}</td></tr>
            <tr><th>Contact No.</th><td>${patient.contact || "N/A"}</td></tr>
            <tr><th>Residential Address</th><td>${patient.address || "N/A"}</td></tr>
          </table>

          <div class="section-title">II. Baseline Vital Signs</div>
          <div class="vital-grid">
             <div class="vital-cell">
                <div class="vital-label">B.P (mmHg)</div>
                <div class="vital-value">${patient.bloodPressure || "120/80"}</div>
             </div>
             <div class="vital-cell">
                <div class="vital-label">Temperature</div>
                <div class="vital-value">${patient.temp || "N/A"}°F</div>
             </div>
             <div class="vital-cell">
                <div class="vital-label">Pulse (bpm)</div>
                <div class="vital-value">${patient.bpm || "N/A"}</div>
             </div>
             <div class="vital-cell">
                <div class="vital-label">SpO2 Level</div>
                <div class="vital-value">${patient.spo2 || "N/A"}%</div>
             </div>
          </div>

          <div class="section-title">III. Clinical Presentation & Symptoms</div>
          <table>
            <tr><th>Chief Complaint</th><td>${patient.clinicalNotes || "N/A"}</td></tr>
            <tr><th>Symptomatic History</th><td>${patient.symptoms || "N/A"}</td></tr>
          </table>

          <div class="section-title">IV. Wound Assessment Profile</div>
          <table>
            <tr><th>Wound Classification</th><td>${patient.woundType || "N/A"}</td></tr>
            <tr><th>Anatomical Location</th><td>${patient.woundLocation || "N/A"}</td></tr>
            <tr><th>Duration of Injury</th><td>${patient.woundDuration || "N/A"}</td></tr>
            <tr><th>Pre-Intake Intervention</th><td>${patient.priorTreatment || "N/A"}</td></tr>
          </table>

          <div class="section-title">V. Pharmacology & History</div>
          <table>
            <tr><th>Active Prescriptions</th><td>${prescriptions && prescriptions.length > 0 ? prescriptions.map((p: any) => p.medicine_name).join(", ") : "None at time of report"}</td></tr>
            <tr><th>Allergic Reactions</th><td>${patient.allergies || "None Disclosed"}</td></tr>
            <tr><th>Co-morbidities</th><td>${patient.chronicConditions || "Nil"}</td></tr>
          </table>

          <div class="section-title">VI. Clinical Summary & Remarks</div>
          <div style="padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; background: #fff; color: #1e293b; line-height: 1.8; border-left: 4px solid ${themeColor};">
             ${patient.doctorNotes || "Patient clinically evaluated. Monitoring active for acute symptoms. Follow-up advised based on diagnostic results."}
          </div>

          <div class="footer">
            Electronic Signature Authenticated by OptiCare Med-Data System. <br>
            Authorized clinical use only. Unauthorized replication is strictly prohibited.
          </div>
        </body>
      </html>
    `;

    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
  };

  if (!patient) return null;
  const { status: subStatus } = checkSubscriptionStatus(patient);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-slate-50 p-0 shadow-2xl border-l border-brand/20">
        <div className="bg-white border-b border-zinc-200">
          <div className="px-6 py-6 border-b border-zinc-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Medical Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 rounded-lg border-brand/20 text-brand font-bold" onClick={handleEditClick}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}><X className="h-5 w-5 text-zinc-300" /></Button>
            </div>
          </div>

          <div className="px-8 py-8 flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 p-1 border border-indigo-100">
              <div className="h-full w-full rounded-xl bg-white flex items-center justify-center overflow-hidden">
                {patient.avatar_url ? <img src={patient.avatar_url} className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-indigo-400/20" />}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{patient.name}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className={`${patient.clinicalStatus === "Critical" ? "bg-rose-500 text-white" : "bg-brand text-white"} px-2 rounded-md font-bold text-[9px] uppercase tracking-wider`}>
                  {patient.clinicalStatus || "Stable"}
                </Badge>
                <span className="text-xs font-bold text-slate-400">Unit: {patient.department} • Bed {patient.bed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="vitals" className="w-full">
            <TabsList className="bg-white border p-1 rounded-xl mb-6 grid grid-cols-4 w-full border-slate-200">
              <TabsTrigger value="vitals" className="rounded-lg font-bold text-xs data-[state=active]:bg-brand data-[state=active]:text-white">Vitals</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg font-bold text-xs data-[state=active]:bg-brand data-[state=active]:text-white">Reports</TabsTrigger>
              <TabsTrigger value="script" className="rounded-lg font-bold text-xs data-[state=active]:bg-brand data-[state=active]:text-white">Pharmacy</TabsTrigger>
              <TabsTrigger value="wound" className="rounded-lg font-bold text-xs data-[state=active]:bg-brand data-[state=active]:text-white">Wound</TabsTrigger>
            </TabsList>

            <TabsContent value="vitals" className="mt-0 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 bg-white border-slate-100 flex flex-col items-center shadow-sm">
                  <Heart className="h-4 w-4 text-rose-500 mb-1.5" />
                  <span className="text-xl font-black text-slate-800">{patient.bpm || "72"}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pulse</span>
                </Card>
                <Card className="p-4 bg-white border-slate-100 flex flex-col items-center shadow-sm">
                  <Thermometer className="h-4 w-4 text-amber-500 mb-1.5" />
                  <span className="text-xl font-black text-slate-800">{patient.temp || "98"}°</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Temp</span>
                </Card>
                <Card className="p-4 bg-white border-slate-100 flex flex-col items-center shadow-sm">
                  <Droplets className="h-4 w-4 text-indigo-500 mb-1.5" />
                  <span className="text-xl font-black text-slate-800">{patient.spo2 || "99"}%</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">O2 Sat</span>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <Button className="w-full bg-white border-brand/20 text-brand hover:bg-brand/5 font-black h-12 rounded-xl group shadow-sm" variant="outline" onClick={generateReport}>
                  <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" /> Print Intake Report
                </Button>
                <Button className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 font-black h-12 rounded-xl shadow-sm border border-rose-100" onClick={() => { if (window.confirm("Confirm discharge?")) dischargeMutation.mutate() }}>
                  <LogOut className="h-4 w-4 mr-2" /> Discharge Patient
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-6">
              <div className="space-y-2">
                {reportsLoading ? <p className="text-center py-8 text-xs text-zinc-400">Loading documents...</p> :
                  reports && reports.length > 0 ? (
                    reports.map((r: any) => (
                      <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between hover:border-brand/30 cursor-pointer group" onClick={() => setViewingReport({ url: r.file_url, name: r.report_name })}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><FileText className="h-5 w-5" /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{r.report_name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(r.report_date || r.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-brand" />
                      </div>
                    ))
                  ) : <p className="p-10 text-center text-xs text-zinc-400 italic">Clinical archive empty.</p>
                }
              </div>
              <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Append Document</h4>
                <Input placeholder="Diagnostic Title" value={reportForm.name} onChange={e => setReportForm({ ...reportForm, name: e.target.value })} className="rounded-lg h-11" />
                <Input type="file" onChange={e => setReportForm({ ...reportForm, file: e.target.files?.[0] || null })} className="rounded-lg h-11" />
                <Button className="w-full bg-brand hover:bg-brand-hover text-white font-bold h-11 rounded-lg" disabled={isUploading || !reportForm.file} onClick={() => {
                  const fd = new FormData(); fd.append("file", reportForm.file!); fd.append("patient_id", patient.id); fd.append("report_name", reportForm.name || "Lab Result"); fd.append("report_type", "Clinical");
                  setIsUploading(true); uploadReportMutation.mutate(fd);
                }}>Attach Record</Button>
              </Card>
            </TabsContent>

            <TabsContent value="script" className="mt-0 space-y-6">
              <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4 border-t-4 border-t-brand">
                <h4 className="text-[10px] font-black uppercase text-brand tracking-widest flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Prescribe New Medicine
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-400 uppercase">Medicine Name</Label>
                    <Input placeholder="e.g. Panadol" value={prescriptionForm.medicine_name} onChange={e => setPrescriptionForm({ ...prescriptionForm, medicine_name: e.target.value })} className="h-10 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-400 uppercase">Dosage</Label>
                    <Input placeholder="e.g. 500mg" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} className="h-10 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-400 uppercase">Duration/Frequency</Label>
                    <Input placeholder="e.g. 1-0-1 (5 days)" value={prescriptionForm.duration} onChange={e => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })} className="h-10 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-400 uppercase">Special Instructions</Label>
                    <Input placeholder="e.g. After meal" value={prescriptionForm.instructions} onChange={e => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} className="h-10 rounded-lg text-xs" />
                  </div>
                </div>
                <Button className="w-full bg-brand hover:bg-brand-hover text-white font-bold h-10 rounded-lg text-xs" disabled={isPrescribing || !prescriptionForm.medicine_name} onClick={() => {
                  setIsPrescribing(true); addPrescriptionMutation.mutate(prescriptionForm);
                }}>
                  {isPrescribing ? <Activity className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-2" /> Issue Prescription</>}
                </Button>
              </Card>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Active Prescriptions</h4>
                {prescriptionsLoading ? <p className="text-center py-8 text-xs text-zinc-400 animate-pulse">Syncing EMAR...</p> :
                  prescriptions && prescriptions.length > 0 ? (
                    prescriptions.map((p: any) => (
                      <Card key={p.id} className="p-4 border-slate-200 flex justify-between items-center bg-white shadow-sm border-l-4 border-l-brand relative overflow-hidden group">
                        <div className="flex items-center gap-3">
                          <Pill className="h-5 w-5 text-brand" />
                          <div>
                            <h5 className="font-bold text-slate-800 text-sm tracking-tight">{p.medicine_name}</h5>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{p.dosage} — Every {p.duration}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button size="sm" className="bg-brand text-white hover:bg-brand-hover font-bold rounded-lg px-4 h-10" onClick={() => logMedMutation.mutate(p.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Taken
                          </Button>
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" onClick={() => { if (window.confirm("Stop this medication?")) stopPrescriptionMutation.mutate(p.id) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : <p className="p-6 text-center text-xs text-zinc-400 italic">No active medication plans.</p>
                }
              </div>

              <div className="space-y-3 pt-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                  <History className="h-3 w-3" /> Medication Log (E-MAR)
                </h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-3 text-[9px] font-black text-slate-400 grid grid-cols-3 gap-2 px-6 uppercase tracking-wider border-b">
                    <span>Medication</span>
                    <span>Timestamp</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                    {medicationHistory && medicationHistory.length > 0 ? medicationHistory.map((log: any) => (
                      <div key={log.id} className="p-3 px-6 grid grid-cols-3 gap-2 text-[11px] items-center hover:bg-slate-50/50">
                        <span className="font-bold text-slate-700">Dose Given</span>
                        <span className="text-slate-400 font-medium">{new Date(log.administered_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span><Badge className="bg-emerald-50 text-emerald-600 border-none px-2 h-5 font-bold uppercase text-[8px] tracking-wider">{log.status}</Badge></span>
                      </div>
                    )) : (
                      <p className="p-8 text-center text-[10px] text-slate-400 italic">No records yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wound" className="mt-0">
              <Card className="p-8 text-center bg-white border-slate-200">
                <ClipboardList className="h-10 w-10 text-brand/20 mx-auto mb-4" />
                <h4 className="text-lg font-black text-slate-800">Advanced AI Scan</h4>
                <p className="text-[10px] font-bold text-zinc-400 mt-1 mb-6 px-4 uppercase tracking-widest leading-relaxed">Integrated computer vision for wound pathology keywords & infection scoring.</p>
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <Input type="file" onChange={e => setWoundForm({ ...woundForm, file: e.target.files?.[0] || null })} className="rounded-lg h-11" />
                  <Button className="w-full bg-brand h-12 rounded-lg font-black text-white hover:bg-brand-hover shadow-lg shadow-brand/20" disabled={isWoundUploading || !woundForm.file} onClick={() => {
                    const fd = new FormData(); fd.append("file", woundForm.file!); fd.append("patient_id", patient.id); fd.append("clinical_notes", woundForm.clinicalNotes);
                    setIsWoundUploading(true); uploadWoundMutation.mutate(fd);
                  }}>{isWoundUploading ? <Activity className="h-5 w-5 animate-spin" /> : "Initiate AI Diagnostics"}</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg p-8 bg-white shadow-2xl rounded-[2rem] border-none animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Edit Clinical Record</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full text-zinc-300"><X className="h-5 w-5" /></Button>
              </div>

              <div className="h-[450px] overflow-y-auto pr-3 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-brand tracking-[0.2em] mb-2">Basic Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Full Name</Label>
                      <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Age</Label>
                      <Input type="number" value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Bed No.</Label>
                      <Input value={editForm.bed} onChange={e => setEditForm({ ...editForm, bed: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Department</Label>
                      <Select value={editForm.department} onValueChange={v => setEditForm({ ...editForm, department: v })}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Cardiology">Cardiology</SelectItem>
                          <SelectItem value="Neurology">Neurology</SelectItem>
                          <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase text-brand tracking-[0.2em] mb-2">Medical Status</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 col-span-3">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Clinical Status</Label>
                      <Select value={editForm.clinicalStatus} onValueChange={v => setEditForm({ ...editForm, clinicalStatus: v })}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Stable">Stable</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="Recovering">Recovering</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">BPM</Label>
                      <Input value={editForm.bpm} onChange={e => setEditForm({ ...editForm, bpm: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Temp (°F)</Label>
                      <Input value={editForm.temp} onChange={e => setEditForm({ ...editForm, temp: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">SpO2 (%)</Label>
                      <Input value={editForm.spo2} onChange={e => setEditForm({ ...editForm, spo2: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 pb-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Subscription Expiry</Label>
                    <Input type="date" value={editForm.subscriptionExpiry} onChange={e => setEditForm({ ...editForm, subscriptionExpiry: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-brand hover:bg-brand-hover text-white font-black h-14 rounded-2xl mt-8 shadow-xl shadow-brand/20" onClick={() => updatePatientMutation.mutate(editForm)}>
                Synchronize health Record
              </Button>
            </Card>
          </div>
        )}
      </SheetContent>

      <ReportViewerModal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        fileUrl={viewingReport?.url || null}
        fileName={viewingReport?.name || "Diagnostic Archive"}
      />
    </Sheet>
  );
};

export default PatientDetailsSheet;
