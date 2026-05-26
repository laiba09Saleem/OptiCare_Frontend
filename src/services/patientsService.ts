const API_URL = "http://localhost:8000";

export const patientsService = {
  async getActivePatients() {
    const token = localStorage.getItem("vw_auth_token");
    const response = await fetch(`${API_URL}/patients/active`, {
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
};
