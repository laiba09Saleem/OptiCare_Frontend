import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Patient } from "@/services/patientService";
import { patientsService } from "@/services/patientsService";
import { checkSubscriptionStatus } from "@/lib/subscriptionUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity, Heart, Thermometer, Droplets, MapPin,
  Calendar, Clock, CreditCard, User, History,
  FileText, Upload, Plus, Eye, AlertCircle, CheckCircle2, Pencil, X
} from "lucide-react";

interface PatientDetailsSheetProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

const PatientDetailsSheet: React.FC<PatientDetailsSheetProps> = ({ patient, isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // New report form state
  const [reportForm, setReportForm] = useState({
    name: "",
    type: "ECG",
    summary: "",
    file: null as File | null
  });

  const [woundForm, setWoundForm] = useState({
    file: null as File | null,
    clinicalNotes: "",
  });
  const [isWoundUploading, setIsWoundUploading] = useState(false);

  // Edit patient state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    department: "",
    clinicalStatus: "",
    bpm: "",
    temp: "",
    spo2: "",
    subscriptionExpiry: "",
    bed: "",
  });

  const { data: timeline, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["patient-timeline", patient?.id],
    queryFn: () => patientsService.getTimeline(patient!.id),
    enabled: !!patient && isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => patientsService.uploadReport(formData),
    onSuccess: () => {
      toast.success("Medical report uploaded successfully");
      setReportForm({ name: "", type: "ECG", summary: "", file: null });
      queryClient.invalidateQueries({ queryKey: ["patient-timeline", patient?.id] });
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload report");
      setIsUploading(false);
    }
  });

  if (!patient) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReportForm(prev => ({ ...prev, file }));
  };

  const onSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.file || !reportForm.name) {
      toast.error("Please provide a report name and file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("patient_id", patient.id);
    formData.append("report_name", reportForm.name);
    formData.append("report_type", reportForm.type);
    formData.append("summary", reportForm.summary);
    formData.append("file", reportForm.file);

    uploadMutation.mutate(formData);
  };

  const onSubmitWound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woundForm.file) {
      toast.error("Please provide a wound image");
      return;
    }

    setIsWoundUploading(true);
    try {
      const { aiService } = await import("@/services/aiService");
      const aiResult = await aiService.analyzeWound(woundForm.file, woundForm.clinicalNotes);

      const formData = new FormData();
      formData.append("patient_id", patient.id);
      formData.append("clinical_notes", woundForm.clinicalNotes);
      formData.append("confidence", aiResult.prediction?.confidence || "0");
      formData.append("is_infected", aiResult.prediction?.is_infected || "false");
      formData.append("detected_keywords", aiResult.prediction?.detected_keywords?.join(",") || "");
      formData.append("image_url", aiResult.prediction?.image_url || "");

      await patientsService.addWoundAssessment(formData);

      toast.success("Wound assessment uploaded successfully");
      setWoundForm({ file: null, clinicalNotes: "" });
      queryClient.invalidateQueries({ queryKey: ["patient-timeline", patient.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload wound assessment");
    } finally {
      setIsWoundUploading(false);
    }
  };

  const { status: subStatus } = checkSubscriptionStatus(patient);

  const handleEditOpen = () => {
    setEditForm({
      name: patient.name,
      age: String(patient.age),
      department: patient.department,
      clinicalStatus: patient.clinicalStatus,
      bpm: patient.bpm,
      temp: patient.temp,
      spo2: patient.spo2,
      subscriptionExpiry: patient.subscriptionExpiry,
      bed: patient.bed,
    });
    setIsEditing(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await patientsService.updatePatient(patient.id, {
        name: editForm.name,
        age: parseInt(editForm.age) || patient.age,
        department: editForm.department,
        clinicalStatus: editForm.clinicalStatus,
        bpm: editForm.bpm,
        temp: editForm.temp,
        spo2: editForm.spo2,
        subscriptionExpiry: editForm.subscriptionExpiry,
        bed: editForm.bed,
      });
      toast.success("Patient details updated successfully!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["patient-timeline", patient.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update patient");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);

    const reportContent = `
      <div style="font-family: 'Helvetica', 'Arial', sans-serif; color: #111; background: #fff; width: 100%;">
        
        <!-- Header -->
        <table style="width: 100%; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px;">
          <tr>
            <td style="vertical-align: middle; width: 60px;">
              <div style="width: 50px; height: 50px; background: #2563eb; color: #fff; border-radius: 8px; text-align: center; line-height: 50px; font-size: 28px; font-weight: bold; font-family: serif;">+</div>
            </td>
            <td style="vertical-align: middle;">
              <h1 style="color: #1e3a8a; margin: 0; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">OptiCare Medical Center</h1>
              <p style="margin: 4px 0 0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Advanced Virtual Ward & Telemetry Unit</p>
            </td>
            <td style="vertical-align: bottom; text-align: right;">
              <p style="margin: 0 0 4px; font-size: 10px; color: #64748b; text-transform: uppercase;">Report Date</p>
              <p style="margin: 0; font-weight: bold; font-size: 13px; color: #1e293b;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </td>
          </tr>
        </table>

        <!-- Report Title -->
        <div style="text-align: center; margin-bottom: 25px; background: #f1f5f9; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
          <h2 style="margin: 0; font-size: 16px; color: #1e293b; text-transform: uppercase; letter-spacing: 2px;">Comprehensive Patient Clinical Report</h2>
        </div>

        <!-- Patient Demographics -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; border: 1px solid #cbd5e1;">
          <tr>
            <th colspan="4" style="background: #e2e8f0; color: #1e293b; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1;">Patient Demographics</th>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: 25%; color: #64748b; font-weight: bold;">Patient Name</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: 25%; font-weight: bold; color: #0f172a; font-size: 14px;">${patient.name}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: 25%; color: #64748b; font-weight: bold;">MRN / Patient ID</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; width: 25%; font-family: monospace; color: #0f172a;">${patient.id.substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">Age</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #0f172a;">${patient.age} Yrs</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">Department</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${patient.department || "General"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-right: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">Bed Allocation</td>
            <td style="padding: 10px 12px; border-right: 1px solid #e2e8f0; color: #0f172a;">${patient.bed}</td>
            <td style="padding: 10px 12px; border-right: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">Clinical Status</td>
            <td style="padding: 10px 12px; font-weight: bold; color: ${patient.clinicalStatus === 'Critical' ? '#dc2626' : '#16a34a'};">${patient.clinicalStatus.toUpperCase()}</td>
          </tr>
        </table>

        <!-- Vitals Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; border: 1px solid #cbd5e1;">
          <tr>
            <th colspan="3" style="background: #e2e8f0; color: #1e293b; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1;">Current Telemetry & Vitals</th>
          </tr>
          <tr>
            <td style="padding: 12px; text-align: center; border-right: 1px solid #e2e8f0; width: 33%;">
              <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Heart Rate</div>
              <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${patient.bpm || "N/A"} <span style="font-size: 11px; color: #64748b; font-weight: normal;">BPM</span></div>
            </td>
            <td style="padding: 12px; text-align: center; border-right: 1px solid #e2e8f0; width: 33%;">
              <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Temperature</div>
              <div style="font-size: 18px; font-weight: bold; color: #d97706;">${patient.temp || "N/A"} <span style="font-size: 11px; color: #64748b; font-weight: normal;">°F</span></div>
            </td>
            <td style="padding: 12px; text-align: center; width: 33%;">
              <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Oxygen Saturation (SpO2)</div>
              <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${patient.spo2 || "N/A"} <span style="font-size: 11px; color: #64748b; font-weight: normal;">%</span></div>
            </td>
          </tr>
        </table>

        <!-- Wound Assessment History -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; font-size: 14px; color: #1e293b; text-transform: uppercase; letter-spacing: 1px;">Wound Analysis & Progress</h3>
          
          ${timeline?.wound_history?.length > 0 ? timeline.wound_history.map((w: any, index: number) => `
            <div style="margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
              <div style="background: ${w.is_infected ? '#fef2f2' : '#f0fdf4'}; border-bottom: 1px solid #cbd5e1; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 12px; color: #1e293b;">Assessment #${timeline.wound_history.length - index} - ${new Date(w.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                <span style="font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 12px; border: 1px solid ${w.is_infected ? '#f87171' : '#4ade80'}; background: #fff; color: ${w.is_infected ? '#dc2626' : '#16a34a'}">${w.is_infected ? '⚠ INFECTED' : '✓ STABLE'}</span>
              </div>
              <div style="padding: 12px; font-size: 11px;">
                <div style="margin-bottom: 10px;">
                  <strong style="color: #64748b; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 2px;">Clinical Notes / Observations</strong>
                  <div style="color: #0f172a; line-height: 1.4;">${w.clinical_notes || "No notes provided."}</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                  <tr>
                    <td style="width: 50%; vertical-align: top; padding-right: 10px; border-right: 1px dashed #cbd5e1;">
                      <strong style="color: #64748b; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 2px;">Medical History</strong>
                      <div style="color: #334155;">${w.medical_history || "N/A"}</div>
                    </td>
                    <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                      <strong style="color: #64748b; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 2px;">Past Wound Progress</strong>
                      <div style="color: #334155;">${w.past_wound_history || "N/A"}</div>
                    </td>
                  </tr>
                </table>
                ${w.detected_keywords && w.detected_keywords.length > 0 ? `
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                    <strong style="color: #64748b; text-transform: uppercase; font-size: 9px; margin-right: 5px;">AI Detected Keywords:</strong>
                    <span style="color: #1e3a8a; font-weight: 600;">${w.detected_keywords.join(', ')}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('') : '<div style="padding: 15px; text-align: center; color: #64748b; font-size: 12px; border: 1px dashed #cbd5e1; background: #f8fafc;">No wound history on record.</div>'}
        </div>

        <!-- Medical Reports -->
        <div style="margin-bottom: 40px;">
          <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; font-size: 14px; color: #1e293b; text-transform: uppercase; letter-spacing: 1px;">Clinical & Laboratory Records</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
            <thead>
              <tr style="background: #e2e8f0; color: #1e293b; text-align: left;">
                <th style="padding: 8px 12px; border-bottom: 1px solid #cbd5e1; width: 25%;">Date & Time</th>
                <th style="padding: 8px 12px; border-bottom: 1px solid #cbd5e1; width: 25%;">Type</th>
                <th style="padding: 8px 12px; border-bottom: 1px solid #cbd5e1; width: 50%;">Description / Name</th>
              </tr>
            </thead>
            <tbody>
              ${timeline?.medical_reports?.length > 0 ? timeline.medical_reports.map((r: any) => `
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${new Date(r.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">${r.report_type}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${r.report_name}</td>
                </tr>
              `).join('') : '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #64748b; font-style: italic;">No records found.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Signature / Footer -->
        <div style="margin-top: 50px; display: flex; justify-content: space-between; border-top: 1px solid #94a3b8; padding-top: 20px;">
          <div style="width: 200px; text-align: center;">
            <div style="border-bottom: 1px solid #1e293b; height: 30px; margin-bottom: 5px;"></div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Attending Physician</div>
          </div>
          <div style="text-align: right; font-size: 9px; color: #94a3b8; line-height: 1.4;">
            <p style="margin: 0;"><strong>OptiCare Electronic Medical Records (EMR)</strong></p>
            <p style="margin: 0;">This document contains confidential health information.</p>
            <p style="margin: 0;">Generated by ID: ADMIN-SYS-09 at ${new Date().toLocaleTimeString('en-US')}</p>
          </div>
        </div>
      </div>
    `;

    // Create a hidden iframe to use the browser's native (and perfect) PDF generator
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>OptiCare_Clinical_Report_${patient.name.replace(/\s+/g, "_")}</title>
            <style>
              @media print {
                @page { margin: 0.5in; size: letter portrait; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
              body { background: white; }
            </style>
          </head>
          <body>
            ${reportContent}
          </body>
        </html>
      `);
      doc.close();

      // Wait for any fonts/styles to apply, then trigger print
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(iframe);
          setIsGenerating(false);
          toast.success("Report ready! Choose 'Save as PDF' in the destination dropdown.");
        }, 100);
      }, 500);
    } else {
      setIsGenerating(false);
      toast.error("Failed to generate report window.");
    }
  };

  const statusColors: Record<string, string> = {
    Critical: "bg-red-500",
    Stable: "bg-emerald-500",
    Recovering: "bg-amber-500",
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto border-none shadow-2xl bg-white/95 backdrop-blur-xl dark:bg-black/95">
        <SheetHeader className="pb-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <User className="h-8 w-8" />
              </div>
              <div>
                <SheetTitle className="text-3xl font-bold tracking-tight">{patient.name}</SheetTitle>
                <SheetDescription className="text-base font-medium">Patient ID: {patient.id}</SheetDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditOpen}
              className="flex items-center gap-2 rounded-xl border-brand/30 text-brand hover:bg-brand/5"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </SheetHeader>

        {/* Edit Patient Overlay Form */}
        {isEditing && (
          <div className="absolute inset-0 z-50 bg-white/98 dark:bg-black/98 backdrop-blur-sm overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Patient Details</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleUpdatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Patient name" />
                </div>
                <div className="space-y-1">
                  <Label>Age</Label>
                  <Input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} placeholder="Age" />
                </div>
                <div className="space-y-1">
                  <Label>Department</Label>
                  <Input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="e.g. Cardiology" />
                </div>
                <div className="space-y-1">
                  <Label>Clinical Status</Label>
                  <select
                    value={editForm.clinicalStatus}
                    onChange={e => setEditForm({...editForm, clinicalStatus: e.target.value})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                    <option value="Recovering">Recovering</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Bed</Label>
                  <Input value={editForm.bed} onChange={e => setEditForm({...editForm, bed: e.target.value})} placeholder="e.g. W1-B01" />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Telemetry</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>BPM</Label>
                    <Input value={editForm.bpm} onChange={e => setEditForm({...editForm, bpm: e.target.value})} placeholder="e.g. 78 bpm" />
                  </div>
                  <div className="space-y-1">
                    <Label>Temp</Label>
                    <Input value={editForm.temp} onChange={e => setEditForm({...editForm, temp: e.target.value})} placeholder="e.g. 37.2°C" />
                  </div>
                  <div className="space-y-1">
                    <Label>SpO2</Label>
                    <Input value={editForm.spo2} onChange={e => setEditForm({...editForm, spo2: e.target.value})} placeholder="e.g. 98%" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Subscription Expiry</Label>
                <Input type="date" value={editForm.subscriptionExpiry} onChange={e => setEditForm({...editForm, subscriptionExpiry: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="py-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="overview" className="rounded-lg font-bold">Overview</TabsTrigger>
              <TabsTrigger value="records" className="rounded-lg font-bold">Records</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg font-bold">Wound History</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 pt-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${statusColors[patient.clinicalStatus] || 'bg-blue-500'}`} />
                    <span className="font-bold text-lg">{patient.clinicalStatus}</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Age</p>
                  <span className="font-bold text-lg">{patient.age} Years</span>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Dept.</p>
                  <span className="font-bold text-lg">{patient.department || "General"}</span>
                </div>
              </div>

              {/* Vitals Section */}
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-2 opacity-70">
                  <Activity className="h-3 w-3" /> Live Telemetry
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Heart, label: "BPM", value: patient.bpm || "N/A", color: "text-red-500" },
                    { icon: Thermometer, label: "Temp", value: patient.temp ? `${patient.temp}°F` : "N/A", color: "text-amber-500" },
                    { icon: Droplets, label: "SpO2", value: patient.spo2 ? `${patient.spo2}%` : "N/A", color: "text-blue-500" },
                  ].map((v) => (
                    <div key={v.label} className="p-3 rounded-xl bg-white shadow-sm border border-border/40 text-center dark:bg-white/5">
                      <v.icon className={`h-4 w-4 mx-auto mb-2 ${v.color}`} />
                      <p className="text-base font-bold leading-tight">{v.value}</p>
                      <p className="text-[9px] uppercase text-muted-foreground font-black">{v.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Details List */}
              <section className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent hover:border-brand/10 transition-all">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-semibold">Bed Allocation</span>
                  </div>
                  <span className="font-bold text-sm">{patient.bed}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-semibold">Last Check-in</span>
                  </div>
                  <span className="font-bold text-sm">{patient.lastCheckIn}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-semibold">Subscription</span>
                  </div>
                  <Badge variant={subStatus === 'expired' ? 'destructive' : 'default'} className="font-bold text-[10px]">
                    {subStatus.toUpperCase()}
                  </Badge>
                </div>
              </section>

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full h-12 rounded-xl text-sm font-bold shadow-brand/10 shadow-lg"
              >
                {isGenerating ? "Generating..." : "Download Clinical Report"}
              </Button>
            </TabsContent>

            {/* MEDICAL RECORDS TAB */}
            <TabsContent value="records" className="space-y-6 pt-6">
              <div className="p-4 rounded-2xl bg-brand/5 border border-brand/10 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-brand">
                  <Upload className="h-4 w-4" /> Upload New Record
                </h4>
                <form onSubmit={onSubmitReport} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Report Name (e.g. ECG Morning)"
                      value={reportForm.name}
                      onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                      className="text-xs h-9 rounded-lg"
                    />
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium"
                      value={reportForm.type}
                      onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    >
                      <option value="ECG">ECG</option>
                      <option value="BP">BP Report</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    className="text-xs h-9 cursor-pointer"
                  />
                  <Button type="submit" disabled={isUploading} className="w-full h-9 text-xs font-bold rounded-lg">
                    {isUploading ? "Uploading..." : "Save Report"}
                  </Button>
                </form>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Historical Records</h4>
                {timeline?.medical_reports?.length > 0 ? (
                  timeline.medical_reports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight">{report.report_name}</p>
                          <p className="text-[10px] text-muted-foreground">{report.report_type} • {new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground opacity-50" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-10" />
                    <p className="text-xs font-medium">No medical records uploaded yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* WOUND HISTORY TAB */}
            <TabsContent value="history" className="space-y-6 pt-6">
              <div className="p-4 mb-6 rounded-2xl bg-brand/5 border border-brand/10 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-brand">
                  <Upload className="h-4 w-4" /> Upload Wound Assessment
                </h4>
                <form onSubmit={onSubmitWound} className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWoundForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="text-xs h-9 cursor-pointer"
                  />
                  <Input
                    placeholder="Clinical Notes"
                    value={woundForm.clinicalNotes}
                    onChange={(e) => setWoundForm({ ...woundForm, clinicalNotes: e.target.value })}
                    className="text-xs h-9 rounded-lg"
                  />
                  <Button type="submit" disabled={isWoundUploading} className="w-full h-9 text-xs font-bold rounded-lg">
                    {isWoundUploading ? "Analyzing & Uploading..." : "Analyze & Save Assessment"}
                  </Button>
                </form>
              </div>

              <div className="relative border-l-2 border-dashed border-brand/20 ml-3 pl-6 space-y-8">
                {timeline?.wound_history?.length > 0 ? (
                  timeline.wound_history.map((assessment: any, idx: number) => (
                    <div key={assessment.id} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[33px] top-0 h-4 w-4 rounded-full bg-brand border-4 border-white shadow-sm" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">{new Date(assessment.created_at).toLocaleDateString()}</p>
                          <Badge variant={assessment.is_infected ? "destructive" : "secondary"} className="text-[9px] font-black">
                            {assessment.is_infected ? "INFECTED" : "STABLE"}
                          </Badge>
                        </div>

                        {assessment.image_url && (
                          <div className="rounded-xl overflow-hidden h-32 w-full bg-muted border border-border/50">
                            <img src={assessment.image_url} alt="Wound" className="h-full w-full object-cover" />
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-muted/30 text-xs space-y-2">
                          {assessment.clinical_notes && (
                            <p className="italic text-muted-foreground line-clamp-2">“{assessment.clinical_notes}”</p>
                          )}

                          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-black/5">
                            <div>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Medical History</p>
                              <p className="font-medium text-[10px]">{assessment.medical_history || "No history recorded."}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Wound Progress</p>
                              <p className="font-medium text-[10px]">{assessment.past_wound_history || "Initial assessment."}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground -ml-6">
                    <History className="h-10 w-10 mx-auto mb-2 opacity-10" />
                    <p className="text-xs font-medium">No wound history available.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PatientDetailsSheet;
