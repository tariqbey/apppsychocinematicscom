import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProductionCredits } from './useProductionCredits';
import { toast } from 'sonner';
 import { getArchetypeByIdWithLegacy } from '@/components/character/archetypes';

export interface ChallengeSoundtrack {
  id: string;
  challenge_id: string;
  user_id: string;
  title: string;
  lyrics: string | null;
  music_style: string | null;
  audio_url: string | null;
  suno_task_id: string | null;
  status: string;
  character_traits: string[] | null;
  archetype_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface GenerateLyricsParams {
  challengeId: string;
  situationDescription: string;
  targetTrait: string;
  emotionalTrigger: string;
  scenarioType: string;
  visualizationScript?: string;
  musicStyle: string;
}

export function useChallengeSoundtrack() {
  const { user } = useAuth();
  const { deductCredits, canAfford } = useProductionCredits();
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [soundtrack, setSoundtrack] = useState<ChallengeSoundtrack | null>(null);

  // Fetch user's archetype for context
  const fetchUserArchetype = useCallback(async () => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('character_profiles')
      .select('archetype')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data?.archetype) {
      return getArchetypeByIdWithLegacy(data.archetype);
    }
    return null;
  }, [user]);

  // Fetch user's Chief Aim for context
  const fetchChiefAim = useCallback(async () => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('user_profiles')
      .select('chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan')
      .eq('user_id', user.id)
      .maybeSingle();
    
    return data;
  }, [user]);

  // Generate lyrics for a challenge
  const generateChallengeLyrics = useCallback(async (params: GenerateLyricsParams) => {
    if (!user) {
      toast.error('Please sign in to generate lyrics');
      return null;
    }

    // Check credits (lyrics generation uses AI - ~2 credits)
    if (!canAfford('ai')) {
      toast.error('Insufficient credits for lyrics generation');
      return null;
    }

    setIsGeneratingLyrics(true);
    try {
      // Fetch archetype and chief aim for context
      const [archetype, chiefAim] = await Promise.all([
        fetchUserArchetype(),
        fetchChiefAim(),
      ]);

      // Deduct credits using AI type
      await deductCredits('ai');

 // Build the context for lyrics generation
       const { data, error } = await supabase.functions.invoke('generate-challenge-lyrics', {
         body: {
           challenge: {
             situationDescription: params.situationDescription,
             targetTrait: params.targetTrait,
             emotionalTrigger: params.emotionalTrigger,
             scenarioType: params.scenarioType,
             visualizationScript: params.visualizationScript,
           },
           archetype: archetype ? {
             name: archetype.name,
             sphere: archetype.sphere,
             deity: archetype.deity,
             law: archetype.law,
             role: archetype.role,
             directorsNote: archetype.directorsNote,
           } : null,
          chiefAim: chiefAim ? {
            what: chiefAim.chief_aim_what,
            byWhen: chiefAim.chief_aim_by_when,
            exchange: chiefAim.chief_aim_exchange,
            plan: chiefAim.chief_aim_plan,
          } : null,
          musicStyle: params.musicStyle,
        },
      });

      if (error) throw error;

      const lyrics = data?.lyrics;
      if (!lyrics) throw new Error('No lyrics generated');

      setGeneratedLyrics(lyrics);

      // Save to database
      const { data: savedSoundtrack, error: saveError } = await supabase
        .from('challenge_soundtracks')
        .insert({
          challenge_id: params.challengeId,
          user_id: user.id,
          title: `${params.targetTrait} Transformation`,
          lyrics,
          music_style: params.musicStyle,
          status: 'lyrics_ready',
          character_traits: [params.targetTrait],
          archetype_id: archetype?.id || null,
          metadata: {
            scenarioType: params.scenarioType,
            emotionalTrigger: params.emotionalTrigger,
          },
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setSoundtrack(savedSoundtrack as ChallengeSoundtrack);
      toast.success('Challenge lyrics generated!');
      return lyrics;
    } catch (error) {
      console.error('Error generating challenge lyrics:', error);
      toast.error('Failed to generate lyrics');
      return null;
    } finally {
      setIsGeneratingLyrics(false);
    }
  }, [user, canAfford, deductCredits, fetchUserArchetype, fetchChiefAim]);

  // Generate music from lyrics
  const generateChallengeMusic = useCallback(async (
    soundtrackId: string,
    lyrics: string,
    musicStyle: string,
    title: string,
    vocalGender: 'm' | 'f' = 'm'
  ) => {
    if (!user) {
      toast.error('Please sign in to generate music');
      return null;
    }

    // Music generation uses the music type
    if (!canAfford('music')) {
      toast.error('Insufficient credits for music generation');
      return null;
    }

    setIsGeneratingMusic(true);
    try {
      await deductCredits('music');

      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'generate-music',
          lyrics,
          musicStyle,
          title,
          vocalGender,
          scriptId: soundtrackId, // Use soundtrack ID as script ID for tracking
        },
      });

      if (error) throw error;

      const taskId = data?.taskId;
      if (!taskId) throw new Error('No task ID returned');

      // Update soundtrack with task ID
      await supabase
        .from('challenge_soundtracks')
        .update({
          suno_task_id: taskId,
          status: 'generating',
          updated_at: new Date().toISOString(),
        })
        .eq('id', soundtrackId);

      toast.success('Music generation started! This may take a few minutes.');
      return taskId;
    } catch (error) {
      console.error('Error generating music:', error);
      toast.error('Failed to generate music');
      return null;
    } finally {
      setIsGeneratingMusic(false);
    }
  }, [user, canAfford, deductCredits]);

  // Check music generation status
  const checkMusicStatus = useCallback(async (soundtrackId: string, taskId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-mind-movie-music', {
        body: {
          action: 'check-status',
          taskId,
          scriptId: soundtrackId,
        },
      });

      if (error) throw error;

      if (data?.status === 'completed' && data?.audioUrl) {
        // Update soundtrack with audio URL
        await supabase
          .from('challenge_soundtracks')
          .update({
            audio_url: data.audioUrl,
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', soundtrackId);

        toast.success('Your challenge soundtrack is ready!');
        return { status: 'completed', audioUrl: data.audioUrl };
      }

      return { status: data?.status || 'pending', audioUrl: null };
    } catch (error) {
      console.error('Error checking music status:', error);
      return { status: 'error', audioUrl: null };
    }
  }, []);

  // Fetch existing soundtrack for a challenge
  const fetchChallengeSoundtrack = useCallback(async (challengeId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('challenge_soundtracks')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const result = data as ChallengeSoundtrack | null;
      setSoundtrack(result);
      if (result?.lyrics) {
        setGeneratedLyrics(result.lyrics);
      }
      return result;
    } catch (error) {
      console.error('Error fetching soundtrack:', error);
      return null;
    }
  }, [user]);

  return {
    isGeneratingLyrics,
    isGeneratingMusic,
    generatedLyrics,
    soundtrack,
    generateChallengeLyrics,
    generateChallengeMusic,
    checkMusicStatus,
    fetchChallengeSoundtrack,
    setGeneratedLyrics,
  };
}
