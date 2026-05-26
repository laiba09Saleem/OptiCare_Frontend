import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { patientService, Patient } from "@/services/patientService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PatientDetailsSheet from "@/components/PatientDetailsSheet";

const statusVariant = (s: string) =>
  s === "Critical" ? "destructive" : s === "Recovering" ? "secondary" : "default";

const Patients = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: patients, isLoading, error } = useQuery({
    queryKey: ["patients"],
    queryFn: patientService.getPatients,
  });

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsSheetOpen(true);
  };

  if (isLoading) return <div className="container py-20 text-center text-xl">Loading patients...</div>;
  if (error) return <div className="container py-20 text-center text-xl text-destructive">Error: {(error as Error).message}</div>;

  return (
  <div className="container min-h-screen py-10 animate-in fade-in duration-700">
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Master Patient List</h1>
        <p className="mt-2 text-lg text-muted-foreground">Comprehensive record of all patients, including active and historical records.</p>
      </div>
    </div>

    <Card className="overflow-hidden border-none bg-white/50 shadow-xl backdrop-blur-md dark:bg-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <th className="px-6 py-4">Patient ID</th>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Age</th>
              <th className="px-6 py-4">Bed Allocation</th>
              <th className="px-6 py-4">Clinical Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {patients.map((p) => (
              <tr key={p.id} className="group transition-colors hover:bg-brand/5">
                <td className="px-6 py-4 font-mono text-xs text-brand font-semibold">{p.id}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-base">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Inpatient</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{p.age} Yrs</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="border-brand/20 bg-brand/5 text-brand font-bold uppercase tracking-tighter">{p.bed}</Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full animate-pulse ${p.clinicalStatus === 'Critical' ? 'bg-destructive' : p.clinicalStatus === 'Recovering' ? 'bg-emerald-500' : 'bg-brand'}`} />
                    <Badge variant={statusVariant(p.clinicalStatus)} className="font-semibold">{p.clinicalStatus}</Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Button 
                    onClick={() => handleViewDetails(p)}
                    variant="ghost" 
                    size="sm" 
                    className="font-bold text-brand hover:bg-brand/10 hover:text-brand"
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    <PatientDetailsSheet 
      patient={selectedPatient} 
      isOpen={isSheetOpen} 
      onClose={() => setIsSheetOpen(false)} 
    />
  </div>
  );
};

export default Patients;