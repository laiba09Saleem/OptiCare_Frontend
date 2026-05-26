import React from 'react';
import PatientCard from './PatientCard';
import { Skeleton } from './ui/skeleton';
import { UserX } from 'lucide-react';

import { Patient } from '@/services/patientService';
import { checkSubscriptionStatus } from '@/lib/subscriptionUtils';

interface PatientListProps {
  patients?: Patient[];
  isLoading?: boolean;
  showExpired?: boolean;
}

const PatientList: React.FC<PatientListProps> = ({ patients = [], isLoading = false, showExpired = false }) => {
  const displayedPatients = showExpired
    ? patients
    : patients.filter(p => {
      const { status } = checkSubscriptionStatus(p);
      return status !== "expired";
    });

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[300px] rounded-3xl border border-border bg-card/50 p-6 animate-pulse">
            <div className="flex justify-between">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-8 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="mt-8 h-12 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayedPatients.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <UserX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">No patients found</h3>
        <p className="mt-2 text-muted-foreground max-w-sm">
          We couldn't find any patients matching your search or filters. Please try again or add a new patient.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {displayedPatients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
};

export default PatientList;
