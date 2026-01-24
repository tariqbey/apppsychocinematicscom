import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image, Loader2, X, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeaturedBannerUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
}

export function FeaturedBannerUpload({ 
  currentImageUrl, 
  onImageUploaded,
  onImageRemoved 
}: FeaturedBannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `featured-banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("community-media")
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      toast.success("Banner image uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = () => {
    if (!manualUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    onImageUploaded(manualUrl.trim());
    setManualUrl("");
    setShowUrlInput(false);
    toast.success("Banner image URL set!");
  };

  return (
    <div className="space-y-3">
      <Label>Banner Image</Label>
      
      {/* Current Image Preview */}
      {currentImageUrl && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img 
            src={currentImageUrl} 
            alt="Featured banner preview" 
            className="w-full h-32 object-cover"
          />
          {onImageRemoved && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={onImageRemoved}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Upload Options */}
      <div className="flex gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload Image
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <Link className="w-4 h-4 mr-2" />
          Use URL
        </Button>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={handleUrlSubmit}>
            Set URL
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Recommended: 1200x400px or similar wide banner format
      </p>
    </div>
  );
}
