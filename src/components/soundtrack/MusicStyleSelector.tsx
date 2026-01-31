import { useState } from "react";
import { Music, Sparkles, Guitar, Mic2, Piano, Drum, Radio, Globe2, HeartHandshake, ChevronDown, ChevronUp, Check, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type MusicStyle, type MusicStyleOption, MUSIC_STYLES } from "@/hooks/useMindMovieMusic";

interface MusicStyleSelectorProps {
  value: MusicStyle;
  onChange: (style: MusicStyle) => void;
  customStyleText?: string;
  onCustomStyleTextChange?: (text: string) => void;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  description: string;
  styles: MusicStyleOption[];
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'hip-hop': return Mic2;
    case 'pop-electronic': return Radio;
    case 'rock': return Guitar;
    case 'orchestral': return Piano;
    case 'rnb-soul': return HeartHandshake;
    case 'jazz-blues': return Music;
    case 'folk-country': return Music;
    case 'gospel': return HeartHandshake;
    case 'world': return Globe2;
    case 'custom': return Wand2;
    default: return Music;
  }
};

const categories: CategoryConfig[] = [
  {
    id: 'hip-hop',
    label: 'Hip-Hop / Rap',
    icon: Mic2,
    gradient: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/40',
    description: 'Powerful flows, hard beats, motivational energy',
    styles: MUSIC_STYLES.filter(s => s.category === 'hip-hop'),
  },
  {
    id: 'pop-electronic',
    label: 'Pop & Electronic',
    icon: Radio,
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/40',
    description: 'Catchy hooks, modern production, high energy',
    styles: MUSIC_STYLES.filter(s => s.category === 'pop-electronic'),
  },
  {
    id: 'rock',
    label: 'Rock & Alternative',
    icon: Guitar,
    gradient: 'from-red-500/20 to-gray-500/20',
    borderColor: 'border-red-500/40',
    description: 'Guitar-driven anthems, raw power, rebellion',
    styles: MUSIC_STYLES.filter(s => s.category === 'rock'),
  },
  {
    id: 'orchestral',
    label: 'Orchestral & Cinematic',
    icon: Piano,
    gradient: 'from-gold/20 to-amber-500/20',
    borderColor: 'border-gold/40',
    description: 'Epic, sweeping, movie soundtrack vibes',
    styles: MUSIC_STYLES.filter(s => s.category === 'orchestral'),
  },
  {
    id: 'rnb-soul',
    label: 'R&B & Soul',
    icon: HeartHandshake,
    gradient: 'from-pink-500/20 to-purple-500/20',
    borderColor: 'border-pink-500/40',
    description: 'Smooth grooves, emotional depth, soulful',
    styles: MUSIC_STYLES.filter(s => s.category === 'rnb-soul'),
  },
  {
    id: 'jazz-blues',
    label: 'Jazz & Blues',
    icon: Music,
    gradient: 'from-blue-500/20 to-indigo-500/20',
    borderColor: 'border-blue-500/40',
    description: 'Sophisticated, soulful, timeless',
    styles: MUSIC_STYLES.filter(s => s.category === 'jazz-blues'),
  },
  {
    id: 'folk-country',
    label: 'Folk & Country',
    icon: Guitar,
    gradient: 'from-green-500/20 to-amber-500/20',
    borderColor: 'border-green-500/40',
    description: 'Heartfelt stories, acoustic warmth',
    styles: MUSIC_STYLES.filter(s => s.category === 'folk-country'),
  },
  {
    id: 'gospel',
    label: 'Gospel & Spiritual',
    icon: HeartHandshake,
    gradient: 'from-yellow-500/20 to-gold/20',
    borderColor: 'border-yellow-500/40',
    description: 'Uplifting, powerful, transcendent',
    styles: MUSIC_STYLES.filter(s => s.category === 'gospel'),
  },
  {
    id: 'world',
    label: 'World & Latin',
    icon: Globe2,
    gradient: 'from-teal-500/20 to-cyan-500/20',
    borderColor: 'border-teal-500/40',
    description: 'Global rhythms, vibrant energy',
    styles: MUSIC_STYLES.filter(s => s.category === 'world'),
  },
  {
    id: 'custom',
    label: 'Custom Style',
    icon: Wand2,
    gradient: 'from-gold/20 to-purple-500/20',
    borderColor: 'border-gold/40',
    description: 'Define your own unique sound',
    styles: MUSIC_STYLES.filter(s => s.category === 'custom'),
  },
];

export const MusicStyleSelector = ({
  value,
  onChange,
  customStyleText = "",
  onCustomStyleTextChange,
}: MusicStyleSelectorProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(() => {
    // Find which category the current value belongs to
    const currentStyle = MUSIC_STYLES.find(s => s.value === value);
    return currentStyle?.category || null;
  });

  const selectedStyle = MUSIC_STYLES.find(s => s.value === value);
  const selectedCategory = selectedStyle?.category || (value === 'Custom' ? 'custom' : null);

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
      // If it's the custom category, auto-select it
      if (categoryId === 'custom') {
        onChange('Custom');
      }
    }
  };

  const handleStyleSelect = (style: MusicStyle) => {
    onChange(style);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold flex items-center gap-2">
        <Music className="w-5 h-5 text-gold" />
        Choose Your Sound
      </Label>

      {/* Selected Style Preview */}
      {selectedStyle && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gold/10 border border-gold/30">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gold">{selectedStyle.label}</p>
            <p className="text-sm text-muted-foreground">{selectedStyle.description}</p>
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategory === category.id;
          const isSelected = selectedCategory === category.id;
          const hasSelection = category.styles.some(s => s.value === value);
          
          return (
            <div key={category.id} className={cn(
              "col-span-1",
              isExpanded && "col-span-2 md:col-span-3"
            )}>
              <button
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  "bg-gradient-to-br hover:scale-[1.02]",
                  category.gradient,
                  isSelected || hasSelection
                    ? `${category.borderColor} shadow-lg`
                    : "border-border/50 hover:border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isSelected || hasSelection ? "bg-background/60" : "bg-background/40"
                    )}>
                      <CategoryIcon className={cn(
                        "w-5 h-5",
                        isSelected || hasSelection ? "text-gold" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "font-semibold",
                        isSelected || hasSelection ? "text-foreground" : "text-foreground/80"
                      )}>
                        {category.label}
                      </p>
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {category.id !== 'custom' && (
                    <div className="flex items-center gap-2">
                      {hasSelection && (
                        <Badge variant="secondary" className="text-xs bg-gold/20 text-gold border-gold/30">
                          Selected
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Style Options */}
                {isExpanded && category.id !== 'custom' && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
                    {category.styles.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStyleSelect(style.value);
                        }}
                        className={cn(
                          "p-3 rounded-lg text-left transition-all",
                          value === style.value
                            ? "bg-gold/20 border-2 border-gold/50 shadow-md"
                            : "bg-background/40 border border-border/30 hover:bg-background/60 hover:border-border"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {value === style.value && (
                            <Check className="w-4 h-4 text-gold flex-shrink-0" />
                          )}
                          <span className={cn(
                            "font-medium text-sm",
                            value === style.value ? "text-gold" : "text-foreground/80"
                          )}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {style.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Style Input */}
      {value === 'Custom' && (
        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-gold/10 to-purple-500/10 border border-gold/30">
          <Label htmlFor="customStyle" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-gold" />
            Describe Your Custom Style
          </Label>
          <Input
            id="customStyle"
            value={customStyleText}
            onChange={(e) => onCustomStyleTextChange?.(e.target.value)}
            placeholder="e.g., 'Dark trap with orchestral elements and motivational energy'"
            className="bg-background/50"
          />
          <p className="text-xs text-muted-foreground">
            Be specific! Include tempo, mood, instruments, and any artists or songs you want it to sound like.
          </p>
        </div>
      )}
    </div>
  );
};
