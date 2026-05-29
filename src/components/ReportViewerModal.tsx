import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, FileText, Download, Maximize2 } from "lucide-react";

interface ReportViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string | null;
    fileName: string;
}

const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
    isOpen,
    onClose,
    fileUrl,
    fileName,
}) => {
    if (!fileUrl) return null;

    const isPDF = fileUrl.toLowerCase().endsWith(".pdf") || fileUrl.includes(".pdf?");
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl.split('?')[0]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden bg-zinc-950/95 border-brand/20 backdrop-blur-xl flex flex-col">
                <DialogHeader className="p-4 border-b border-white/10 flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand/20 rounded-lg">
                            <FileText className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                            <DialogTitle className="text-white text-lg font-bold">{fileName}</DialogTitle>
                            <p className="text-xs text-zinc-400">Clinical Medical Report</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 h-9"
                            onClick={() => window.open(fileUrl, "_blank")}
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Original
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 w-full bg-black/40 relative flex items-center justify-center p-4">
                    {isPDF ? (
                        <iframe
                            src={`${fileUrl}#toolbar=0`}
                            className="w-full h-full rounded-lg border border-white/5 bg-white shadow-2xl"
                            title="PDF Report Viewer"
                        />
                    ) : isImage ? (
                        <div className="relative group max-w-full max-h-full">
                            <img
                                src={fileUrl}
                                alt="Medical Report"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Button
                                    variant="secondary"
                                    className="rounded-full gap-2 shadow-xl"
                                    onClick={() => window.open(fileUrl, "_blank")}
                                >
                                    <Maximize2 className="h-4 w-4" />
                                    View Full Size
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white/5 rounded-3xl border border-white/10 max-w-md">
                            <div className="h-16 w-16 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-brand" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Unsupported Preview</h3>
                            <p className="text-zinc-400 mb-6 text-sm">
                                This file format cannot be previewed directly. Please download or open it in a new tab.
                            </p>
                            <Button
                                className="bg-brand hover:bg-brand-hover text-white rounded-xl w-full py-6"
                                onClick={() => window.open(fileUrl, "_blank")}
                            >
                                Open File
                            </Button>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-zinc-900/50 border-t border-white/10 flex justify-center gap-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Internal Hospital Viewer — Secure Access Only</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReportViewerModal;
