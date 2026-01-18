import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChallengeSoundtrack } from "@/hooks/useChallengeSoundtrack";
import { useUserPlaylists } from "@/hooks/useUserPlaylists";
import { MUSIC_STYLES, MusicStyle } from "@/hooks/useMindMovieMusic";
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
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

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

  const togglePlayback = () => {
    if (!soundtrack?.audio_url) return;

    if (!audioRef) {
      const audio = new Audio(soundtrack.audio_url);
      audio.onended = () => setIsPlaying(false);
      setAudioRef(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const filteredStyles = MUSIC_STYLES.filter(s => s.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Music className="w-5 h-5 text-gold" />
            Challenge Soundtrack
          </DialogTitle>
          <DialogDescription>
            Create a personalized transformation anthem for this challenge
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          {/* Step 1: Style Selection */}
          {step === "style" && (
            <div className="space-y-6 py-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <Badge className="bg-gold/20 text-gold border-gold/30">
                    {challenge.target_trait}
                  </Badge>
                  <p className="text-sm flex-1">{challenge.situation_description}</p>
                </div>
              </Card>

              <div className="space-y-4">
                <Label>Choose Your Music Style</Label>
                
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    {STYLE_CATEGORIES.slice(0, 3).map(cat => (
                      <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsList className="grid grid-cols-3">
                    {STYLE_CATEGORIES.slice(3).map(cat => (
                      <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {filteredStyles.map(style => (
                    <Card
                      key={style.value}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedStyle === style.value 
                          ? 'border-gold bg-gold/10' 
                          : 'hover:border-muted-foreground/50'
                      }`}
                      onClick={() => setSelectedStyle(style.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{style.label}</p>
                          <p className="text-xs text-muted-foreground">{style.description}</p>
                        </div>
                        {selectedStyle === style.value && (
                          <Check className="w-4 h-4 text-gold" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vocal Style</Label>
                <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as "m" | "f")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Male Vocals</SelectItem>
                    <SelectItem value="f">Female Vocals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Estimated Cost</h4>
                    <p className="text-xs text-muted-foreground">
                      Lyrics (~12 credits) + Music (~25 credits)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">
                    ~37 credits
                  </Badge>
                </div>
              </Card>

              <Button
                variant="gold"
                className="w-full"
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
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-display">Your Lyrics</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {isEditing ? "Done" : "Edit"}
                </Button>
              </div>

              {isEditing ? (
                <Textarea
                  value={editedLyrics}
                  onChange={(e) => setEditedLyrics(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              ) : (
                <Card className="p-4 max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {editedLyrics || generatedLyrics}
                  </pre>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleGenerateLyrics}
                  disabled={isGeneratingLyrics}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={handleGenerateMusic}
                  disabled={isGeneratingMusic || !editedLyrics}
                >
                  {isGeneratingMusic ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Create Music
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Music Generating */}
          {step === "music" && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gold/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-gold/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="absolute inset-4 rounded-full bg-gold/40 flex items-center justify-center">
                    <Music className="w-8 h-8 text-gold" />
                  </div>
                </div>
                
                <h3 className="font-display text-xl mb-2">Creating Your Soundtrack</h3>
                <p className="text-muted-foreground text-sm">
                  This usually takes 2-4 minutes. You can close this dialog and check back later.
                </p>
              </div>

              <Progress value={50} className="h-2" />
              
              <p className="text-center text-xs text-muted-foreground">
                Your {selectedStyle} transformation anthem is being produced...
              </p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && soundtrack?.audio_url && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-display text-xl mb-1">Your Soundtrack is Ready!</h3>
                <p className="text-muted-foreground text-sm">
                  "{challenge.target_trait} Transformation" - {selectedStyle}
                </p>
              </div>

              {/* Audio Player */}
              <Card className="p-6 bg-gradient-to-br from-gold/10 to-transparent">
                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    variant="gold"
                    className="h-16 w-16 rounded-full"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <p className="font-medium">{challenge.target_trait} Transformation</p>
                    <p className="text-sm text-muted-foreground">{selectedStyle}</p>
                  </div>

                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleAddToPlaylist}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to My Playlist
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("style")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
