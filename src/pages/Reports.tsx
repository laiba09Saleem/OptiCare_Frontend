import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/reportService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["reports"],
    queryFn: reportService.getReports,
  });

  const simulateDownload = (title: string, type: string, author: string, id: string) => {
    const reportContent = `
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="color: #1e3a8a;">Clinical Report: ${title}</h1>
          <hr/>
          <p><strong>Report ID:</strong> ${id}</p>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Author:</strong> ${author}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <div style="margin-top: 30px; background: #f3f4f6; padding: 20px; border-radius: 8px;">
            <h3>Executive Summary</h3>
            <p>This is a system-generated clinical report for the OptiCare dashboard. It contains audited data regarding patient vitals and ward performance metrics.</p>
          </div>
          <p style="margin-top: 50px; color: #666; font-size: 12px;">Confidential Medical Record — Virtual Hospital Ward-DR Dashboard</p>
        </body>
      </html>
    `;
    const blob = new Blob([reportContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Report_${id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = (r: any) => {
    setDownloadingId(r.id);
    setTimeout(() => {
      simulateDownload(r.title, r.type, r.author, r.id);
      toast.success(`${r.title} downloaded successfully`);
      setDownloadingId(null);
    }, 1000);
  };

  const handleGenerateNewReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      simulateDownload("Daily Ward Performance Summary", "Administrative", "System", `R-${Math.floor(Math.random() * 9000) + 1000}`);
      toast.success("New report generated and downloaded");
      setIsGenerating(false);
    }, 2000);
  };

  if (isLoading) return <div className="container py-20 text-center text-xl">Loading reports...</div>;
  if (error) return <div className="container py-20 text-center text-xl text-destructive">Error: {(error as Error).message}</div>;

  return (
  <div className="container min-h-screen py-10 animate-in fade-in duration-700">
    <div className="mb-10 flex items-end justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Clinical Reports</h1>
        <p className="mt-2 text-lg text-muted-foreground">Access and generate detailed clinical and administrative reports.</p>
      </div>
      <Button 
        onClick={handleGenerateNewReport}
        disabled={isGenerating}
        className="shadow-elegant flex items-center gap-2"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isGenerating ? "Generating..." : "Generate New Report"}
      </Button>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((r, i) => (
        <Card key={r.id} className="group overflow-hidden border-none bg-white/50 p-8 shadow-lg backdrop-blur-md transition-all hover:shadow-xl dark:bg-black/20" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 transition-transform group-hover:scale-110">
            <FileText className="h-6 w-6 text-brand" />
          </div>
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand/60">{r.type} Report</span>
            <h3 className="mt-1 text-xl font-bold leading-tight">{r.title}</h3>
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{r.author}</span>
              <span>•</span>
              <span>{r.date}</span>
            </p>
            <p className="font-mono text-xs opacity-50">{r.id}</p>
          </div>
          <Button 
            onClick={() => handleDownload(r)}
            disabled={downloadingId === r.id}
            variant="link" 
            className="mt-6 h-auto p-0 font-bold text-brand hover:no-underline flex items-center gap-2"
          >
            {downloadingId === r.id ? "Downloading..." : "Download PDF →"}
          </Button>
        </Card>
      ))}
    </div>
  </div>
  );
};

export default Reports;