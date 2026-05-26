const API_URL = "https://laiba05saleem-opticare-ward.hf.space";

export const aiService = {
  async analyzeWound(file: File, clinicalNotes: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clinical_notes", clinicalNotes);

    const response = await fetch(`${API_URL}/api/wound/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to analyze wound");
    }

    return response.json();
  },
};
