import { SceneCard } from "./SceneCard";
import type { Scene } from "@/hooks/useMindMovieScript";

interface StoryboardGridProps {
  scenes: Scene[];
  onUpdateScene?: (order: number, updates: Partial<Scene>) => void;
  onGenerateInEditBay?: (prompt: string) => void;
  onRegenerateScene?: (order: number) => void;
  onDeleteScene?: (order: number) => void;
  regeneratingSceneOrder?: number | null;
  isEditable?: boolean;
}

export function StoryboardGrid({ 
  scenes, 
  onUpdateScene, 
  onGenerateInEditBay,
  onRegenerateScene,
  onDeleteScene,
  regeneratingSceneOrder,
  isEditable = true,
}: StoryboardGridProps) {
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedScenes.map((scene) => (
        <SceneCard
          key={scene.order}
          scene={scene}
          onUpdate={
            isEditable && onUpdateScene
              ? (updates) => onUpdateScene(scene.order, updates)
              : undefined
          }
          onGenerateInEditBay={onGenerateInEditBay}
          onRegenerate={
            isEditable && onRegenerateScene
              ? () => onRegenerateScene(scene.order)
              : undefined
          }
          onDelete={
            isEditable && onDeleteScene
              ? () => onDeleteScene(scene.order)
              : undefined
          }
          isRegenerating={regeneratingSceneOrder === scene.order}
          isEditing={isEditable}
        />
      ))}
    </div>
  );
}
