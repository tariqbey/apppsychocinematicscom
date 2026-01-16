import { useState, useCallback } from "react";
import { SceneCard } from "./SceneCard";
import type { Scene } from "@/hooks/useMindMovieScript";

interface DraggableStoryboardGridProps {
  scenes: Scene[];
  onUpdateScene?: (order: number, updates: Partial<Scene>) => void;
  onReorderScenes?: (newScenes: Scene[]) => void;
  onGenerateInEditBay?: (prompt: string, sceneOrder: number, sceneTitle: string) => void;
  onRegenerateScene?: (order: number) => void;
  onDeleteScene?: (order: number) => void;
  regeneratingSceneOrder?: number | null;
  isEditable?: boolean;
  selectedScenes?: number[];
  onSelectScene?: (order: number) => void;
  showSelection?: boolean;
}

export function DraggableStoryboardGrid({ 
  scenes, 
  onUpdateScene,
  onReorderScenes,
  onGenerateInEditBay,
  onRegenerateScene,
  onDeleteScene,
  regeneratingSceneOrder,
  isEditable = true,
  selectedScenes = [],
  onSelectScene,
  showSelection = false,
}: DraggableStoryboardGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isEditable) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }, [isEditable]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex || !onReorderScenes) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Create new array with reordered scenes
    const newScenes = [...sortedScenes];
    const [draggedScene] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(dropIndex, 0, draggedScene);

    // Update order numbers
    const reorderedScenes = newScenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
    }));

    onReorderScenes(reorderedScenes);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, sortedScenes, onReorderScenes]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedScenes.map((scene, index) => (
        <div
          key={scene.order}
          draggable={isEditable}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`transition-all duration-200 ${
            draggedIndex === index ? "opacity-50 scale-95" : ""
          } ${
            dragOverIndex === index 
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
              : ""
          } ${isEditable ? "cursor-grab active:cursor-grabbing" : ""}`}
        >
          <SceneCard
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
            isDragging={draggedIndex === index}
            isSelected={selectedScenes.includes(scene.order)}
            onSelectToggle={onSelectScene}
            showSelection={showSelection}
          />
        </div>
      ))}
    </div>
  );
}
