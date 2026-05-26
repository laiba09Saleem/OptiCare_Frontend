import React from 'react';
import { Calendar, User, Clock, CreditCard } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

import { Patient } from '@/services/patientService';
import { checkSubscriptionStatus } from '@/lib/subscriptionUtils';
import PatientDetailsSheet from './PatientDetailsSheet';

interface PatientCardProps {
  patient: Patient;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const { status: subStatus, daysLeft } = checkSubscriptionStatus(patient);

  const statusStyles = {
    Critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    Stable: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Recovering: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  const subStyles = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    expiring: 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse',
    expired: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <>
      <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 dark:bg-black/20">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <User className="h-6 w-6" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`font-bold uppercase tracking-tighter ${statusStyles[patient.clinicalStatus]}`}>
              {patient.clinicalStatus}
            </Badge>
            <Badge variant="outline" className={`text-[10px] font-bold uppercase ${subStyles[subStatus]}`}>
              {subStatus === 'active' && 'Subscription Active'}
              {subStatus === 'expiring' && `Expiring (${daysLeft} days left)`}
              {subStatus === 'expired' && 'Expired'}
            </Badge>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-bold tracking-tight">{patient.name}</h3>
          <p className="text-sm text-muted-foreground">{patient.age} Years Old • Patient ID</p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-brand" />
            <span>Last Check-in: <span className="font-medium text-foreground">{patient.lastCheckIn}</span></span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 text-brand" />
            <span>Subscription Expiry: <span className="font-medium text-foreground">{patient.subscriptionExpiry}</span></span>
          </div>
        </div>

        {/* Mini Digital Telemetry Screen - YAHAN PASTE KAREIN */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-b border-border/40 py-3">
          {/* Heart Rate (BPM) */}
          <div className={`p-2 rounded-xl text-center shadow-inner ${(parseInt(patient.bpm) > 100 || parseInt(patient.bpm) < 60)
            ? 'bg-red-500/10 text-red-500 border border-red-500/30 animate-pulse'
            : 'bg-muted/30 text-foreground border border-transparent'
            }`}>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">BPM</p>
            <p className="text-sm font-extrabold">{patient.bpm || "N/A"}</p>
          </div>

          {/* Oxygen (SpO2) */}
          <div className={`p-2 rounded-xl text-center shadow-inner ${(parseInt(patient.spo2) < 95)
            ? 'bg-red-500/10 text-red-500 border border-red-500/30 animate-pulse'
            : 'bg-muted/30 text-foreground border border-transparent'
            }`}>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">SpO2</p>
            <p className="text-sm font-extrabold">{patient.spo2 || "N/A"}%</p>
          </div>

          {/* Temperature */}
          <div className={`p-2 rounded-xl text-center shadow-inner ${(parseFloat(patient.temp) > 100.4)
            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-pulse'
            : 'bg-muted/30 text-foreground border border-transparent'
            }`}>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">Temp</p>
            <p className="text-sm font-extrabold">{patient.temp || "N/A"}°F</p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => setIsDetailsOpen(true)}
            className="w-full shadow-elegant transition-all hover:scale-[1.02]"
            variant="default"
          >
            View Details
          </Button>
        </div>

        <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-brand/5 transition-all duration-500 group-hover:scale-150" />
      </div>


      <PatientDetailsSheet
        patient={patient}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
};

export default PatientCard;
