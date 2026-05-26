import { authService } from "./authService";

const API_URL = "http://localhost:8000";

export interface Report {
  id: string;
  title: string;
  date: string;
  author: string;
  type: string;
}

export const reportService = {
  async getReports(): Promise<Report[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/reports`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch reports");
    }

    const data = await response.json();
    return data;
  },
};
