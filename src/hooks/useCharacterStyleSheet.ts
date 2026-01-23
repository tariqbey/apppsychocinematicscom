import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CharacterDescription {
  height?: string;
  weight?: string;
  build?: string;
  features?: string;
}

interface StyleSheetData {
  styleSheetUrl: string | null;
  isApproved: boolean;
}

export function useCharacterStyleSheet() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [styleSheetData, setStyleSheetData] = useState<StyleSheetData>({
    styleSheetUrl: null,
    isApproved: false,
  });

  const fetchStyleSheet = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('character_style_sheet_url, style_sheet_approved')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const result = {
        styleSheetUrl: (data as Record<string, unknown>)?.character_style_sheet_url as string | null,
        isApproved: (data as Record<string, unknown>)?.style_sheet_approved as boolean ?? false,
      };

      setStyleSheetData(result);
      return result;
    } catch (error) {
      console.error('Error fetching style sheet:', error);
      return null;
    }
  }, [user]);

  const generateStyleSheet = useCallback(async (
    referencePhotoUrl: string,
    characterDescription?: CharacterDescription
  ) => {
    if (!user) {
      toast.error('Please sign in to generate a style sheet');
      return null;
    }

    setIsGenerating(true);
    try {
      toast.info('Generating your character style sheet... This may take a moment.');

      const { data, error } = await supabase.functions.invoke('generate-character-style-sheet', {
        body: {
          referencePhotoUrl,
          characterDescription,
        },
      });

      if (error) throw error;

      if (data?.success && data?.styleSheetUrl) {
        setStyleSheetData({
          styleSheetUrl: data.styleSheetUrl,
          isApproved: false,
        });
        toast.success('Style sheet generated! Please review and approve it.');
        return data.styleSheetUrl;
      } else {
        throw new Error(data?.error || 'Failed to generate style sheet');
      }
    } catch (error) {
      console.error('Error generating style sheet:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate style sheet';
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const approveStyleSheet = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          style_sheet_approved: true,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('user_id', user.id);

      if (error) throw error;

      setStyleSheetData(prev => ({ ...prev, isApproved: true }));
      toast.success('Style sheet approved! It will now be used for all AI image generations.');
      return true;
    } catch (error) {
      console.error('Error approving style sheet:', error);
      toast.error('Failed to approve style sheet');
      return false;
    }
  }, [user]);

  const clearStyleSheet = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          character_style_sheet_url: null,
          style_sheet_approved: false,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('user_id', user.id);

      if (error) throw error;

      setStyleSheetData({ styleSheetUrl: null, isApproved: false });
      toast.success('Style sheet cleared');
      return true;
    } catch (error) {
      console.error('Error clearing style sheet:', error);
      toast.error('Failed to clear style sheet');
      return false;
    }
  }, [user]);

  return {
    styleSheetUrl: styleSheetData.styleSheetUrl,
    isApproved: styleSheetData.isApproved,
    isGenerating,
    fetchStyleSheet,
    generateStyleSheet,
    approveStyleSheet,
    clearStyleSheet,
  };
}
