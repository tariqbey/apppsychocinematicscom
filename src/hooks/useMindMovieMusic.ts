import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export type MusicStyle = 
  // Hip-Hop/Rap
  | 'Hip-Hop Motivational'
  | 'Cinematic Hip-Hop'
  | 'Conscious Rap'
  | 'Lo-Fi Hip-Hop'
  | 'Trap Inspirational'
  // Pop & Electronic
  | 'Uplifting Pop'
  | 'Cinematic Electronic'
  | 'Ambient Chill'
  | 'Synthwave Retro'
  // Orchestral & Cinematic
  | 'Epic Orchestral'
  | 'Inspirational Piano'
  | 'Cinematic Drama'
  // Other Genres
  | 'Acoustic Folk'
  | 'R&B Soul'
  | 'Indie Rock Anthem';

export interface MusicStyleOption {
  value: MusicStyle;
  label: string;
  description: string;
  category: 'hip-hop' | 'pop-electronic' | 'orchestral' | 'other';
}

export const MUSIC_STYLES: MusicStyleOption[] = [
  // Hip-Hop/Rap
  {
    value: 'Hip-Hop Motivational',
    label: 'Hip-Hop Motivational',
    description: 'Upbeat, energetic, and empowering',
    category: 'hip-hop',
  },
  {
    value: 'Cinematic Hip-Hop',
    label: 'Cinematic Hip-Hop',
    description: 'Epic, orchestral elements, dramatic',
    category: 'hip-hop',
  },
  {
    value: 'Conscious Rap',
    label: 'Conscious Rap',
    description: 'Thoughtful, soulful, message-focused',
    category: 'hip-hop',
  },
  {
    value: 'Lo-Fi Hip-Hop',
    label: 'Lo-Fi Hip-Hop',
    description: 'Chill, reflective, mellow vibes',
    category: 'hip-hop',
  },
  {
    value: 'Trap Inspirational',
    label: 'Trap Inspirational',
    description: 'Modern, hard-hitting, powerful',
    category: 'hip-hop',
  },
  // Pop & Electronic
  {
    value: 'Uplifting Pop',
    label: 'Uplifting Pop',
    description: 'Catchy, feel-good, radio-friendly',
    category: 'pop-electronic',
  },
  {
    value: 'Cinematic Electronic',
    label: 'Cinematic Electronic',
    description: 'Modern, atmospheric, building energy',
    category: 'pop-electronic',
  },
  {
    value: 'Ambient Chill',
    label: 'Ambient Chill',
    description: 'Peaceful, meditative, flowing',
    category: 'pop-electronic',
  },
  {
    value: 'Synthwave Retro',
    label: 'Synthwave Retro',
    description: '80s inspired, nostalgic, driving',
    category: 'pop-electronic',
  },
  // Orchestral & Cinematic
  {
    value: 'Epic Orchestral',
    label: 'Epic Orchestral',
    description: 'Grand, heroic, triumphant',
    category: 'orchestral',
  },
  {
    value: 'Inspirational Piano',
    label: 'Inspirational Piano',
    description: 'Emotional, elegant, uplifting',
    category: 'orchestral',
  },
  {
    value: 'Cinematic Drama',
    label: 'Cinematic Drama',
    description: 'Intense, building, movie score',
    category: 'orchestral',
  },
  // Other Genres
  {
    value: 'Acoustic Folk',
    label: 'Acoustic Folk',
    description: 'Warm, organic, storytelling',
    category: 'other',
  },
  {
    value: 'R&B Soul',
    label: 'R&B Soul',
    description: 'Smooth, soulful, emotional',
    category: 'other',
  },
  {
    value: 'Indie Rock Anthem',
    label: 'Indie Rock Anthem',
    description: 'Energetic, guitar-driven, inspiring',
    category: 'other',
  },
];

interface ChiefAim {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface Scene {
  order: number;
  title: string;
  narrative: string;
  emotional_tone: string;
}

interface UseMindMovieMusicReturn {
  isGeneratingLyrics: boolean;
  isGeneratingMusic: boolean;
  generatedLyrics: string | null;
  soundtrackUrl: string | null;
  musicStyle: MusicStyle | null;
  vocalGender: 'm' | 'f';
  personaId: string;
  taskId: string | null;
  generationStatus: string | null;
  isSavedToLibrary: boolean;
  setMusicStyle: (style: MusicStyle) => void;
  setVocalGender: (gender: 'm' | 'f') => void;
  setPersonaId: (id: string) => void;
  setGeneratedLyrics: (lyrics: string) => void;
  generateLyrics: (chiefAim: ChiefAim, scenes: Scene[], style: MusicStyle) => Promise<void>;
  generateMusic: (lyrics: string, title: string, scriptId: string) => Promise<void>;
  regenerateMusic: (lyrics: string, title: string, scriptId: string) => Promise<void>;
  checkMusicStatus: (scriptId: string) => Promise<boolean>;
  saveLyrics: (scriptId: string, lyrics: string) => Promise<void>;
  saveToLibrary: (title: string, lyrics: string) => Promise<void>;
  loadExistingMusic: (script: { 
    song_lyrics?: string | null; 
    soundtrack_url?: string | null; 
    music_style?: string | null;
    suno_task_id?: string | null;
  }) => void;
}

export const useMindMovieMusic = (): UseMindMovieMusicReturn => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [soundtrackUrl, setSoundtrackUrl] = useState<string | null>(null);
  const [musicStyle, setMusicStyle] = useState<MusicStyle | null>(null);
  const [vocalGender, setVocalGender] = useState<'m' | 'f'>('m');
  const [personaId, setPersonaId] = useState<string>('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const generateLyrics = useCallback(async (
    chiefAim: ChiefAim,
    scenes: Scene[],
    style: MusicStyle
  ) => {
    setIsGeneratingLyrics(true);
    setGeneratedLyrics(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'generate-lyrics',
          chiefAim,
          scenes,
          musicStyle: style,
        },
      });

      if (error) throw error;
      if (!data?.lyrics) throw new Error('No lyrics returned');

      setGeneratedLyrics(data.lyrics);
      setMusicStyle(style);

      toast({
        title: 'Lyrics Generated!',
        description: 'Your personalized rap lyrics are ready. Review and edit if needed.',
      });
    } catch (error) {
      console.error('Error generating lyrics:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate lyrics',
      });
    } finally {
      setIsGeneratingLyrics(false);
    }
  }, [toast]);

  const pollForCompletion = useCallback((tid: string, scriptId: string) => {
    let attempts = 0;
    const maxAttempts = 36; // 3 minutes with 5 second intervals

    const poll = async () => {
      attempts++;
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
          body: {
            action: 'check-status',
            taskId: tid,
            scriptId,
          },
        });

        if (error) throw error;

        if (data?.status === 'SUCCESS' && data?.audioUrl) {
          setSoundtrackUrl(data.audioUrl);
          setIsGeneratingMusic(false);
          setGenerationStatus(null);
          toast({
            title: '🎵 Soundtrack Complete!',
            description: 'Your Mind Movie anthem is ready to play.',
          });
          return;
        }

        if (data?.status === 'FAILED') {
          throw new Error('Music generation failed');
        }

        // Still processing
        if (attempts >= maxAttempts) {
          throw new Error('Generation timed out. Please try again.');
        }

        setGenerationStatus(`Creating your soundtrack... (${Math.round((attempts / maxAttempts) * 100)}%)`);
        
        // Continue polling
        pollingRef.current = window.setTimeout(() => poll(), 5000);
      } catch (error) {
        console.error('Polling error:', error);
        setIsGeneratingMusic(false);
        setGenerationStatus(null);
        toast({
          variant: 'destructive',
          title: 'Generation Error',
          description: error instanceof Error ? error.message : 'Failed to check generation status',
        });
      }
    };

    poll();
  }, [toast]);

  const generateMusic = useCallback(async (
    lyrics: string,
    title: string,
    scriptId: string
  ) => {
    if (!musicStyle) {
      toast({
        variant: 'destructive',
        title: 'Style Required',
        description: 'Please select a music style first',
      });
      return;
    }

    setIsGeneratingMusic(true);
    setGenerationStatus('Starting generation...');
    setSoundtrackUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'generate-music',
          lyrics,
          musicStyle,
          title,
          vocalGender,
          scriptId,
          ...(personaId.trim() ? { personaId: personaId.trim() } : {}),
        },
      });

      if (error) throw error;
      if (!data?.taskId) throw new Error('No task ID returned');

      setTaskId(data.taskId);
      setGenerationStatus('Creating your soundtrack... This may take 1-3 minutes.');

      toast({
        title: 'Generation Started',
        description: 'Your soundtrack is being created. Please wait...',
      });

      // Start polling for completion
      pollForCompletion(data.taskId, scriptId);
    } catch (error) {
      console.error('Error generating music:', error);
      setIsGeneratingMusic(false);
      setGenerationStatus(null);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to start music generation',
      });
    }
  }, [musicStyle, vocalGender, personaId, toast, pollForCompletion]);

  const regenerateMusic = useCallback(async (
    lyrics: string,
    title: string,
    scriptId: string
  ) => {
    // Clear previous soundtrack before regenerating
    setSoundtrackUrl(null);
    setIsSavedToLibrary(false);
    setTaskId(null);
    
    // Clear polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }

    // Call generateMusic logic
    if (!musicStyle) {
      toast({
        variant: 'destructive',
        title: 'Style Required',
        description: 'Please select a music style first',
      });
      return;
    }

    setIsGeneratingMusic(true);
    setGenerationStatus('Starting regeneration...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'generate-music',
          lyrics,
          musicStyle,
          title,
          vocalGender,
          scriptId,
          ...(personaId.trim() ? { personaId: personaId.trim() } : {}),
        },
      });

      if (error) throw error;
      if (!data?.taskId) throw new Error('No task ID returned');

      setTaskId(data.taskId);
      setGenerationStatus('Recreating your soundtrack... This may take 1-3 minutes.');

      toast({
        title: 'Regeneration Started',
        description: 'Your new soundtrack is being created. Please wait...',
      });

      // Start polling for completion
      pollForCompletion(data.taskId, scriptId);
    } catch (error) {
      console.error('Error regenerating music:', error);
      setIsGeneratingMusic(false);
      setGenerationStatus(null);
      toast({
        variant: 'destructive',
        title: 'Regeneration Failed',
        description: error instanceof Error ? error.message : 'Failed to start music regeneration',
      });
    }
  }, [musicStyle, vocalGender, personaId, toast, pollForCompletion]);

  const checkMusicStatus = useCallback(async (scriptId: string): Promise<boolean> => {
    if (!taskId) return false;

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'check-status',
          taskId,
          scriptId,
        },
      });

      if (error) throw error;

      if (data?.status === 'SUCCESS' && data?.audioUrl) {
        setSoundtrackUrl(data.audioUrl);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking status:', error);
      return false;
    }
  }, [taskId]);

  const saveLyrics = useCallback(async (scriptId: string, lyrics: string) => {
    try {
      const { error } = await supabase
        .from('mind_movie_scripts')
        .update({ song_lyrics: lyrics })
        .eq('id', scriptId);

      if (error) throw error;

      toast({
        title: 'Lyrics Saved',
        description: 'Your lyrics have been saved.',
      });
    } catch (error) {
      console.error('Error saving lyrics:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save lyrics',
      });
    }
  }, [toast]);

  const loadExistingMusic = useCallback((script: {
    song_lyrics?: string | null;
    soundtrack_url?: string | null;
    music_style?: string | null;
    suno_task_id?: string | null;
  }) => {
    if (script.song_lyrics) {
      setGeneratedLyrics(script.song_lyrics);
    }
    if (script.soundtrack_url) {
      setSoundtrackUrl(script.soundtrack_url);
      setIsSavedToLibrary(false); // Reset when loading new music
    }
    if (script.music_style) {
      setMusicStyle(script.music_style as MusicStyle);
    }
    if (script.suno_task_id) {
      setTaskId(script.suno_task_id);
    }
  }, []);

  const saveToLibrary = useCallback(async (title: string, lyrics: string) => {
    if (!user || !soundtrackUrl) {
      toast({
        variant: 'destructive',
        title: 'Cannot Save',
        description: 'No soundtrack available to save.',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('generated_media')
        .insert({
          user_id: user.id,
          media_type: 'audio',
          model_used: 'suno/v4.5',
          prompt: lyrics.substring(0, 500), // Store first 500 chars of lyrics as prompt
          media_url: soundtrackUrl,
          status: 'completed',
          metadata: {
            title,
            music_style: musicStyle,
            vocal_gender: vocalGender,
            full_lyrics: lyrics,
          },
        });

      if (error) throw error;

      setIsSavedToLibrary(true);
      toast({
        title: '🎵 Saved to Library!',
        description: 'Your soundtrack has been added to your Media Library.',
      });
    } catch (error) {
      console.error('Error saving to library:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save to library',
      });
    }
  }, [user, soundtrackUrl, musicStyle, vocalGender, toast]);

  // Cleanup polling on unmount
  const cleanup = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
  };

  return {
    isGeneratingLyrics,
    isGeneratingMusic,
    generatedLyrics,
    soundtrackUrl,
    musicStyle,
    vocalGender,
    personaId,
    taskId,
    generationStatus,
    isSavedToLibrary,
    setMusicStyle,
    setVocalGender,
    setPersonaId,
    setGeneratedLyrics,
    generateLyrics,
    generateMusic,
    regenerateMusic,
    checkMusicStatus,
    saveLyrics,
    saveToLibrary,
    loadExistingMusic,
  };
};
