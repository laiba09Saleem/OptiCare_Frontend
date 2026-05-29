import { Patient } from "@/services/patientService";

export type SubscriptionStatus = "active" | "expiring" | "expired";

export const checkSubscriptionStatus = (patient: Patient): { status: SubscriptionStatus; daysLeft: number } => {
  if (!patient || !patient.subscriptionExpiry) {
    return { status: "active", daysLeft: 30 };
  }

  try {
    const today = new Date();
    const expiry = new Date(patient.subscriptionExpiry);

    if (isNaN(expiry.getTime())) {
      return { status: "active", daysLeft: 30 };
    }

    // Calculate difference in days
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "expired", daysLeft: diffDays };
    } else if (diffDays <= 3) {
      return { status: "expiring", daysLeft: diffDays };
    } else {
      return { status: "active", daysLeft: diffDays };
    }
  } catch (e) {
    return { status: "active", daysLeft: 30 };
  }
};
