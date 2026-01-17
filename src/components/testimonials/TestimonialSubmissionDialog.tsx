import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Mic, Video, Loader2, CheckCircle } from "lucide-react";
import { TestimonialRecorder } from "./TestimonialRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

interface TestimonialSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TestimonialType = "text" | "audio" | "video" | null;
type SubmissionStep = "type" | "content" | "details" | "recording" | "submitting" | "success";

export function TestimonialSubmissionDialog({ open, onOpenChange }: TestimonialSubmissionDialogProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  const [step, setStep] = useState<SubmissionStep>("type");
  const [testimonialType, setTestimonialType] = useState<TestimonialType>(null);
  const [textContent, setTextContent] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userTitle, setUserTitle] = useState("");
  const [resultHighlight, setResultHighlight] = useState("");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStep("type");
    setTestimonialType(null);
    setTextContent("");
    setDisplayName(profile?.display_name || "");
    setUserTitle("");
    setResultHighlight("");
    setMediaBlob(null);
    setThumbnailBlob(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    } else {
      setDisplayName(profile?.display_name || "");
    }
    onOpenChange(newOpen);
  };

  const handleTypeSelect = (type: TestimonialType) => {
    setTestimonialType(type);
    if (type === "text") {
      setStep("content");
    } else {
      setStep("recording");
    }
  };

  const handleRecordingComplete = (blob: Blob, thumbnail?: Blob) => {
    setMediaBlob(blob);
    if (thumbnail) setThumbnailBlob(thumbnail);
    setStep("details");
  };

  const handleTextNext = () => {
    if (textContent.trim().length < 20) {
      toast.error("Please write at least 20 characters");
      return;
    }
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!user || !testimonialType) return;
    
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }

    setIsSubmitting(true);
    setStep("submitting");

    try {
      let mediaUrl: string | null = null;
      let thumbnailUrl: string | null = null;

      // Upload media if present
      if (mediaBlob && (testimonialType === "audio" || testimonialType === "video")) {
        const ext = testimonialType === "video" ? "webm" : "webm";
        const filePath = `${user.id}/${Date.now()}-${testimonialType}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("testimonials")
          .upload(filePath, mediaBlob, { 
            contentType: testimonialType === "video" ? "video/webm" : "audio/webm" 
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("testimonials")
          .getPublicUrl(filePath);
        
        mediaUrl = urlData.publicUrl;

        // Upload thumbnail for video
        if (thumbnailBlob && testimonialType === "video") {
          const thumbPath = `${user.id}/${Date.now()}-thumbnail.jpg`;
          const { error: thumbError } = await supabase.storage
            .from("testimonials")
            .upload(thumbPath, thumbnailBlob, { contentType: "image/jpeg" });

          if (!thumbError) {
            const { data: thumbUrlData } = supabase.storage
              .from("testimonials")
              .getPublicUrl(thumbPath);
            thumbnailUrl = thumbUrlData.publicUrl;
          }
        }
      }

      // Insert testimonial record
      const { error: insertError } = await supabase
        .from("testimonials")
        .insert({
          user_id: user.id,
          testimonial_type: testimonialType,
          text_content: testimonialType === "text" ? textContent : null,
          media_url: mediaUrl,
          thumbnail_url: thumbnailUrl,
          display_name: displayName.trim(),
          avatar_url: profile?.avatar_url || null,
          user_title: userTitle.trim() || null,
          result_highlight: resultHighlight.trim() || null,
          status: "pending"
        });

      if (insertError) throw insertError;

      setStep("success");
      toast.success("Testimonial submitted for review!");

    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast.error("Failed to submit testimonial. Please try again.");
      setStep("details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bebas tracking-wide">
            {step === "success" ? "Thank You!" : "Share Your Transformation Story"}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Type Selection */}
        {step === "type" && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              How would you like to share your story?
            </p>
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleTypeSelect("text")}
              >
                <MessageSquare className="h-8 w-8 text-primary" />
                <span className="font-medium">Write a Testimonial</span>
                <span className="text-xs text-muted-foreground">Up to 500 characters</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleTypeSelect("audio")}
              >
                <Mic className="h-8 w-8 text-primary" />
                <span className="font-medium">Record Audio</span>
                <span className="text-xs text-muted-foreground">30 seconds max</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleTypeSelect("video")}
              >
                <Video className="h-8 w-8 text-primary" />
                <span className="font-medium">Record Video</span>
                <span className="text-xs text-muted-foreground">30 seconds max</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step: Text Content */}
        {step === "content" && testimonialType === "text" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testimonial-text">Your Story</Label>
              <Textarea
                id="testimonial-text"
                placeholder="Share how Psycho-Cinematics™ has transformed your life..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value.slice(0, 500))}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {textContent.length}/500 characters
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("type")}>
                Back
              </Button>
              <Button variant="gold" onClick={handleTextNext} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step: Recording */}
        {step === "recording" && (testimonialType === "audio" || testimonialType === "video") && (
          <TestimonialRecorder
            type={testimonialType}
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setStep("type")}
          />
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name *</Label>
              <Input
                id="display-name"
                placeholder="John D."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-title">Your Title/Role</Label>
              <Input
                id="user-title"
                placeholder="e.g., Entrepreneur, Life Coach, Executive"
                value={userTitle}
                onChange={(e) => setUserTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result-highlight">Key Result (Optional)</Label>
              <Input
                id="result-highlight"
                placeholder="e.g., Closed my largest deal ever"
                value={resultHighlight}
                onChange={(e) => setResultHighlight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A brief highlight of your transformation
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(testimonialType === "text" ? "content" : "recording")}
              >
                Back
              </Button>
              <Button 
                variant="gold" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex-1"
              >
                Submit for Review
              </Button>
            </div>
          </div>
        )}

        {/* Step: Submitting */}
        {step === "submitting" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Submitting your testimonial...</p>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center space-y-2">
              <p className="font-medium">Your testimonial has been submitted!</p>
              <p className="text-sm text-muted-foreground">
                Our team will review it shortly. Once approved, it will appear on our landing page.
              </p>
            </div>
            <Button variant="gold" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
