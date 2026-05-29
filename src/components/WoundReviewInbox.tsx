import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { patientsService } from "@/services/patientsService";
import { ClipboardList, Clock, AlertCircle, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";

const WoundReviewInbox = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [suggestion, setSuggestion] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = async () => {
        try {
            const data = await patientsService.getPendingWoundReviews();
            setReviews(data);
        } catch (err) {
            console.error("Error fetching reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleReviewSubmit = async () => {
        if (!suggestion.trim()) {
            toast.error("Please provide a suggestion for the patient");
            return;
        }

        setSubmitting(true);
        try {
            await patientsService.submitWoundReview(selectedReview.id, suggestion);
            toast.success("Review submitted to patient");
            setSelectedReview(null);
            setSuggestion("");
            fetchReviews(); // Refresh list
        } catch (err: any) {
            toast.error(err.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading inbox...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Pending Wound Reviews
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                        {reviews.length}
                    </Badge>
                </h3>
            </div>

            {reviews.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 bg-muted/20">
                    <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                    <p className="text-sm text-muted-foreground">All caught up! No pending reviews.</p>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {reviews.map((review) => (
                        <Card key={review.id} className="p-3 hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-primary" onClick={() => setSelectedReview(review)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${review.is_infected ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold truncate max-w-[150px]">{review.patient_name}</p>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(review.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={review.is_infected ? "destructive" : "secondary"} className="text-[10px] uppercase font-black px-1.5 py-0">
                                        {review.is_infected ? 'Critical' : 'Stable'}
                                    </Badge>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Review Dialog */}
            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-8">
                            <span>Wound Review: {selectedReview?.patient_name}</span>
                            <Badge variant={selectedReview?.is_infected ? "destructive" : "secondary"}>
                                AI Assessment: {selectedReview?.is_infected ? 'INFECTED' : 'NON-INFECTED'}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-6 py-4">
                        {/* Image Section */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Patient Upload</Label>
                            <div className="aspect-square rounded-2xl overflow-hidden bg-black/5 border-2 border-dashed border-primary/20 flex items-center justify-center">
                                {selectedReview?.image_url ? (
                                    <img
                                        src={selectedReview.image_url}
                                        alt="Wound"
                                        className="h-full w-full object-cover"
                                        onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        <Eye className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">No image available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Data & Notes */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-muted/40 space-y-3">
                                <div>
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">AI Confidence</Label>
                                    <p className="text-xl font-black text-primary">{(selectedReview?.infection_score * 100).toFixed(1)}%</p>
                                </div>

                                <div>
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clinical Notes</Label>
                                    <p className="text-sm italic text-foreground bg-white/50 p-3 rounded-xl border border-border/40 mt-1">
                                        "{selectedReview?.clinical_notes || "No notes provided"}"
                                    </p>
                                </div>

                                {selectedReview?.detected_keywords?.length > 0 && (
                                    <div>
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Detected Symbols</Label>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {selectedReview.detected_keywords.map((word: string) => (
                                                <span key={word} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md capitalize">
                                                    🔍 {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-primary">Doctor's Clinical Suggestion</Label>
                                <Textarea
                                    placeholder="Type your medical advice, prescription or follow-up instructions for the patient..."
                                    className="min-h-[120px] rounded-2xl shadow-inner bg-primary/5 focus:bg-white transition-all border-primary/10 focus:border-primary"
                                    value={suggestion}
                                    onChange={(e) => setSuggestion(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelectedReview(null)}>Cancel</Button>
                        <Button
                            onClick={handleReviewSubmit}
                            disabled={submitting}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-xl shadow-elegant"
                        >
                            {submitting ? "Sending..." : "Confirm & Send to Patient"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WoundReviewInbox;
