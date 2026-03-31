import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChallengeSoundtrack } from "@/hooks/useChallengeSoundtrack";
import { useUserPlaylists } from "@/hooks/useUserPlaylists";
import { MUSIC_STYLES, MusicStyle } from "@/hooks/useMindMovieMusic";
import { useAudio } from "@/contexts/AudioContext";
import { toast } from "sonner";
import { 
  Music, 
  Wand2, 
  Loader2, 
  Sparkles,
  Play,
  Pause,
  Plus,
  ListMusic,
  RefreshCw,
  Check,
  Edit3,
  Volume2
} from "lucide-react";

interface ChallengeSoundtrackGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: {
    id: string;
    situation_description: string;
    emotional_trigger: string;
    target_trait: string;
    scenario_type: string;
  };
  visualizationScript?: string;
}

const STYLE_CATEGORIES = [
  { id: 'hip-hop', label: 'Hip-Hop/Rap' },
  { id: 'pop-electronic', label: 'Pop & Electronic' },
  { id: 'rock', label: 'Rock & Alt' },
  { id: 'orchestral', label: 'Cinematic' },
  { id: 'rnb-soul', label: 'R&B/Soul' },
  { id: 'gospel', label: 'Gospel' },
];

export function ChallengeSoundtrackGenerator({
  open,
  onOpenChange,
  challenge,
  visualizationScript
}: ChallengeSoundtrackGeneratorProps) {
  const [step, setStep] = useState<"style" | "lyrics" | "music" | "complete">("style");
  const [selectedStyle, setSelectedStyle] = useState<MusicStyle>("Hip-Hop Motivational");
  const [selectedCategory, setSelectedCategory] = useState("hip-hop");
  const [editedLyrics, setEditedLyrics] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [vocalGender, setVocalGender] = useState<"m" | "f">("m");
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Use global audio context
  const { 
    isPlaying: globalIsPlaying, 
    audioOwner,
    playAudio, 
    pauseAudio 
  } = useAudio();
  
  // Check if this player "owns" the current playback
  const isPlaying = globalIsPlaying && audioOwner === `challenge-${challenge.id}`;

  const {
    isGeneratingLyrics,
    isGeneratingMusic,
    generatedLyrics,
    soundtrack,
    generateChallengeLyrics,
    generateChallengeMusic,
    checkMusicStatus,
    fetchChallengeSoundtrack,
    setGeneratedLyrics,
  } = useChallengeSoundtrack();

  const { addTrackToPlaylist, getDefaultPlaylist } = useUserPlaylists();

  // Fetch existing soundtrack on open
  useEffect(() => {
    if (open && challenge.id) {
      fetchChallengeSoundtrack(challenge.id).then(existing => {
        if (existing) {
          if (existing.lyrics) {
            setEditedLyrics(existing.lyrics);
            setStep(existing.audio_url ? "complete" : "lyrics");
          }
          if (existing.music_style) {
            setSelectedStyle(existing.music_style as MusicStyle);
          }
        }
      });
    }
  }, [open, challenge.id, fetchChallengeSoundtrack]);

  // Sync editedLyrics with generatedLyrics
  useEffect(() => {
    if (generatedLyrics && !editedLyrics) {
      setEditedLyrics(generatedLyrics);
    }
  }, [generatedLyrics, editedLyrics]);

  // Poll for music status
  useEffect(() => {
    if (soundtrack?.status === "generating" && soundtrack.suno_task_id) {
      const interval = setInterval(async () => {
        const result = await checkMusicStatus(soundtrack.id, soundtrack.suno_task_id!);
        if (result.status === "completed" || result.status === "error") {
          if (interval) clearInterval(interval);
          setPollInterval(null);
          if (result.status === "completed") {
            setStep("complete");
          }
        }
      }, 5000);
      setPollInterval(interval);
      return () => clearInterval(interval);
    }
  }, [soundtrack?.status, soundtrack?.suno_task_id, checkMusicStatus]);

  // Cleanup poll interval
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const handleGenerateLyrics = async () => {
    const visualScript = typeof visualizationScript === 'string' 
      ? visualizationScript 
      : JSON.stringify(visualizationScript);

    const lyrics = await generateChallengeLyrics({
      challengeId: challenge.id,
      situationDescription: challenge.situation_description,
      targetTrait: challenge.target_trait,
      emotionalTrigger: challenge.emotional_trigger,
      scenarioType: challenge.scenario_type,
      visualizationScript: visualScript,
      musicStyle: selectedStyle,
    });

    if (lyrics) {
      setEditedLyrics(lyrics);
      setStep("lyrics");
    }
  };

  const handleGenerateMusic = async () => {
    if (!soundtrack) {
      toast.error("No lyrics saved yet");
      return;
    }

    const title = `${challenge.target_trait} Transformation`;
    await generateChallengeMusic(
      soundtrack.id,
      editedLyrics || generatedLyrics || "",
      selectedStyle,
      title,
      vocalGender
    );
    setStep("music");
  };

  const handleAddToPlaylist = async () => {
    if (!soundtrack?.audio_url) return;

    const defaultPlaylist = await getDefaultPlaylist();
    if (!defaultPlaylist) {
      toast.error("No playlist available");
      return;
    }

    await addTrackToPlaylist(defaultPlaylist.id, {
      title: `${challenge.target_trait} Transformation`,
      artist: "AI Generated",
      audio_url: soundtrack.audio_url,
      source_type: "challenge",
      source_id: challenge.id,
      metadata: {
        trait: challenge.target_trait,
        musicStyle: selectedStyle,
      },
    });
  };

  const togglePlayback = async () => {
    if (!soundtrack?.audio_url) return;

    if (isPlaying) {
      pauseAudio();
    } else {
      await playAudio(soundtrack.audio_url, {
        title: `${challenge.target_trait} Transformation`,
        artist: selectedStyle,
        owner: `challenge-${challenge.id}`,
      });
    }
  };

  const filteredStyles = MUSIC_STYLES.filter(s => s.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[85dvh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-4 pb-2 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Music className="w-5 h-5 text-gold" />
            Challenge Soundtrack
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create a personalized transformation anthem for this challenge
          </DialogDescription>
        </DialogHeader>

        {/* Native scroll container - much more reliable than ScrollArea */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {/* Step 1: Style Selection */}
          {step === "style" && (
            <div className="space-y-4 pt-2">
              <Card className="p-3 bg-muted/50">
                <div className="flex items-start gap-2">
                  <Badge className="bg-gold/20 text-gold border-gold/30 text-xs flex-shrink-0">
                    {challenge.target_trait}
                  </Badge>
                  <p className="text-xs flex-1 line-clamp-2">{challenge.situation_description}</p>
                </div>
              </Card>

              <div className="space-y-3">
                <Label className="text-sm">Choose Your Music Style</Label>
                
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid grid-cols-3 h-auto gap-1 p-1">
                    {STYLE_CATEGORIES.slice(0, 3).map(cat => (
                      <TabsTrigger key={cat.id} value={cat.id} className="text-xs py-1.5 px-2">
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsList className="grid grid-cols-3 h-auto gap-1 p-1 mt-1">
                    {STYLE_CATEGORIES.slice(3).map(cat => (
                      <TabsTrigger key={cat.id} value={cat.id} className="text-xs py-1.5 px-2">
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="grid gap-1.5 max-h-32 overflow-y-auto border border-border/50 rounded-lg p-1.5">
                  {filteredStyles.map(style => (
                    <Card
                      key={style.value}
                      className={`p-2 cursor-pointer transition-all ${
                        selectedStyle === style.value 
                          ? 'border-gold bg-gold/10' 
                          : 'hover:border-muted-foreground/50'
                      }`}
                      onClick={() => setSelectedStyle(style.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-xs">{style.label}</p>
                          <p className="text-[10px] text-muted-foreground">{style.description}</p>
                        </div>
                        {selectedStyle === style.value && (
                          <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Vocal Style</Label>
                <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as "m" | "f")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Male Vocals</SelectItem>
                    <SelectItem value="f">Female Vocals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-xs">Estimated Cost</h4>
                    <p className="text-[10px] text-muted-foreground">
                      Lyrics (~12) + Music (~25)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm font-bold">
                    ~37 credits
                  </Badge>
                </div>
              </Card>

              <Button
                variant="gold"
                className="w-full h-10"
                onClick={handleGenerateLyrics}
                disabled={isGeneratingLyrics}
              >
                {isGeneratingLyrics ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Writing Lyrics...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Transformation Lyrics
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Lyrics Review */}
          {step === "lyrics" && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-display">Your Lyrics</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-7 text-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  {isEditing ? "Done" : "Edit"}
                </Button>
              </div>

              {isEditing ? (
                <Textarea
                  value={editedLyrics}
                  onChange={(e) => setEditedLyrics(e.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                />
              ) : (
                <Card className="p-3 max-h-[200px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs font-sans">
                    {editedLyrics || generatedLyrics}
                  </pre>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={handleGenerateLyrics}
                  disabled={isGeneratingLyrics}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Regenerate
                </Button>
                <Button
                  variant="gold"
                  className="flex-1 h-9 text-sm"
                  onClick={handleGenerateMusic}
                  disabled={isGeneratingMusic || !editedLyrics}
                >
                  {isGeneratingMusic ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Create Music
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Music Generating */}
          {step === "music" && (
            <div className="space-y-4 py-6">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gold/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-gold/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="absolute inset-4 rounded-full bg-gold/40 flex items-center justify-center">
                    <Music className="w-6 h-6 text-gold" />
                  </div>
                </div>
                
                <h3 className="font-display text-lg mb-1">Creating Your Soundtrack</h3>
                <p className="text-muted-foreground text-xs">
                  This usually takes 2-4 minutes. You can close this dialog and check back later.
                </p>
              </div>

              <Progress value={50} className="h-1.5" />
              
              <p className="text-center text-[10px] text-muted-foreground">
                Your {selectedStyle} transformation anthem is being produced...
              </p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && soundtrack?.audio_url && (
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-display text-lg mb-0.5">Your Soundtrack is Ready!</h3>
                <p className="text-muted-foreground text-xs">
                  "{challenge.target_trait} Transformation" - {selectedStyle}
                </p>
              </div>

              {/* Audio Player */}
              <Card className="p-4 bg-gradient-to-br from-gold/10 to-transparent">
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    variant="gold"
                    className="h-12 w-12 rounded-full flex-shrink-0"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{challenge.target_trait} Transformation</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedStyle}</p>
                  </div>

                  <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={handleAddToPlaylist}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add to Playlist
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={() => setStep("style")}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
