import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useGlobalReferencePhoto() {
  const { user } = useAuth();
  const [referencePhotoUrl, setReferencePhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Convert unsupported formats (HEIC, etc.) to JPEG
  const convertToJpeg = async (file: File): Promise<{ blob: Blob; ext: string }> => {
    const originalType = file.type.toLowerCase();
    const originalName = file.name.toLowerCase();
    
    const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const unsupportedExtensions = ['heic', 'heif', 'avif', 'bmp', 'tiff', 'tif'];
    
    const ext = originalName.split('.').pop() || '';
    const needsConversion = unsupportedExtensions.includes(ext) || !supportedFormats.includes(originalType);
    
    if (!needsConversion) {
      return { blob: file, ext: ext === 'jpg' ? 'jpeg' : ext };
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, ext: 'jpeg' });
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image. HEIC format may not be supported in this browser.'));
      };
      
      img.src = url;
    });
  };

  // Fetch the current reference photo from user profile
  const fetchReferencePhoto = useCallback(async () => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('reference_photo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      const url = data?.reference_photo_url || null;
      setReferencePhotoUrl(url);
      return url;
    } catch (error) {
      console.error('Error fetching reference photo:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Upload and save reference photo globally
  const uploadReferencePhoto = useCallback(async (file: File) => {
    if (!user) {
      toast.error('Please sign in to save your reference photo');
      return null;
    }
    
    setIsUploading(true);
    try {
      // Convert to supported format if needed
      const { blob, ext } = await convertToJpeg(file);
      const fileName = `${user.id}/global-reference-${Date.now()}.${ext}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('generated-media')
        .upload(fileName, blob, { 
          upsert: true,
          contentType: `image/${ext}`
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('generated-media')
        .getPublicUrl(fileName);

      // Save to user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          reference_photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setReferencePhotoUrl(publicUrl);
      toast.success('Reference photo saved as default for all generations');
      return publicUrl;
    } catch (error) {
      console.error('Error uploading reference photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  // Clear the reference photo
  const clearReferencePhoto = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          reference_photo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setReferencePhotoUrl(null);
      toast.success('Reference photo removed');
    } catch (error) {
      console.error('Error clearing reference photo:', error);
      toast.error('Failed to remove reference photo');
    }
  }, [user]);

  return {
    referencePhotoUrl,
    isUploading,
    isLoading,
    fetchReferencePhoto,
    uploadReferencePhoto,
    clearReferencePhoto,
  };
}
