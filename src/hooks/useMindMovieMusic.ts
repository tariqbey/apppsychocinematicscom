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
  | 'Boom Bap'
  | 'West Coast Rap'
  | 'UK Drill'
  | 'Jazz Rap'
  // Pop & Electronic
  | 'Uplifting Pop'
  | 'Cinematic Electronic'
  | 'Ambient Chill'
  | 'Synthwave Retro'
  | 'Indie Pop'
  | 'EDM Anthem'
  | 'Future Bass'
  | 'Deep House'
  | 'Tropical House'
  | 'Electro Swing'
  | 'Hyperpop'
  | 'Dream Pop'
  | 'Synth-pop'
  | 'Vaporwave'
  // Rock & Alternative
  | 'Indie Rock Anthem'
  | 'Alternative Rock'
  | 'Classic Rock'
  | 'Punk Rock'
  | 'Pop Rock'
  | 'Progressive Rock'
  | 'Grunge'
  | 'Post-Rock'
  // Orchestral & Cinematic
  | 'Epic Orchestral'
  | 'Inspirational Piano'
  | 'Cinematic Drama'
  | 'Cinematic Inspirational'
  | 'Neoclassical'
  | 'Movie Soundtrack'
  // R&B & Soul
  | 'R&B Soul'
  | 'Contemporary R&B'
  | 'Neo Soul'
  | 'Motown'
  | 'Funk'
  // Jazz & Blues
  | 'Smooth Jazz'
  | 'Jazz Fusion'
  | 'Blues'
  | 'Delta Blues'
  | 'Cool Jazz'
  // Folk & Country
  | 'Acoustic Folk'
  | 'Indie Folk'
  | 'Country Inspirational'
  | 'Bluegrass'
  | 'Americana'
  // Gospel & Spiritual
  | 'Gospel Inspirational'
  | 'Contemporary Gospel'
  | 'Spiritual'
  // World & Latin
  | 'Reggae'
  | 'Afrobeat'
  | 'Latin Pop'
  | 'Salsa'
  | 'Bossa Nova'
  | 'K-pop'
  | 'J-pop'
  // Custom
  | 'Custom';

export interface MusicStyleOption {
  value: MusicStyle;
  label: string;
  description: string;
  category: 'hip-hop' | 'pop-electronic' | 'rock' | 'orchestral' | 'rnb-soul' | 'jazz-blues' | 'folk-country' | 'gospel' | 'world' | 'custom';
}

export const MUSIC_STYLES: MusicStyleOption[] = [
  // Hip-Hop/Rap
  {
    value: 'Hip-Hop Motivational',
    label: 'Hip-Hop Motivational',
    description: 'Upbeat, energetic, empowering',
    category: 'hip-hop',
  },
  {
    value: 'Cinematic Hip-Hop',
    label: 'Cinematic Hip-Hop',
    description: 'Epic, orchestral, dramatic',
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
  {
    value: 'Boom Bap',
    label: 'Boom Bap',
    description: 'Classic 90s hip-hop sound',
    category: 'hip-hop',
  },
  {
    value: 'West Coast Rap',
    label: 'West Coast Rap',
    description: 'G-funk, laid-back, groovy',
    category: 'hip-hop',
  },
  {
    value: 'UK Drill',
    label: 'UK Drill',
    description: 'Dark, bass-heavy, aggressive',
    category: 'hip-hop',
  },
  {
    value: 'Jazz Rap',
    label: 'Jazz Rap',
    description: 'Jazz samples, smooth, sophisticated',
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
  {
    value: 'Indie Pop',
    label: 'Indie Pop',
    description: 'Dreamy, atmospheric, emotional',
    category: 'pop-electronic',
  },
  {
    value: 'EDM Anthem',
    label: 'EDM Anthem',
    description: 'High-energy, euphoric, festival',
    category: 'pop-electronic',
  },
  {
    value: 'Future Bass',
    label: 'Future Bass',
    description: 'Melodic, emotional drops, modern',
    category: 'pop-electronic',
  },
  {
    value: 'Deep House',
    label: 'Deep House',
    description: 'Groovy, soulful, rhythmic',
    category: 'pop-electronic',
  },
  {
    value: 'Tropical House',
    label: 'Tropical House',
    description: 'Summery, upbeat, breezy',
    category: 'pop-electronic',
  },
  {
    value: 'Electro Swing',
    label: 'Electro Swing',
    description: 'Vintage swing meets electronic',
    category: 'pop-electronic',
  },
  {
    value: 'Hyperpop',
    label: 'Hyperpop',
    description: 'Glitchy, maximalist, experimental',
    category: 'pop-electronic',
  },
  {
    value: 'Dream Pop',
    label: 'Dream Pop',
    description: 'Ethereal, atmospheric, hazy',
    category: 'pop-electronic',
  },
  {
    value: 'Synth-pop',
    label: 'Synth-pop',
    description: 'Synth-driven, catchy, retro-modern',
    category: 'pop-electronic',
  },
  {
    value: 'Vaporwave',
    label: 'Vaporwave',
    description: 'Nostalgic, slowed, aesthetic',
    category: 'pop-electronic',
  },
  // Rock & Alternative
  {
    value: 'Indie Rock Anthem',
    label: 'Indie Rock Anthem',
    description: 'Energetic, guitar-driven, inspiring',
    category: 'rock',
  },
  {
    value: 'Alternative Rock',
    label: 'Alternative Rock',
    description: 'Raw, emotional, edgy',
    category: 'rock',
  },
  {
    value: 'Classic Rock',
    label: 'Classic Rock',
    description: 'Timeless, powerful, guitar solos',
    category: 'rock',
  },
  {
    value: 'Punk Rock',
    label: 'Punk Rock',
    description: 'Fast, rebellious, raw energy',
    category: 'rock',
  },
  {
    value: 'Pop Rock',
    label: 'Pop Rock',
    description: 'Catchy, melodic, accessible',
    category: 'rock',
  },
  {
    value: 'Progressive Rock',
    label: 'Progressive Rock',
    description: 'Complex, epic, experimental',
    category: 'rock',
  },
  {
    value: 'Grunge',
    label: 'Grunge',
    description: 'Raw, heavy, emotional depth',
    category: 'rock',
  },
  {
    value: 'Post-Rock',
    label: 'Post-Rock',
    description: 'Atmospheric, building, cinematic',
    category: 'rock',
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
  {
    value: 'Cinematic Inspirational',
    label: 'Cinematic Inspirational',
    description: 'Uplifting, emotional, dramatic',
    category: 'orchestral',
  },
  {
    value: 'Neoclassical',
    label: 'Neoclassical',
    description: 'Modern classical, elegant, refined',
    category: 'orchestral',
  },
  {
    value: 'Movie Soundtrack',
    label: 'Movie Soundtrack',
    description: 'Theatrical, emotional, sweeping',
    category: 'orchestral',
  },
  // R&B & Soul
  {
    value: 'R&B Soul',
    label: 'R&B Soul',
    description: 'Smooth, soulful, emotional',
    category: 'rnb-soul',
  },
  {
    value: 'Contemporary R&B',
    label: 'Contemporary R&B',
    description: 'Modern, melodic, atmospheric',
    category: 'rnb-soul',
  },
  {
    value: 'Neo Soul',
    label: 'Neo Soul',
    description: 'Organic, jazzy, conscious',
    category: 'rnb-soul',
  },
  {
    value: 'Motown',
    label: 'Motown',
    description: 'Classic, groovy, soulful',
    category: 'rnb-soul',
  },
  {
    value: 'Funk',
    label: 'Funk',
    description: 'Groovy, bass-heavy, danceable',
    category: 'rnb-soul',
  },
  // Jazz & Blues
  {
    value: 'Smooth Jazz',
    label: 'Smooth Jazz',
    description: 'Relaxing, sophisticated, melodic',
    category: 'jazz-blues',
  },
  {
    value: 'Jazz Fusion',
    label: 'Jazz Fusion',
    description: 'Complex, funky, experimental',
    category: 'jazz-blues',
  },
  {
    value: 'Blues',
    label: 'Blues',
    description: 'Soulful, raw, emotional',
    category: 'jazz-blues',
  },
  {
    value: 'Delta Blues',
    label: 'Delta Blues',
    description: 'Roots, acoustic, storytelling',
    category: 'jazz-blues',
  },
  {
    value: 'Cool Jazz',
    label: 'Cool Jazz',
    description: 'Laid-back, sophisticated, smooth',
    category: 'jazz-blues',
  },
  // Folk & Country
  {
    value: 'Acoustic Folk',
    label: 'Acoustic Folk',
    description: 'Warm, organic, storytelling',
    category: 'folk-country',
  },
  {
    value: 'Indie Folk',
    label: 'Indie Folk',
    description: 'Intimate, heartfelt, atmospheric',
    category: 'folk-country',
  },
  {
    value: 'Country Inspirational',
    label: 'Country Inspirational',
    description: 'Heartfelt, Americana, uplifting',
    category: 'folk-country',
  },
  {
    value: 'Bluegrass',
    label: 'Bluegrass',
    description: 'Acoustic, lively, traditional',
    category: 'folk-country',
  },
  {
    value: 'Americana',
    label: 'Americana',
    description: 'Roots, authentic, storytelling',
    category: 'folk-country',
  },
  // Gospel & Spiritual
  {
    value: 'Gospel Inspirational',
    label: 'Gospel Inspirational',
    description: 'Uplifting, spiritual, powerful',
    category: 'gospel',
  },
  {
    value: 'Contemporary Gospel',
    label: 'Contemporary Gospel',
    description: 'Modern, soulful, inspiring',
    category: 'gospel',
  },
  {
    value: 'Spiritual',
    label: 'Spiritual',
    description: 'Meditative, peaceful, transcendent',
    category: 'gospel',
  },
  // World & Latin
  {
    value: 'Reggae',
    label: 'Reggae',
    description: 'Laid-back, positive, groovy',
    category: 'world',
  },
  {
    value: 'Afrobeat',
    label: 'Afrobeat',
    description: 'Rhythmic, energetic, danceable',
    category: 'world',
  },
  {
    value: 'Latin Pop',
    label: 'Latin Pop',
    description: 'Passionate, rhythmic, vibrant',
    category: 'world',
  },
  {
    value: 'Salsa',
    label: 'Salsa',
    description: 'Energetic, danceable, vibrant',
    category: 'world',
  },
  {
    value: 'Bossa Nova',
    label: 'Bossa Nova',
    description: 'Smooth, jazzy, Brazilian',
    category: 'world',
  },
  {
    value: 'K-pop',
    label: 'K-pop',
    description: 'Catchy, polished, dynamic',
    category: 'world',
  },
  {
    value: 'J-pop',
    label: 'J-pop',
    description: 'Melodic, upbeat, colorful',
    category: 'world',
  },
  // Custom
  {
    value: 'Custom',
    label: 'Custom Style',
    description: 'Define your own music style',
    category: 'custom',
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

interface SongGeneration {
  taskId: string | null;
  soundtrackUrl: string | null;
  generationStatus: string | null;
  isSavedToLibrary: boolean;
}

interface UseMindMovieMusicReturn {
  isGeneratingLyrics: boolean;
  isGeneratingMusic: boolean;
  generatedLyrics: string | null;
  soundtrackUrl: string | null;
  soundtrackUrls: string[];
  musicStyle: MusicStyle | null;
  customStyleText: string;
  vocalGender: 'm' | 'f';
  personaId: string;
  taskId: string | null;
  generationStatus: string | null;
  isSavedToLibrary: boolean;
  songs: SongGeneration[];
  setMusicStyle: (style: MusicStyle) => void;
  setCustomStyleText: (text: string) => void;
  setVocalGender: (gender: 'm' | 'f') => void;
  setPersonaId: (id: string) => void;
  setGeneratedLyrics: (lyrics: string) => void;
  generateLyrics: (chiefAim: ChiefAim, scenes: Scene[], style: MusicStyle, customStyle?: string) => Promise<void>;
  generateMusic: (lyrics: string, title: string, scriptId: string, customStyle?: string, songCount?: number) => Promise<void>;
  regenerateMusic: (lyrics: string, title: string, scriptId: string, customStyle?: string, songCount?: number) => Promise<void>;
  checkMusicStatus: (scriptId: string) => Promise<boolean>;
  saveLyrics: (scriptId: string, lyrics: string) => Promise<void>;
  saveToLibrary: (title: string, lyrics: string, songIndex?: number) => Promise<void>;
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
  const [soundtrackUrls, setSoundtrackUrls] = useState<string[]>([]);
  const [musicStyle, setMusicStyle] = useState<MusicStyle | null>(null);
  const [customStyleText, setCustomStyleText] = useState<string>('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f'>('m');
  const [personaId, setPersonaId] = useState<string>('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const [songs, setSongs] = useState<SongGeneration[]>([]);
  const pollingRef = useRef<number | null>(null);
  const pollingRefs = useRef<Map<number, number>>(new Map());

  const generateLyrics = useCallback(async (
    chiefAim: ChiefAim,
    scenes: Scene[],
    style: MusicStyle,
    customStyle?: string
  ) => {
    setIsGeneratingLyrics(true);
    setGeneratedLyrics(null);

    // Use custom style text if style is 'Custom', otherwise use the style name
    const effectiveStyle = style === 'Custom' && customStyle ? customStyle : style;

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'generate-lyrics',
          chiefAim,
          scenes,
          musicStyle: effectiveStyle,
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

  // Multi-song polling function
  const pollForCompletionMulti = useCallback((tid: string, scriptId: string, songIndex: number, totalSongs: number) => {
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
          // Update the specific song
          setSongs(prev => {
            const updated = [...prev];
            if (updated[songIndex]) {
              updated[songIndex] = {
                ...updated[songIndex],
                soundtrackUrl: data.audioUrl,
                generationStatus: null,
              };
            }
            return updated;
          });
          
          setSoundtrackUrls(prev => {
            const updated = [...prev];
            updated[songIndex] = data.audioUrl;
            return updated;
          });
          
          // Set first song as main soundtrack URL
          if (songIndex === 0) {
            setSoundtrackUrl(data.audioUrl);
          }
          
          // Check if all songs are complete
          setSongs(prev => {
            const allComplete = prev.every(s => s.soundtrackUrl !== null);
            if (allComplete) {
              setIsGeneratingMusic(false);
              setGenerationStatus(null);
              toast({
                title: `🎵 ${totalSongs} Soundtrack${totalSongs > 1 ? 's' : ''} Complete!`,
                description: 'Your Mind Movie anthems are ready to play.',
              });
            }
            return prev;
          });
          
          // Clear this song's polling
          const timeoutId = pollingRefs.current.get(songIndex);
          if (timeoutId) {
            clearTimeout(timeoutId);
            pollingRefs.current.delete(songIndex);
          }
          return;
        }

        // Handle sensitive word error - stop polling and show user-friendly message
        if (data?.status === 'SENSITIVE_WORD_ERROR') {
          setSongs(prev => {
            const updated = [...prev];
            if (updated[songIndex]) {
              updated[songIndex] = {
                ...updated[songIndex],
                generationStatus: 'Content Policy Error',
              };
            }
            // Check if all songs have errored
            const allDone = updated.every(s => s.soundtrackUrl !== null || s.generationStatus === 'Content Policy Error' || s.generationStatus === 'Failed');
            if (allDone) {
              setIsGeneratingMusic(false);
              setGenerationStatus(null);
            }
            return updated;
          });
          
          // Clear this song's polling
          const timeoutId = pollingRefs.current.get(songIndex);
          if (timeoutId) {
            clearTimeout(timeoutId);
            pollingRefs.current.delete(songIndex);
          }
          
          toast({
            variant: 'destructive',
            title: 'Content Policy Violation',
            description: 'Your lyrics contain words that violate the music service policy. Please edit your lyrics and try again.',
          });
          return;
        }

        if (data?.status === 'FAILED') {
          setSongs(prev => {
            const updated = [...prev];
            if (updated[songIndex]) {
              updated[songIndex] = {
                ...updated[songIndex],
                generationStatus: 'Failed',
              };
            }
            // Check if all songs have errored
            const allDone = updated.every(s => s.soundtrackUrl !== null || s.generationStatus === 'Failed');
            if (allDone) {
              setIsGeneratingMusic(false);
              setGenerationStatus(null);
            }
            return updated;
          });
          throw new Error(`Song ${songIndex + 1} generation failed`);
        }

        // Still processing
        if (attempts >= maxAttempts) {
          throw new Error(`Song ${songIndex + 1} generation timed out. Please try again.`);
        }

        setSongs(prev => {
          const updated = [...prev];
          if (updated[songIndex]) {
            updated[songIndex] = {
              ...updated[songIndex],
              generationStatus: `Creating... (${Math.round((attempts / maxAttempts) * 100)}%)`,
            };
          }
          return updated;
        });
        
        setGenerationStatus(`Creating ${totalSongs} soundtrack${totalSongs > 1 ? 's' : ''}... (${Math.round((attempts / maxAttempts) * 100)}%)`);
        
        // Continue polling
        const timeoutId = window.setTimeout(() => poll(), 5000);
        pollingRefs.current.set(songIndex, timeoutId);
      } catch (error) {
        console.error(`Polling error for song ${songIndex + 1}:`, error);
        setSongs(prev => {
          const updated = [...prev];
          if (updated[songIndex]) {
            updated[songIndex] = {
              ...updated[songIndex],
              generationStatus: 'Error',
            };
          }
          // Check if all songs have either completed or errored
          const allDone = updated.every(s => s.soundtrackUrl !== null || s.generationStatus === 'Error' || s.generationStatus === 'Failed');
          if (allDone) {
            setIsGeneratingMusic(false);
            setGenerationStatus(null);
          }
          return updated;
        });
        
        toast({
          variant: 'destructive',
          title: `Song ${songIndex + 1} Error`,
          description: error instanceof Error ? error.message : 'Failed to check generation status',
        });
      }
    };

    poll();
  }, [toast]);

  const generateMusic = useCallback(async (
    lyrics: string,
    title: string,
    scriptId: string,
    customStyle?: string,
    songCount: number = 1
  ) => {
    if (!musicStyle) {
      toast({
        variant: 'destructive',
        title: 'Style Required',
        description: 'Please select a music style first',
      });
      return;
    }

    // Use custom style text if style is 'Custom', otherwise use the style name
    const effectiveStyle = musicStyle === 'Custom' && customStyle ? customStyle : musicStyle;

    setIsGeneratingMusic(true);
    setGenerationStatus(`Starting generation of ${songCount} song${songCount > 1 ? 's' : ''}...`);
    setSoundtrackUrl(null);
    setSoundtrackUrls([]);
    setTaskIds([]);
    
    // Initialize songs array
    const initialSongs: SongGeneration[] = Array.from({ length: songCount }, () => ({
      taskId: null,
      soundtrackUrl: null,
      generationStatus: 'Starting...',
      isSavedToLibrary: false,
    }));
    setSongs(initialSongs);

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'generate-music',
          lyrics,
          musicStyle: effectiveStyle,
          title,
          vocalGender,
          scriptId,
          songCount,
          ...(personaId.trim() ? { personaId: personaId.trim() } : {}),
        },
      });

      if (error) throw error;
      
      // Handle both single and multiple task IDs
      const returnedTaskIds = data?.taskIds || (data?.taskId ? [data.taskId] : []);
      if (returnedTaskIds.length === 0) throw new Error('No task ID returned');

      setTaskIds(returnedTaskIds);
      setTaskId(returnedTaskIds[0]);
      
      // Update songs with task IDs
      setSongs(prev => prev.map((song, idx) => ({
        ...song,
        taskId: returnedTaskIds[idx] || null,
        generationStatus: 'Creating your soundtrack... This may take 1-3 minutes.',
      })));
      
      setGenerationStatus(`Creating ${songCount} soundtrack${songCount > 1 ? 's' : ''}... This may take 1-3 minutes.`);

      toast({
        title: 'Generation Started',
        description: `${songCount} soundtrack${songCount > 1 ? 's are' : ' is'} being created. Please wait...`,
      });

      // Start polling for each song
      returnedTaskIds.forEach((tid: string, index: number) => {
        pollForCompletionMulti(tid, scriptId, index, returnedTaskIds.length);
      });
    } catch (error) {
      console.error('Error generating music:', error);
      setIsGeneratingMusic(false);
      setGenerationStatus(null);
      setSongs([]);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to start music generation',
      });
    }
  }, [musicStyle, vocalGender, personaId, toast]);

  const regenerateMusic = useCallback(async (
    lyrics: string,
    title: string,
    scriptId: string,
    customStyle?: string,
    songCount: number = 1
  ) => {
    // Clear previous soundtrack before regenerating
    setSoundtrackUrl(null);
    setSoundtrackUrls([]);
    setIsSavedToLibrary(false);
    setTaskId(null);
    setTaskIds([]);
    setSongs([]);
    
    // Clear all polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    pollingRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    pollingRefs.current.clear();

    // Call generateMusic logic
    if (!musicStyle) {
      toast({
        variant: 'destructive',
        title: 'Style Required',
        description: 'Please select a music style first',
      });
      return;
    }

    // Use custom style text if style is 'Custom', otherwise use the style name
    const effectiveStyle = musicStyle === 'Custom' && customStyle ? customStyle : musicStyle;

    setIsGeneratingMusic(true);
    setGenerationStatus(`Starting regeneration of ${songCount} song${songCount > 1 ? 's' : ''}...`);
    
    // Initialize songs array
    const initialSongs: SongGeneration[] = Array.from({ length: songCount }, () => ({
      taskId: null,
      soundtrackUrl: null,
      generationStatus: 'Starting...',
      isSavedToLibrary: false,
    }));
    setSongs(initialSongs);

    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'generate-music',
          lyrics,
          musicStyle: effectiveStyle,
          title,
          vocalGender,
          scriptId,
          songCount,
          ...(personaId.trim() ? { personaId: personaId.trim() } : {}),
        },
      });

      if (error) throw error;
      
      // Handle both single and multiple task IDs
      const returnedTaskIds = data?.taskIds || (data?.taskId ? [data.taskId] : []);
      if (returnedTaskIds.length === 0) throw new Error('No task ID returned');

      setTaskIds(returnedTaskIds);
      setTaskId(returnedTaskIds[0]);
      
      // Update songs with task IDs
      setSongs(prev => prev.map((song, idx) => ({
        ...song,
        taskId: returnedTaskIds[idx] || null,
        generationStatus: 'Recreating your soundtrack... This may take 1-3 minutes.',
      })));
      
      setGenerationStatus(`Recreating ${songCount} soundtrack${songCount > 1 ? 's' : ''}... This may take 1-3 minutes.`);

      toast({
        title: 'Regeneration Started',
        description: `${songCount} new soundtrack${songCount > 1 ? 's are' : ' is'} being created. Please wait...`,
      });

      // Start polling for each song
      returnedTaskIds.forEach((tid: string, index: number) => {
        pollForCompletionMulti(tid, scriptId, index, returnedTaskIds.length);
      });
    } catch (error) {
      console.error('Error regenerating music:', error);
      setIsGeneratingMusic(false);
      setGenerationStatus(null);
      setSongs([]);
      toast({
        variant: 'destructive',
        title: 'Regeneration Failed',
        description: error instanceof Error ? error.message : 'Failed to start music regeneration',
      });
    }
  }, [musicStyle, vocalGender, personaId, toast, pollForCompletionMulti]);

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

  const saveToLibrary = useCallback(async (title: string, lyrics: string, songIndex?: number) => {
    // Determine which URL to save
    const urlToSave = songIndex !== undefined && songs[songIndex]?.soundtrackUrl 
      ? songs[songIndex].soundtrackUrl 
      : soundtrackUrl;
      
    if (!user || !urlToSave) {
      toast({
        variant: 'destructive',
        title: 'Cannot Save',
        description: 'No soundtrack available to save.',
      });
      return;
    }

    try {
      const songTitle = songIndex !== undefined && songs.length > 1 
        ? `${title} (Version ${songIndex + 1})`
        : title;
        
      const { error } = await supabase
        .from('generated_media')
        .insert({
          user_id: user.id,
          media_type: 'audio',
          model_used: 'suno/v4.5',
          prompt: lyrics.substring(0, 500), // Store first 500 chars of lyrics as prompt
          media_url: urlToSave,
          status: 'completed',
          metadata: {
            title: songTitle,
            music_style: musicStyle,
            vocal_gender: vocalGender,
            full_lyrics: lyrics,
            song_index: songIndex,
          },
        });

      if (error) throw error;

      // Update the saved state for the specific song
      if (songIndex !== undefined) {
        setSongs(prev => {
          const updated = [...prev];
          if (updated[songIndex]) {
            updated[songIndex] = {
              ...updated[songIndex],
              isSavedToLibrary: true,
            };
          }
          return updated;
        });
      } else {
        setIsSavedToLibrary(true);
      }
      
      toast({
        title: '🎵 Saved to Library!',
        description: `${songTitle} has been added to your Media Library.`,
      });
    } catch (error) {
      console.error('Error saving to library:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save to library',
      });
    }
  }, [user, soundtrackUrl, songs, musicStyle, vocalGender, toast]);

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
    soundtrackUrls,
    musicStyle,
    customStyleText,
    vocalGender,
    personaId,
    taskId,
    generationStatus,
    isSavedToLibrary,
    songs,
    setMusicStyle,
    setCustomStyleText,
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
