import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Music, Sparkles, Loader2, Library, Brain, Target, Check,
  Upload, Play, Pause, FolderOpen, Settings2, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserPlaylists, type PlaylistTrack } from "@/hooks/useUserPlaylists";
import { useMindMovieMusic, type MusicStyle } from "@/hooks/useMindMovieMusic";
import { MusicStyleSelector } from "@/components/soundtrack/MusicStyleSelector";
import { MusicCustomizationPanel, defaultMusicCustomization, getCustomizationStyleTags, type MusicCustomization } from "@/components/soundtrack/MusicCustomizationPanel";
import { SongVersionCard } from "@/components/soundtrack/SongVersionCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Soundtrack() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile, refetch: refetchProfile } = useUserProfile();
  const { playlists, tracks, fetchPlaylistTracks, addTrackToPlaylist, getDefaultPlaylist } = useUserPlaylists();
  
  const [songTitle, setSongTitle] = useState("My Soundtrack");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customStyleText, setCustomStyleText] = useState("");
  const [songCount, setSongCount] = useState<1 | 2>(1);
  const [fromAnalysis, setFromAnalysis] = useState(false);
  const [fromChiefAim, setFromChiefAim] = useState(false);
  const [isSettingAsChiefAimSong, setIsSettingAsChiefAimSong] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "library">("generate");
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  const [previewTrack, setPreviewTrack] = useState<PlaylistTrack | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [musicCustomization, setMusicCustomization] = useState<MusicCustomization>(defaultMusicCustomization);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isGeneratingLyrics,
    isGeneratingMusic,
    generatedLyrics,
    soundtrackUrl,
    musicStyle,
    setMusicStyle,
    vocalGender,
    setVocalGender,
    personaId,
    setPersonaId,
    generationStatus,
    songs,
    generateLyrics,
    generateMusic,
    regenerateMusic,
    saveToLibrary,
    setGeneratedLyrics,
  } = useMindMovieMusic();

  // Get chief aim from profile
  const chiefAim = {
    what: profile?.chief_aim_what || "",
    byWhen: profile?.chief_aim_by_when || "",
    exchange: profile?.chief_aim_exchange || "",
    plan: profile?.chief_aim_plan || "",
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Check if coming from Character Analysis
  useEffect(() => {
    const isFromAnalysis = searchParams.get("fromAnalysis") === "true";
    if (isFromAnalysis) {
      const analysisContext = sessionStorage.getItem("analysis-lyrics-context");
      if (analysisContext) {
        setCustomPrompt(analysisContext);
        setSongTitle("My Character Anthem");
        setFromAnalysis(true);
        // Clear the session storage
        sessionStorage.removeItem("analysis-lyrics-context");
        toast.success("Analysis loaded! Choose a style and generate your anthem.");
      }
    }
  }, [searchParams]);

  // Check if coming from Chief Aim card
  useEffect(() => {
    const isFromChiefAim = searchParams.get("fromChiefAim") === "true";
    if (isFromChiefAim) {
      const chiefAimContext = sessionStorage.getItem("chief-aim-lyrics-context");
      if (chiefAimContext) {
        // Also fetch character traits to enrich the context
        fetchCharacterContext(chiefAimContext);
      }
    }
  }, [searchParams, user]);

  const fetchCharacterContext = async (baseContext: string) => {
    if (!user) return;
    
    try {
      // Fetch character profile for archetype and traits
      const { data: characterProfile } = await supabase
        .from("character_profiles")
        .select("archetype, archetype_score, transformation_analysis")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let enrichedContext = baseContext;
      
      if (characterProfile) {
        enrichedContext += "\n\n## MY CHARACTER PROFILE";
        
        if (characterProfile.archetype) {
          enrichedContext += `\n\n**My Archetype:** ${characterProfile.archetype}`;
        }
        
        // Extract key traits from archetype_score if available
        if (characterProfile.archetype_score && typeof characterProfile.archetype_score === 'object') {
          const scores = characterProfile.archetype_score as Record<string, number>;
          const topTraits = Object.entries(scores)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([trait]) => trait);
          
          if (topTraits.length > 0) {
            enrichedContext += `\n\n**My Strongest Traits:** ${topTraits.join(", ")}`;
          }
        }
        
        // Add transformation insights if available
        if (characterProfile.transformation_analysis && typeof characterProfile.transformation_analysis === 'object') {
          const analysis = characterProfile.transformation_analysis as Record<string, unknown>;
          if (analysis.strengths && Array.isArray(analysis.strengths)) {
            enrichedContext += `\n\n**My Strengths:** ${(analysis.strengths as string[]).join(", ")}`;
          }
          if (analysis.growthEdges && Array.isArray(analysis.growthEdges)) {
            enrichedContext += `\n\n**Areas I'm Growing:** ${(analysis.growthEdges as string[]).join(", ")}`;
          }
        }
      }
      
      setCustomPrompt(enrichedContext);
      setSongTitle("My Chief Aim Anthem");
      setFromChiefAim(true);
      sessionStorage.removeItem("chief-aim-lyrics-context");
      toast.success("Chief Aim loaded with your character traits! Choose a style and create your anthem.");
    } catch (error) {
      console.error("Error fetching character context:", error);
      // Fall back to base context
      setCustomPrompt(baseContext);
      setSongTitle("My Chief Aim Anthem");
      setFromChiefAim(true);
      sessionStorage.removeItem("chief-aim-lyrics-context");
    }
  };

  const handleSetAsChiefAimSong = async (audioUrl: string) => {
    if (!user) return;
    
    setIsSettingAsChiefAimSong(true);
    try {
      await updateProfile({ chief_aim_song_url: audioUrl } as any);
      refetchProfile();
      toast.success("Set as your Chief Aim Anthem! You can now listen to it in your daily ritual.");
      navigate(-1);
    } catch (error) {
      console.error("Error setting chief aim song:", error);
      toast.error("Failed to set as Chief Aim song");
    } finally {
      setIsSettingAsChiefAimSong(false);
    }
  };

  // Fetch library tracks when switching to library tab
  useEffect(() => {
    if (activeTab === "library" && playlists.length > 0) {
      fetchPlaylistTracks(playlists[0].id);
    }
  }, [activeTab, playlists]);

  // Handle audio preview
  const togglePreview = (track: PlaylistTrack) => {
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
    }

    if (previewTrack?.id === track.id) {
      if (isPreviewPlaying) {
        audioPreviewRef.current.pause();
        setIsPreviewPlaying(false);
      } else {
        audioPreviewRef.current.play();
        setIsPreviewPlaying(true);
      }
    } else {
      audioPreviewRef.current.src = track.audio_url;
      audioPreviewRef.current.play();
      setPreviewTrack(track);
      setIsPreviewPlaying(true);
    }
  };

  // Handle file upload
  const handleUploadTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // More permissive audio type detection
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac'];
    const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i;
    const hasValidType = allowedTypes.includes(file.type) || file.type.startsWith('audio/');
    const hasValidExtension = audioExtensions.test(file.name);
    
    console.log(`[Soundtrack Upload] File: ${file.name}, Type: ${file.type}, ValidType: ${hasValidType}, ValidExt: ${hasValidExtension}`);

    if (!hasValidType && !hasValidExtension) {
      toast.error('Please upload an audio file (MP3, WAV, OGG, or M4A)');
      return;
    }

    setIsUploadingTrack(true);

    try {
      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;
      
      console.log(`[Soundtrack Upload] Uploading: ${fileName}, Size: ${file.size} bytes`);
      
      const { error: uploadError } = await supabase.storage
        .from('generated-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`[Soundtrack Upload] Storage error:`, uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('generated-media')
        .getPublicUrl(fileName);

      // Add to default playlist
      const targetPlaylist = await getDefaultPlaylist();
      if (targetPlaylist) {
        await addTrackToPlaylist(targetPlaylist.id, {
          title: file.name.replace(/\.[^/.]+$/, ''),
          audio_url: publicUrl,
          source_type: 'upload',
        });
        await fetchPlaylistTracks(targetPlaylist.id);
      }

      if (fromChiefAim) {
        // Set as Chief Aim song directly
        await handleSetAsChiefAimSong(publicUrl);
      } else {
        toast.success('Track uploaded to your library!');
      }
    } catch (error: any) {
      console.error('[Soundtrack Upload] Error:', error?.message || error);
      toast.error('Failed to upload track');
    } finally {
      setIsUploadingTrack(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cleanup audio preview on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const handleGenerateLyrics = async () => {
    if (!chiefAim.what && !customPrompt) {
      toast.error("Please enter a custom prompt or set up your Chief Aim first");
      return;
    }

    // Create a scene-like structure from the custom prompt
    const scenes = customPrompt ? [{
      order: 1,
      title: "Custom Vision",
      narrative: customPrompt,
      emotional_tone: "inspirational"
    }] : [];

    // Use custom prompt as chief aim override if provided
    const effectiveAim = customPrompt ? {
      what: customPrompt,
      byWhen: chiefAim.byWhen,
      exchange: chiefAim.exchange,
      plan: chiefAim.plan,
    } : chiefAim;

    await generateLyrics(
      effectiveAim, 
      scenes, 
      musicStyle,
      musicStyle === 'Custom' ? customStyleText : undefined
    );
  };

  const handleGenerateMusic = async () => {
    if (!generatedLyrics) {
      toast.error("Generate lyrics first");
      return;
    }

    // Use a temporary script ID for standalone generation
    const tempScriptId = `standalone-${Date.now()}`;
    
    // Combine base style with customization tags
    const customizationTags = getCustomizationStyleTags(musicCustomization);
    const effectiveStyle = musicStyle === 'Custom' 
      ? `${customStyleText}, ${customizationTags}`
      : `${musicStyle}, ${customizationTags}`;
    
    await generateMusic(
      generatedLyrics,
      songTitle,
      tempScriptId,
      effectiveStyle,
      songCount
    );
  };

  const handleRegenerateSong = async (index: number) => {
    if (!generatedLyrics) return;
    
    setRegeneratingIndex(index);
    const tempScriptId = `standalone-regen-${Date.now()}`;
    
    // Combine base style with customization tags
    const customizationTags = getCustomizationStyleTags(musicCustomization);
    const effectiveStyle = musicStyle === 'Custom' 
      ? `${customStyleText}, ${customizationTags}`
      : `${musicStyle}, ${customizationTags}`;
    
    try {
      await regenerateMusic(
        generatedLyrics,
        songTitle,
        tempScriptId,
        effectiveStyle,
        1 // Regenerate single song
      );
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleSaveToLibrary = async (songIndex?: number) => {
    if (!generatedLyrics) return;
    await saveToLibrary(songTitle, generatedLyrics, songIndex);
    toast.success("Soundtrack saved to your library!");
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-gold animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-gold" />
              <h1 className="text-xl font-display tracking-wide">Soundtrack Studio</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/score")}
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <Music className="w-4 h-4 mr-2" />
              The Score
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/actions")}
            >
              <Library className="w-4 h-4 mr-2" />
              Media Library
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* From Analysis Banner */}
          {fromAnalysis && (
            <Card className="border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-gold/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="font-semibold text-purple-400">Creating from Character Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    Your analysis has been loaded. Choose a music style below and generate your personalized anthem!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* From Chief Aim Banner */}
          {fromChiefAim && (
            <Card className="border-gold/50 bg-gradient-to-r from-gold/10 to-amber-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="w-6 h-6 text-gold" />
                <div>
                  <p className="font-semibold text-gold">Set Your Chief Aim Anthem</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a new song, pick from your library, or upload your own track.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Intro Card */}
          <Card className="border-gold/20 bg-gradient-to-r from-gold/5 to-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                {fromChiefAim ? "Choose Your Chief Aim Anthem" : fromAnalysis ? "Create Your Character Anthem" : "Create Your Soundtrack"}
              </CardTitle>
              <CardDescription>
                {fromChiefAim 
                  ? "Pick an existing song from your library, upload your own, or generate a new AI-powered anthem."
                  : "Generate AI-powered music and lyrics for your visualizations, movies, or personal motivation."}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Tabs for Chief Aim: Generate vs Library */}
          {fromChiefAim && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "generate" | "library")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="generate" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate New
                </TabsTrigger>
                <TabsTrigger value="library" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  My Library
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2" onClick={() => setActiveTab("upload" as any)}>
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              {/* Library Tab Content */}
              <TabsContent value="library" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Music className="w-5 h-5 text-gold" />
                      Pick from Your Score Library
                    </CardTitle>
                    <CardDescription>
                      Select any song from your library to use as your Chief Aim Anthem.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tracks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No tracks in your library yet.</p>
                        <p className="text-sm">Generate or upload a track first!</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                          {tracks.map((track) => (
                            <div 
                              key={track.id} 
                              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-gold/20 hover:bg-gold/30"
                                onClick={() => togglePreview(track)}
                              >
                                {previewTrack?.id === track.id && isPreviewPlaying ? (
                                  <Pause className="w-4 h-4 text-gold" />
                                ) : (
                                  <Play className="w-4 h-4 text-gold" />
                                )}
                              </Button>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{track.title}</p>
                                {track.artist && (
                                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                )}
                              </div>
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => handleSetAsChiefAimSong(track.audio_url)}
                                disabled={isSettingAsChiefAimSong}
                              >
                                {isSettingAsChiefAimSong ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Use This
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Upload Tab Content */}
              <TabsContent value="upload" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Upload className="w-5 h-5 text-gold" />
                      Upload Your Own Music
                    </CardTitle>
                    <CardDescription>
                      Upload an MP3, WAV, or M4A file from your computer to use as your anthem.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleUploadTrack}
                      disabled={isUploadingTrack}
                    />
                    <div 
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploadingTrack ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-gold animate-spin" />
                          <p className="text-muted-foreground">Uploading and setting as anthem...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                          <p className="font-medium">Click to upload your music file</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            MP3, WAV, OGG, or M4A • Max 50MB
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Step 1: Configure - only show if not using tabs OR if in generate tab */}
          {(!fromChiefAim || activeTab === "generate") && (
            <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{fromChiefAim ? "Generate New Anthem" : "1. Configure Your Track"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              {/* Song Title */}
              <div className="space-y-2">
                <Label htmlFor="songTitle">Song Title</Label>
                <Input
                  id="songTitle"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="My Transformation Anthem"
                />
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt">
                  Custom Theme / Prompt
                  <span className="text-muted-foreground text-sm ml-2">
                    (optional - uses your Chief Aim if empty)
                  </span>
                </Label>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe what you want your song to be about... your goals, dreams, the feeling you want to capture"
                  className="min-h-[100px]"
                />
              </div>

              {/* Music Style Selector */}
              <MusicStyleSelector
                value={musicStyle}
                onChange={(v) => setMusicStyle(v as MusicStyle)}
                customStyleText={customStyleText}
                onCustomStyleTextChange={setCustomStyleText}
              />

              {/* Advanced Settings Collapsible */}
              <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Advanced Music Settings
                    </div>
                    {showAdvancedSettings ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <MusicCustomizationPanel
                    customization={musicCustomization}
                    onChange={setMusicCustomization}
                    vocalGender={vocalGender}
                    onVocalGenderChange={setVocalGender}
                    personaId={personaId}
                    onPersonaIdChange={setPersonaId}
                    songCount={songCount}
                    onSongCountChange={setSongCount}
                  />
                </CollapsibleContent>
              </Collapsible>
              </CardContent>
            </Card>

            {/* Step 2: Generate Lyrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{fromChiefAim ? "Generate Lyrics" : "2. Generate Lyrics"}</CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGenerateLyrics}
                disabled={isGeneratingLyrics}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isGeneratingLyrics ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Lyrics...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Lyrics
                  </>
                )}
              </Button>

              {generatedLyrics && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Edit Lyrics</Label>
                    <Textarea 
                      value={generatedLyrics}
                      onChange={(e) => setGeneratedLyrics(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Generate Music */}
          {generatedLyrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Create Your Soundtrack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleGenerateMusic}
                  disabled={isGeneratingMusic || !generatedLyrics}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {isGeneratingMusic ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {generationStatus || "Generating Music..."}
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4 mr-2" />
                      Generate Music
                    </>
                  )}
                </Button>

                {/* Show generated songs using new SongVersionCard */}
                {songs.length > 0 && (
                  <div className="space-y-4 pt-4">
                    {songs.map((song, index) => (
                      <SongVersionCard
                        key={index}
                        audioUrl={song.soundtrackUrl}
                        title={songTitle}
                        versionNumber={index + 1}
                        isGenerating={isGeneratingMusic && !song.soundtrackUrl}
                        generationStatus={song.generationStatus}
                        hasError={['Content Policy Error', 'Failed', 'Error'].includes(song.generationStatus || '')}
                        errorMessage={
                          song.generationStatus === 'Content Policy Error'
                            ? 'Your lyrics contain words that violate the music service policy. Please edit your lyrics and try again.'
                            : undefined
                        }
                        onRegenerate={() => handleRegenerateSong(index)}
                        onSaveToLibrary={() => handleSaveToLibrary(index)}
                        onSetAsAnthem={
                          (fromChiefAim || fromAnalysis) && song.soundtrackUrl
                            ? () => handleSetAsChiefAimSong(song.soundtrackUrl!)
                            : undefined
                        }
                        isSavedToLibrary={song.isSavedToLibrary}
                        isSettingAsAnthem={isSettingAsChiefAimSong}
                        isCurrentAnthem={profile?.chief_aim_song_url === song.soundtrackUrl}
                        showAnthemButton={fromChiefAim || fromAnalysis}
                        isRegenerating={regeneratingIndex === index}
                      />
                    ))}
                  </div>
                )}

                {/* Fallback for single song display */}
                {songs.length === 0 && soundtrackUrl && (
                  <SongVersionCard
                    audioUrl={soundtrackUrl}
                    title={songTitle}
                    versionNumber={1}
                    isGenerating={isGeneratingMusic}
                    generationStatus={generationStatus}
                    onRegenerate={() => handleRegenerateSong(0)}
                    onSaveToLibrary={() => handleSaveToLibrary()}
                    isSavedToLibrary={false}
                    isRegenerating={regeneratingIndex === 0}
                  />
                )}
              </CardContent>
            </Card>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
