import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Mic, 
  Video, 
  Check, 
  X, 
  Trash2, 
  Play,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Testimonial {
  id: string;
  user_id: string;
  testimonial_type: "text" | "audio" | "video";
  text_content: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  display_name: string;
  avatar_url: string | null;
  user_title: string | null;
  result_highlight: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export function TestimonialManager() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setTestimonials((data || []) as Testimonial[]);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleApprove = async (testimonial: Testimonial) => {
    if (!user) return;
    setProcessing(testimonial.id);

    try {
      const { error } = await supabase
        .from("testimonials")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq("id", testimonial.id);

      if (error) throw error;

      setTestimonials(prev => 
        prev.map(t => t.id === testimonial.id 
          ? { ...t, status: "approved" as const, reviewed_at: new Date().toISOString() }
          : t
        )
      );
      toast.success("Testimonial approved!");
    } catch (error) {
      console.error("Error approving testimonial:", error);
      toast.error("Failed to approve testimonial");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedTestimonial) return;
    setProcessing(selectedTestimonial.id);

    try {
      const { error } = await supabase
        .from("testimonials")
        .update({
          status: "rejected",
          admin_notes: rejectReason.trim() || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq("id", selectedTestimonial.id);

      if (error) throw error;

      setTestimonials(prev => 
        prev.map(t => t.id === selectedTestimonial.id 
          ? { ...t, status: "rejected" as const, admin_notes: rejectReason.trim() || null, reviewed_at: new Date().toISOString() }
          : t
        )
      );
      toast.success("Testimonial rejected");
      setRejectDialogOpen(false);
      setSelectedTestimonial(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting testimonial:", error);
      toast.error("Failed to reject testimonial");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (testimonial: Testimonial) => {
    if (!confirm("Are you sure you want to delete this testimonial? This cannot be undone.")) return;
    setProcessing(testimonial.id);

    try {
      // Delete media files if present
      if (testimonial.media_url) {
        const path = testimonial.media_url.split("/testimonials/")[1];
        if (path) {
          await supabase.storage.from("testimonials").remove([path]);
        }
      }
      if (testimonial.thumbnail_url) {
        const path = testimonial.thumbnail_url.split("/testimonials/")[1];
        if (path) {
          await supabase.storage.from("testimonials").remove([path]);
        }
      }

      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", testimonial.id);

      if (error) throw error;

      setTestimonials(prev => prev.filter(t => t.id !== testimonial.id));
      toast.success("Testimonial deleted");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "audio": return <Mic className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredTestimonials = testimonials.filter(t => t.status === activeTab);
  const pendingCount = testimonials.filter(t => t.status === "pending").length;

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-bebas text-2xl tracking-wide flex items-center gap-2">
            Testimonial Manager
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredTestimonials.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No {activeTab} testimonials
                </p>
              ) : (
                filteredTestimonials.map(testimonial => (
                  <Card key={testimonial.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* User Info */}
                        <div className="flex items-start gap-3 shrink-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={testimonial.avatar_url || undefined} />
                            <AvatarFallback>
                              {testimonial.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{testimonial.display_name}</p>
                            {testimonial.user_title && (
                              <p className="text-sm text-muted-foreground">{testimonial.user_title}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="gap-1">
                                {getTypeIcon(testimonial.testimonial_type)}
                                {testimonial.testimonial_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(testimonial.submitted_at), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="flex-1 min-w-0">
                          {testimonial.testimonial_type === "text" && testimonial.text_content && (
                            <p className="text-sm text-foreground/80 line-clamp-3">
                              "{testimonial.text_content}"
                            </p>
                          )}
                          {testimonial.testimonial_type === "audio" && testimonial.media_url && (
                            <audio 
                              src={testimonial.media_url} 
                              controls 
                              className="w-full max-w-md h-10"
                            />
                          )}
                          {testimonial.testimonial_type === "video" && testimonial.media_url && (
                            <div 
                              className="relative w-32 h-20 rounded overflow-hidden cursor-pointer group"
                              onClick={() => setVideoModalUrl(testimonial.media_url)}
                            >
                              {testimonial.thumbnail_url ? (
                                <img 
                                  src={testimonial.thumbnail_url} 
                                  alt="Video thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Video className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          )}
                          {testimonial.result_highlight && (
                            <p className="text-sm text-primary mt-2 font-medium">
                              "{testimonial.result_highlight}"
                            </p>
                          )}
                          {testimonial.admin_notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              Admin notes: {testimonial.admin_notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          {testimonial.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(testimonial)}
                                disabled={processing === testimonial.id}
                                className="gap-1"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRejectDialog(testimonial)}
                                disabled={processing === testimonial.id}
                                className="gap-1"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(testimonial)}
                            disabled={processing === testimonial.id}
                            className="text-destructive hover:text-destructive gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Optionally provide a reason for rejection (this will be stored for your records):
            </p>
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing === selectedTestimonial?.id}
            >
              Reject Testimonial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      {videoModalUrl && (
        <Dialog open={!!videoModalUrl} onOpenChange={() => setVideoModalUrl(null)}>
          <DialogContent className="max-w-3xl p-0 bg-black border-none">
            <video
              src={videoModalUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh] object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
