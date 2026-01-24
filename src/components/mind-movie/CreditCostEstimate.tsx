import { useMemo } from "react";
import { Coins, AlertTriangle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProductionCredits } from "@/hooks/useProductionCredits";
import type { Scene } from "@/hooks/useMindMovieScript";

interface CreditCostEstimateProps {
  scenes: Scene[];
  className?: string;
  videoModel?: string; // NEW: optional model for accurate video cost estimation
}

export function CreditCostEstimate({ scenes, className = "", videoModel }: CreditCostEstimateProps) {
  const { credits, estimateCreditCost, canAfford } = useProductionCredits();

  const costBreakdown = useMemo(() => {
    const scenesNeedingImages = scenes.filter(s => !s.generatedImageUrl);
    const scenesNeedingVideos = scenes.filter(s => s.generatedImageUrl && !s.generatedVideoUrl);
    // Also count scenes that will get videos after image generation
    const scenesForVideoAfterImage = scenes.filter(s => !s.generatedImageUrl && !s.generatedVideoUrl);

    // Calculate costs - pass model for accurate video pricing
    const imageCost = estimateCreditCost("image", undefined, "2k");
    const videoCostPerScene = estimateCreditCost("video", 8, undefined, videoModel); // 8 seconds max per video

    const totalImageCost = scenesNeedingImages.length * imageCost;
    const totalVideoCost = (scenesNeedingVideos.length + scenesForVideoAfterImage.length) * videoCostPerScene;
    const totalCost = totalImageCost + totalVideoCost;

    return {
      imagesNeeded: scenesNeedingImages.length,
      videosNeeded: scenesNeedingVideos.length + scenesForVideoAfterImage.length,
      imageCostEach: imageCost,
      videoCostEach: videoCostPerScene,
      totalImageCost,
      totalVideoCost,
      totalCost,
    };
  }, [scenes, estimateCreditCost, videoModel]);

  const canAffordTotal = useMemo(() => {
    if (!credits) return false;
    if (credits.isAdmin) return true;
    return credits.totalRemaining >= costBreakdown.totalCost;
  }, [credits, costBreakdown.totalCost]);

  if (costBreakdown.imagesNeeded === 0 && costBreakdown.videosNeeded === 0) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-green-500 ${className}`}>
        <CheckCircle className="w-3.5 h-3.5" />
        <span>All media generated</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-help transition-colors ${
              canAffordTotal 
                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" 
                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
            } ${className}`}
          >
            {canAffordTotal ? (
              <Coins className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>~{costBreakdown.totalCost.toLocaleString()} credits</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold">Estimated Cost Breakdown</p>
            
            {costBreakdown.imagesNeeded > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {costBreakdown.imagesNeeded} image{costBreakdown.imagesNeeded !== 1 ? "s" : ""} × {costBreakdown.imageCostEach} credits
                </span>
                <span className="font-mono">{costBreakdown.totalImageCost}</span>
              </div>
            )}
            
            {costBreakdown.videosNeeded > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {costBreakdown.videosNeeded} video{costBreakdown.videosNeeded !== 1 ? "s" : ""} × {costBreakdown.videoCostEach} credits
                </span>
                <span className="font-mono">{costBreakdown.totalVideoCost}</span>
              </div>
            )}
            
            <div className="flex justify-between gap-4 pt-1 border-t border-border/50 font-semibold">
              <span>Total</span>
              <span className="font-mono">{costBreakdown.totalCost.toLocaleString()} credits</span>
            </div>

            {credits && !credits.isAdmin && (
              <div className="pt-1 border-t border-border/50">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Your balance</span>
                  <span className={`font-mono ${canAffordTotal ? "text-green-500" : "text-destructive"}`}>
                    {credits.totalRemaining.toLocaleString()} credits
                  </span>
                </div>
                {!canAffordTotal && (
                  <p className="text-destructive mt-1">
                    Need {(costBreakdown.totalCost - credits.totalRemaining).toLocaleString()} more credits
                  </p>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
