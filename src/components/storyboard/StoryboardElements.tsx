import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  User, 
  Package, 
  MapPin, 
  Plus, 
  X, 
  Upload, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StoryboardElement {
  id: string;
  type: "character" | "object" | "location";
  name: string;
  tag: string; // e.g., "@Isabella" or "#VillaSunset"
  description: string;
  referenceImage?: string;
}

interface StoryboardElementsProps {
  elements: StoryboardElement[];
  onElementsChange: (elements: StoryboardElement[]) => void;
  globalReferencePhoto?: string;
}

const ELEMENT_TYPES = [
  { 
    type: "character" as const, 
    icon: User, 
    label: "Characters", 
    prefix: "@",
    placeholder: "Main character, supporting cast...",
    description: "People appearing in your movie"
  },
  { 
    type: "object" as const, 
    icon: Package, 
    label: "Objects", 
    prefix: "#",
    placeholder: "Car, watch, briefcase...",
    description: "Key props and items"
  },
  { 
    type: "location" as const, 
    icon: MapPin, 
    label: "Locations", 
    prefix: "~",
    placeholder: "Beach house, office, jet...",
    description: "Settings and environments"
  },
];

export function StoryboardElements({ 
  elements, 
  onElementsChange,
  globalReferencePhoto 
}: StoryboardElementsProps) {
  const [expandedType, setExpandedType] = useState<string | null>("character");
  const [newElementName, setNewElementName] = useState<Record<string, string>>({});
  const [newElementDesc, setNewElementDesc] = useState<Record<string, string>>({});

  const addElement = (type: "character" | "object" | "location") => {
    const name = newElementName[type]?.trim();
    if (!name) return;

    const config = ELEMENT_TYPES.find(t => t.type === type)!;
    const tag = `${config.prefix}${name.replace(/\s+/g, "")}`;
    
    const newElement: StoryboardElement = {
      id: crypto.randomUUID(),
      type,
      name,
      tag,
      description: newElementDesc[type]?.trim() || "",
      referenceImage: type === "character" ? globalReferencePhoto : undefined,
    };

    onElementsChange([...elements, newElement]);
    setNewElementName({ ...newElementName, [type]: "" });
    setNewElementDesc({ ...newElementDesc, [type]: "" });
  };

  const removeElement = (id: string) => {
    onElementsChange(elements.filter(e => e.id !== id));
  };

  const updateElementImage = (id: string, imageUrl: string) => {
    onElementsChange(
      elements.map(e => e.id === id ? { ...e, referenceImage: imageUrl } : e)
    );
  };

  const handleImageUpload = async (id: string, file: File) => {
    // Convert to base64 for preview (in production, upload to storage)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateElementImage(id, result);
    };
    reader.readAsDataURL(file);
  };

  const getElementsByType = (type: "character" | "object" | "location") => 
    elements.filter(e => e.type === type);

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-gold" />
        <h3 className="font-medium">Visual Elements</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {elements.length} elements defined
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Define characters, objects, and locations for visual consistency across all scenes.
      </p>

      <div className="space-y-2">
        {ELEMENT_TYPES.map((config) => {
          const Icon = config.icon;
          const typeElements = getElementsByType(config.type);
          const isExpanded = expandedType === config.type;

          return (
            <Collapsible
              key={config.type}
              open={isExpanded}
              onOpenChange={() => setExpandedType(isExpanded ? null : config.type)}
            >
              <CollapsibleTrigger asChild>
                <button className={cn(
                  "w-full p-3 flex items-center gap-3 rounded-lg transition-all",
                  "hover:bg-muted/50",
                  isExpanded && "bg-muted/30"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    config.type === "character" && "bg-blue-500/20 text-blue-500",
                    config.type === "object" && "bg-amber-500/20 text-amber-500",
                    config.type === "location" && "bg-green-500/20 text-green-500"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-sm">{config.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({typeElements.length})
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-3 pb-3 space-y-3 animate-fade-in">
                {/* Existing elements */}
                {typeElements.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {typeElements.map((element) => (
                      <div
                        key={element.id}
                        className="group relative flex items-center gap-2 p-2 rounded-lg border border-border bg-background/50 text-sm"
                      >
                        {element.referenceImage ? (
                          <img 
                            src={element.referenceImage} 
                            alt={element.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <label className="w-8 h-8 rounded bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(element.id, file);
                              }}
                            />
                          </label>
                        )}
                        <div className="flex flex-col">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              config.type === "character" && "border-blue-500/50 text-blue-400",
                              config.type === "object" && "border-amber-500/50 text-amber-400",
                              config.type === "location" && "border-green-500/50 text-green-400"
                            )}
                          >
                            {element.tag}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {element.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeElement(element.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new element */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Input
                    placeholder={config.placeholder}
                    value={newElementName[config.type] || ""}
                    onChange={(e) => setNewElementName({ 
                      ...newElementName, 
                      [config.type]: e.target.value 
                    })}
                    className="text-sm h-9"
                  />
                  <Textarea
                    placeholder={`Describe this ${config.type}... (optional)`}
                    value={newElementDesc[config.type] || ""}
                    onChange={(e) => setNewElementDesc({ 
                      ...newElementDesc, 
                      [config.type]: e.target.value 
                    })}
                    className="text-sm min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addElement(config.type)}
                    disabled={!newElementName[config.type]?.trim()}
                    className="w-full"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add {config.type}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
