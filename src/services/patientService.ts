import { authService } from "./authService";

const API_URL = "https://laiba05saleem-opticare-backend.hf.space";

export interface Patient {
  id: string;
  name: string;
  bed: string;
  department?: string;
  bpm?: string;
  temp?: string;
  spo2?: string;
  clinicalStatus: "Critical" | "Stable" | "Recovering";
  age: number;
  lastCheckIn: string;
  subscriptionExpiry: string;
}

export const patientService = {
  async getPatients(): Promise<Patient[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/patients`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patients");
    }

    return response.json();
  },
};
