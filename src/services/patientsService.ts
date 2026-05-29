const API_URL = "http://localhost:8000";

export const patientsService = {
  async getActivePatients(wardName?: string) {
    const token = localStorage.getItem("vw_auth_token");
    const url = wardName
      ? `${API_URL}/patients/active?ward_name=${wardName}`
      : `${API_URL}/patients/active`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch active patients");
    }

    const data = await response.json();
    return data.patients; // Extract from the "patients" key as per mock format
  },

  async addPatient(patientData: any) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to add patient");
    }

    return response.json();
  },

  async updatePatient(patientId: string, patientData: any) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/${patientId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update patient");
    }

    return response.json();
  },

  async uploadReport(formData: FormData) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/medical-reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to upload report");
    }

    return response.json();
  },

  async addWoundAssessment(formData: FormData) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/wound-analysis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to upload wound assessment");
    }

    return response.json();
  },

  async getTimeline(patientId: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patient-timeline/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patient timeline");
    }

    return response.json();
  },

  async getVitalsStats() {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/vitals/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch vitals stats");
    }

    return response.json();
  },

  async getRecentActivities() {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/activity/recent`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recent activities");
    }

    return response.json();
  },

  async getVitalsHistory(patientId: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/${patientId}/vitals-history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patient vitals history");
    }

    return response.json();
  },

  async getPendingWoundReviews() {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/wound-reviews/pending`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch pending wound reviews");
    }

    return response.json();
  },

  async submitWoundReview(reviewId: string, doctorSuggestion: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/wound-reviews/${reviewId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ doctor_suggestion: doctorSuggestion }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to submit wound review");
    }

    return response.json();
  },

  async getActiveAlerts() {
    const token = localStorage.getItem("vw_auth_token");
    try {
      const response = await fetch(`${API_URL}/patients/alerts/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return []; // Return empty if API fails to prevent crash
      }

      return response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async resolveAlert(alertId: string, recommendation?: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/alerts/${alertId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recommendation }),
    });

    if (!response.ok) {
      throw new Error("Failed to resolve alert");
    }

    return response.json();
  },

  async getPrescriptions(patientId: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/${patientId}/prescriptions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch prescriptions");
    }

    return response.json();
  },

  async addPrescription(patientId: string, prescriptionData: any) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/${patientId}/prescriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(prescriptionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to add prescription");
    }

    return response.json();
  },

  async dischargePatient(patientId: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/${patientId}/discharge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to discharge patient");
    }

    return response.json();
  },

  async logMedication(prescriptionId: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/medication/${prescriptionId}/log/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to log medication");
    }

    return response.json();
  },

  async getMedicationHistory(patientId: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/${patientId}/medication-history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch medication history");
    }

    return response.json();
  },

  async deletePrescription(prescriptionId: string) {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/prescriptions/${prescriptionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to stop medication");
    }

    return response.json();
  },

  async getPatientReports(patientId: string) {
    const data = await this.getTimeline(patientId);
    return data.medical_reports || [];
  },
};
