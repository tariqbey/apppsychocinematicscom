import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CallLog {
  id: string;
  call_date: string;
  call_status: string;
  duration_seconds: number | null;
  conversation_summary: string | null;
  created_at: string;
}

interface CallHistoryProps {
  userId: string;
}

export const CallHistory = ({ userId }: CallHistoryProps) => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallHistory();
  }, [userId]);

  const fetchCallHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("coaching_call_logs")
        .select("*")
        .eq("user_id", userId)
        .order("call_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error("Error fetching call history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "missed":
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "initiated":
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Phone className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      missed: "destructive",
      failed: "destructive",
      initiated: "secondary",
      in_progress: "secondary",
      pending: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call History
        </CardTitle>
        <CardDescription>
          Your recent coaching calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Phone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No coaching calls yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enable daily calls to get started
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="mt-1">
                    {getStatusIcon(call.call_status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {format(new Date(call.call_date), "EEEE, MMM d")}
                      </span>
                      {getStatusBadge(call.call_status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(call.created_at), "h:mm a")}
                      </span>
                      {call.duration_seconds && (
                        <span>Duration: {formatDuration(call.duration_seconds)}</span>
                      )}
                    </div>
                    
                    {call.conversation_summary && (
                      <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                        {call.conversation_summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
