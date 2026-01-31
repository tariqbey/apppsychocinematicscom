import { useState, useEffect } from "react";
import { X, Plus, BookOpen, Sparkles, TrendingUp, Target, Loader2, ChevronDown, ChevronUp, Trash2, Bell, Save, BookMarked, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useJournal, JournalEntry, MOOD_OPTIONS, TAG_OPTIONS } from "@/hooks/useJournal";
import { useSavedInsights, SavedInsight } from "@/hooks/useSavedInsights";
import { MoodTrendChart } from "./MoodTrendChart";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DirectorsJournalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DirectorsJournal({ isOpen, onClose }: DirectorsJournalProps) {
  const {
    entries,
    isLoading,
    isAnalyzing,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    analyzeEntry,
    getProgressReport,
    getAccountabilityReport,
  } = useJournal();

  const {
    insights: savedInsights,
    isLoading: insightsLoading,
    fetchInsights,
    saveInsight,
    deleteInsight,
  } = useSavedInsights();

  const [activeTab, setActiveTab] = useState("write");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [progressReport, setProgressReport] = useState<string | null>(null);
  const [accountabilityReport, setAccountabilityReport] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [savingAccountability, setSavingAccountability] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEntries();
      fetchInsights();
    }
  }, [isOpen, fetchEntries, fetchInsights]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const entry = await createEntry({
      title: title.trim() || undefined,
      content: content.trim(),
      mood: selectedMood || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });

    if (entry) {
      setTitle("");
      setContent("");
      setSelectedMood(null);
      setSelectedTags([]);
      setActiveTab("entries");
    }
  };

  const handleAnalyze = async (entryId: string) => {
    await analyzeEntry(entryId);
  };

  const handleProgressReport = async () => {
    const report = await getProgressReport();
    if (report) setProgressReport(report);
  };

  const handleSaveProgressReport = async () => {
    if (!progressReport) return;
    setSavingProgress(true);
    await saveInsight("progress", `Weekly Progress Report - ${format(new Date(), "MMM d, yyyy")}`, progressReport);
    setSavingProgress(false);
  };

  const handleAccountabilityReport = async () => {
    const report = await getAccountabilityReport();
    if (report) setAccountabilityReport(report);
  };

  const handleSaveAccountabilityReport = async () => {
    if (!accountabilityReport) return;
    setSavingAccountability(true);
    await saveInsight("accountability", `Accountability Check - ${format(new Date(), "MMM d, yyyy")}`, accountabilityReport);
    setSavingAccountability(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display tracking-wide">Director's Journal</h2>
            <p className="text-sm text-muted-foreground">
              Record your journey • AI-powered insights
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-12 w-12 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-full"
        >
          <X className="w-6 h-6 text-gold" />
        </Button>
      </div>
      
      {/* Floating close button for mobile */}
      <Button
        variant="default"
        size="lg"
        onClick={onClose}
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gold/90 hover:bg-gold text-black shadow-lg shadow-gold/30 sm:hidden"
      >
        <X className="w-7 h-7" />
      </Button>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="write" className="gap-2">
                <Plus className="w-4 h-4" />
                Write
              </TabsTrigger>
              <TabsTrigger value="entries" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Entries
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <BookMarked className="w-4 h-4" />
                Saved
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Write Tab */}
          <TabsContent value="write" className="flex-1 p-4 overflow-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="p-6 space-y-4">
                <Input
                  placeholder="Entry title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />

                <Textarea
                  placeholder="What's on your mind, Director? Record your experiences, breakthroughs, challenges, and insights..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />

                {/* Mood Selection */}
                <div>
                  <p className="text-sm font-medium mb-2">How are you feeling?</p>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_OPTIONS.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm transition-all",
                          selectedMood === mood.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {mood.emoji} {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs transition-all",
                          selectedTags.includes(tag)
                            ? "bg-gold text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  className="w-full"
                  variant="gold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Save Entry
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Entries Tab */}
          <TabsContent value="entries" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="max-w-2xl mx-auto space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No entries yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start recording your journey to unlock AI insights
                    </p>
                    <Button onClick={() => setActiveTab("write")} variant="gold">
                      <Plus className="w-4 h-4 mr-2" />
                      Write Your First Entry
                    </Button>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      isExpanded={expandedEntry === entry.id}
                      onToggle={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                      onAnalyze={() => handleAnalyze(entry.id)}
                      onDelete={() => deleteEntry(entry.id)}
                      onUpdate={updateEntry}
                      isAnalyzing={isAnalyzing}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 overflow-auto p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Mood Trend Chart */}
              <MoodTrendChart entries={entries} days={30} />

              {/* Weekly Progress Report */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">Weekly Progress Report</h3>
                      <p className="text-sm text-muted-foreground">AI analysis of your last 7 days</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleProgressReport}
                    disabled={isAnalyzing}
                    variant="outline"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                {progressReport && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{progressReport}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                      onClick={handleSaveProgressReport}
                      disabled={savingProgress}
                    >
                      {savingProgress ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save to Notes
                    </Button>
                  </div>
                )}
              </Card>

              {/* Accountability Report */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">Accountability Check</h3>
                      <p className="text-sm text-muted-foreground">30-day pattern analysis</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAccountabilityReport}
                    disabled={isAnalyzing}
                    variant="outline"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                {accountabilityReport && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{accountabilityReport}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                      onClick={handleSaveAccountabilityReport}
                      disabled={savingAccountability}
                    >
                      {savingAccountability ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save to Notes
                    </Button>
                  </div>
                )}
              </Card>

              {/* Stats Overview */}
              <Card className="p-6">
                <h3 className="font-medium mb-4">Journal Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-gold">{entries.length}</p>
                    <p className="text-xs text-muted-foreground">Total Entries</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gold">
                      {entries.filter(e => e.ai_analysis).length}
                    </p>
                    <p className="text-xs text-muted-foreground">AI Analyzed</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gold">
                      {new Set(entries.flatMap(e => e.tags || [])).size}
                    </p>
                    <p className="text-xs text-muted-foreground">Topics Explored</p>
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Journal Reminders</h3>
                    <p className="text-sm text-muted-foreground">Get notified to write daily</p>
                  </div>
                </div>
                <NotificationSettings compact />
              </Card>
            </div>
          </TabsContent>

          {/* Saved Insights Tab */}
          <TabsContent value="saved" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="max-w-2xl mx-auto space-y-4">
                {insightsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : savedInsights.length === 0 ? (
                  <div className="text-center py-12">
                    <BookMarked className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No Saved Insights</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate insights in the Insights tab and save them here to track your progress over time.
                    </p>
                    <Button onClick={() => setActiveTab("insights")} variant="gold">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Insights
                    </Button>
                  </div>
                ) : (
                  savedInsights.map((insight) => (
                    <SavedInsightCard
                      key={insight.id}
                      insight={insight}
                      onDelete={() => deleteInsight(insight.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onAnalyze: () => void;
  onDelete: () => void;
  onUpdate: (id: string, updates: Partial<JournalEntry>) => Promise<JournalEntry | null>;
  isAnalyzing: boolean;
}

function JournalEntryCard({
  entry,
  isExpanded,
  onToggle,
  onAnalyze,
  onDelete,
  onUpdate,
  isAnalyzing,
}: JournalEntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title || "");
  const [editContent, setEditContent] = useState(entry.content);
  const [editMood, setEditMood] = useState(entry.mood || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    const result = await onUpdate(entry.id, {
      title: editTitle.trim() || null,
      content: editContent.trim(),
      mood: editMood || null,
    });
    setIsSaving(false);
    if (result) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(entry.title || "");
    setEditContent(entry.content);
    setEditMood(entry.mood || "");
    setIsEditing(false);
  };
  const moodInfo = MOOD_OPTIONS.find(m => m.value === entry.mood);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {moodInfo && <span>{moodInfo.emoji}</span>}
            <h3 className="font-medium truncate">
              {entry.title || format(new Date(entry.created_at), "EEEE, MMMM d")}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {entry.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
            {entry.ai_analysis && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Analyzed
              </Badge>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <Input
                placeholder="Entry title (optional)"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-medium"
              />
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px] resize-none"
                placeholder="Write your entry..."
              />
              <div>
                <p className="text-sm font-medium mb-2">How are you feeling?</p>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setEditMood(editMood === mood.value ? "" : mood.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-all",
                        editMood === mood.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {mood.emoji} {mood.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button 
                  variant="gold" 
                  size="sm" 
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Full content */}
              <div>
                <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
              </div>

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* AI Analysis */}
              {entry.ai_analysis ? (
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">AI Insights</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{entry.ai_analysis}</p>
                </div>
              ) : (
                <Button
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                  variant="outline"
                  size="sm"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Get AI Feedback
                </Button>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this journal entry. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

interface SavedInsightCardProps {
  insight: SavedInsight;
  onDelete: () => void;
}

function SavedInsightCard({ insight, onDelete }: SavedInsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getInsightIcon = () => {
    switch (insight.insight_type) {
      case "progress":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "accountability":
        return <Target className="w-4 h-4 text-orange-400" />;
      default:
        return <FileText className="w-4 h-4 text-purple-400" />;
    }
  };

  const getInsightLabel = () => {
    switch (insight.insight_type) {
      case "progress":
        return "Progress Report";
      case "accountability":
        return "Accountability Check";
      default:
        return "Entry Analysis";
    }
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getInsightIcon()}
            <Badge variant="secondary" className="text-xs">
              {getInsightLabel()}
            </Badge>
          </div>
          <h3 className="font-medium truncate">{insight.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {insight.content}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(insight.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{insight.content}</p>
          </div>
          
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete saved insight?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This insight will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </Card>
  );
}