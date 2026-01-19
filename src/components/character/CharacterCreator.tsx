import { ReferencePhotoSettings } from "@/components/settings/ReferencePhotoSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Info } from "lucide-react";

export function CharacterCreator() {
  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Create Your Hero Character
          </CardTitle>
          <CardDescription>
            Define your "Best Self" physical traits and generate a standardized hero image set. 
            These will be used as the default identity for all AI-generated images across the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Step 1:</strong> Upload a reference photo of yourself</p>
              <p><strong>Step 2:</strong> Describe your desired physical characteristics (height, weight, build)</p>
              <p><strong>Step 3:</strong> Generate hero images (front, side, back views)</p>
              <p className="pt-2 text-xs">
                Once created, your hero character will automatically appear in Mind Movies, 
                Challenge Storyboards, and all other visualizations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reference Photo & Description Form */}
      <ReferencePhotoSettings />
    </div>
  );
}
