import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { patientsService } from "@/services/patientsService";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import { PlusCircle, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Switch } from "./ui/switch";

interface AddPatientDialogProps {
  onSuccess: () => void;
}

const AddPatientDialog: React.FC<AddPatientDialogProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [includeWoundAssessment, setIncludeWoundAssessment] = useState(false);


  const [formData, setFormData] = useState({
    name: "",
    age: "",
    department: "Cardiology",
    clinicalStatus: "Stable",
    bed: "",
    bpm: "",
    temp: "",
    spo2: "",
    clinicalNotes: "",
    subscriptionExpiry: new Date().toISOString().split("T")[0],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAiResult(null); // Reset AI result when new image selected
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select a wound image first");
      return;
    }

    setAnalyzing(true);
    try {
      const result = await aiService.analyzeWound(selectedFile, formData.clinicalNotes);
      setAiResult({
        ...result.prediction,
        image_url: result.image_url
      });

      // if image is not
      if (!result.prediction.is_valid_wound) {
        toast.error("Invalid image — please upload a clear wound photograph.");
        return;
      }

      // Auto-update clinical status if infected
      if (result.prediction.is_infected) {
        setFormData(prev => ({ ...prev, clinicalStatus: "Critical" }));
      }

      toast.success("AI Analysis Complete");
    } catch (error: any) {
      toast.error(error.message || "AI Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await patientsService.addPatient({
        ...formData,
        age: parseInt(formData.age),
        aiAssessment: includeWoundAssessment ? aiResult : null,
      });
      toast.success("Patient added successfully");
      setIsOpen(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      department: "Cardiology",
      clinicalStatus: "Stable",
      bed: "",
      bpm: "",
      temp: "",
      spo2: "",
      clinicalNotes: "",
      subscriptionExpiry: new Date().toISOString().split("T")[0],
    });
    setIncludeWoundAssessment(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-elegant flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-black/90">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Patient & AI Assessment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="65"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Clinical Status</Label>
              <Select
                value={formData.clinicalStatus}
                onValueChange={(val) => setFormData({ ...formData, clinicalStatus: val })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Recovering">Recovering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(val) => setFormData({ ...formData, department: val })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bed">Bed Allocation</Label>
              <Input
                id="bed"
                value={formData.bed}
                onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                placeholder="e.g. 12A"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bpm" className="text-xs">BPM</Label>
              <Input
                id="bpm"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                placeholder="e.g. 72"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp" className="text-xs">Temp (°F)</Label>
              <Input
                id="temp"
                value={formData.temp}
                onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                placeholder="e.g. 98.6"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spo2" className="text-xs">SpO2 (%)</Label>
              <Input
                id="spo2"
                value={formData.spo2}
                onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                placeholder="e.g. 98"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            {/* Elegant Switch Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="space-y-0.5">
                <Label htmlFor="wound-assess-toggle" className="text-sm font-bold flex items-center gap-2 text-primary cursor-pointer">
                  <Upload className="h-4 w-4" /> Run AI Wound Assessment
                </Label>
                <p className="text-[11px] text-muted-foreground">Perform automated infection screening and analysis</p>
              </div>
              <Switch
                id="wound-assess-toggle"
                checked={includeWoundAssessment}
                onCheckedChange={setIncludeWoundAssessment}
              />
            </div>

            {/* Collapsible Wound Fields (Only visible when switch is ON) */}
            {includeWoundAssessment && (
              <div className="flex flex-col gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />

                {previewUrl && (
                  <div className="relative rounded-2xl overflow-hidden h-64 w-full bg-muted border-2 border-dashed border-primary/20">
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain bg-black/5" />
                  </div>
                )}

                <Textarea
                  placeholder="Enter clinical notes (e.g. Patient has a deep ulcer and signs of infection...)"
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  className="rounded-xl min-h-[100px] border-border/60 focus:border-primary"
                />

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAnalyze}
                  disabled={analyzing || !selectedFile}
                  className="w-full rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-none font-semibold"
                >
                  {analyzing ? "AI is analyzing image & notes..." : "Run AI Assessment"}
                </Button>

                {aiResult && (
                  <>
                    {/* Invalid Image Card */}
                    {!aiResult.is_valid_wound ? (
                      <div className="p-4 rounded-2xl border-l-4 flex flex-col gap-3 shadow-sm bg-amber-50 border-amber-500 text-amber-900">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-500 p-1.5 rounded-full text-white">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-lg tracking-tight">INVALID IMAGE</p>
                            <p className="text-xs font-medium opacity-70">This does not appear to be a wound photograph</p>
                          </div>
                        </div>
                        <div className="mt-1 pt-3 border-t border-black/5">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Reason:</p>
                          <p className="text-xs italic">{aiResult.rejection_reason}</p>
                          <p className="text-xs mt-2 font-semibold">⚠️ Please upload a clear photograph of the patient's wound to get an accurate AI assessment.</p>
                        </div>
                      </div>
                    ) : (
                      /* Valid Wound Result Card */
                      <div className={`p-4 rounded-2xl border-l-4 flex flex-col gap-3 shadow-sm ${aiResult.is_infected || aiResult.has_critical_keywords ? 'bg-red-50 border-red-500 text-red-900' : 'bg-green-50 border-green-500 text-green-900'}`}>
                        <div className="flex items-center gap-3">
                          {aiResult.is_infected || aiResult.has_critical_keywords ?
                            <div className="bg-red-500 p-1.5 rounded-full text-white"><AlertCircle className="h-5 w-5" /></div> :
                            <div className="bg-green-500 p-1.5 rounded-full text-white"><CheckCircle2 className="h-5 w-5" /></div>
                          }
                          <div className="flex-1">
                            <p className="font-black text-lg tracking-tight">
                              RESULT: {(aiResult.is_infected || aiResult.has_critical_keywords) ? 'INFECTED' : 'NON-INFECTED'}
                            </p>
                            <p className="text-xs font-medium opacity-70">
                              AI Confidence Level: {(aiResult.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="mt-1 pt-3 border-t border-black/5">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60">SmartPath Intelligence Report:</p>
                          {aiResult.detected_keywords && aiResult.detected_keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {aiResult.detected_keywords.map((word: string) => (
                                <span key={word} className="px-2.5 py-1 bg-white/80 border border-current/10 rounded-lg text-xs font-bold shadow-sm capitalize">
                                  🔍 {word}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs italic opacity-50">No medical keywords detected in notes.</p>
                          )}

                          {aiResult.has_critical_keywords && (
                            <div className="mt-3 p-2 bg-red-100/50 rounded-lg border border-red-200">
                              <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                CRITICAL ALERT: Clinical notes indicate high infection risk!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Subscription Expiry</Label>
            <Input
              id="expiry"
              type="date"
              required
              value={formData.subscriptionExpiry}
              onChange={(e) => setFormData({ ...formData, subscriptionExpiry: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl mt-4" disabled={loading}>
            {loading ? "Saving Patient..." : "Add Patient & Save Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientDialog;
