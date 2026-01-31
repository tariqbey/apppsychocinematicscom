import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings2, Zap, Heart, Music2, Mic, Volume2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MusicCustomization {
  tempo: 'slow' | 'medium' | 'fast' | 'very-fast';
  energy: number; // 1-10
  mood: 'uplifting' | 'intense' | 'calm' | 'aggressive' | 'emotional' | 'triumphant';
  vocalIntensity: 'soft' | 'medium' | 'powerful';
  instrumentalEmphasis: 'balanced' | 'beat-heavy' | 'melodic' | 'bass-heavy';
  additionalTags: string;
}

interface MusicCustomizationPanelProps {
  customization: MusicCustomization;
  onChange: (customization: MusicCustomization) => void;
  vocalGender: 'm' | 'f';
  onVocalGenderChange: (gender: 'm' | 'f') => void;
  personaId: string;
  onPersonaIdChange: (id: string) => void;
  songCount: 1 | 2;
  onSongCountChange: (count: 1 | 2) => void;
  className?: string;
}

const tempoOptions = [
  { value: 'slow', label: 'Slow', bpm: '60-90 BPM', icon: '🐢' },
  { value: 'medium', label: 'Medium', bpm: '90-120 BPM', icon: '🚶' },
  { value: 'fast', label: 'Fast', bpm: '120-150 BPM', icon: '🏃' },
  { value: 'very-fast', label: 'Very Fast', bpm: '150+ BPM', icon: '⚡' },
];

const moodOptions = [
  { value: 'uplifting', label: 'Uplifting', emoji: '🌟', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'triumphant', label: 'Triumphant', emoji: '🏆', color: 'bg-gold/20 text-gold border-gold/30' },
  { value: 'intense', label: 'Intense', emoji: '🔥', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'aggressive', label: 'Aggressive', emoji: '💪', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'emotional', label: 'Emotional', emoji: '💫', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'calm', label: 'Calm', emoji: '🧘', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
];

const vocalIntensityOptions = [
  { value: 'soft', label: 'Soft & Smooth', description: 'Gentle, flowing vocals' },
  { value: 'medium', label: 'Balanced', description: 'Versatile vocal delivery' },
  { value: 'powerful', label: 'Powerful', description: 'Strong, commanding vocals' },
];

const instrumentalOptions = [
  { value: 'balanced', label: 'Balanced', description: 'Even mix of all elements' },
  { value: 'beat-heavy', label: 'Beat Heavy', description: 'Drums & percussion forward' },
  { value: 'melodic', label: 'Melodic', description: 'Synths & melodies emphasized' },
  { value: 'bass-heavy', label: 'Bass Heavy', description: 'Deep, rumbling bass lines' },
];

export const MusicCustomizationPanel: React.FC<MusicCustomizationPanelProps> = ({
  customization,
  onChange,
  vocalGender,
  onVocalGenderChange,
  personaId,
  onPersonaIdChange,
  songCount,
  onSongCountChange,
  className,
}) => {
  const updateField = <K extends keyof MusicCustomization>(field: K, value: MusicCustomization[K]) => {
    onChange({ ...customization, [field]: value });
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-gold" />
          Advanced Music Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tempo Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Tempo
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tempoOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateField('tempo', option.value as MusicCustomization['tempo'])}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all",
                  customization.tempo === option.value
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border hover:border-gold/50 hover:bg-gold/5"
                )}
              >
                <span className="text-xl mb-1 block">{option.icon}</span>
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.bpm}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            Mood / Vibe
          </Label>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateField('mood', option.value as MusicCustomization['mood'])}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2",
                  customization.mood === option.value
                    ? option.color
                    : "border-border hover:border-gold/50 bg-background"
                )}
              >
                <span>{option.emoji}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              Energy Level
            </Label>
            <Badge variant="outline" className="text-gold border-gold/30">
              {customization.energy}/10
            </Badge>
          </div>
          <Slider
            value={[customization.energy]}
            onValueChange={(v) => updateField('energy', v[0])}
            min={1}
            max={10}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Chill</span>
            <span>Moderate</span>
            <span>Intense</span>
          </div>
        </div>

        {/* Vocal Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vocal Gender */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              Vocal Gender
            </Label>
            <RadioGroup 
              value={vocalGender} 
              onValueChange={(v) => onVocalGenderChange(v as 'm' | 'f')}
              className="flex gap-3"
            >
              <label 
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  vocalGender === 'm' 
                    ? "border-gold bg-gold/10" 
                    : "border-border hover:border-gold/50"
                )}
              >
                <RadioGroupItem value="m" id="male" className="sr-only" />
                <span className="text-lg">👨</span>
                <span className="font-medium">Male</span>
              </label>
              <label 
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  vocalGender === 'f' 
                    ? "border-gold bg-gold/10" 
                    : "border-border hover:border-gold/50"
                )}
              >
                <RadioGroupItem value="f" id="female" className="sr-only" />
                <span className="text-lg">👩</span>
                <span className="font-medium">Female</span>
              </label>
            </RadioGroup>
          </div>

          {/* Vocal Intensity */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              Vocal Intensity
            </Label>
            <Select 
              value={customization.vocalIntensity} 
              onValueChange={(v) => updateField('vocalIntensity', v as MusicCustomization['vocalIntensity'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vocalIntensityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Instrumental Emphasis */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-muted-foreground" />
            Instrumental Emphasis
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {instrumentalOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateField('instrumentalEmphasis', option.value as MusicCustomization['instrumentalEmphasis'])}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all",
                  customization.instrumentalEmphasis === option.value
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border hover:border-gold/50 hover:bg-gold/5"
                )}
              >
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Song Count */}
        <div className="space-y-3">
          <Label>Number of Versions</Label>
          <RadioGroup 
            value={songCount.toString()} 
            onValueChange={(v) => onSongCountChange(parseInt(v) as 1 | 2)}
            className="flex gap-3"
          >
            <label 
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                songCount === 1 
                  ? "border-gold bg-gold/10" 
                  : "border-border hover:border-gold/50"
              )}
            >
              <RadioGroupItem value="1" id="one" className="sr-only" />
              <span className="font-medium">1 Version</span>
            </label>
            <label 
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                songCount === 2 
                  ? "border-gold bg-gold/10" 
                  : "border-border hover:border-gold/50"
              )}
            >
              <RadioGroupItem value="2" id="two" className="sr-only" />
              <span className="font-medium">2 Versions</span>
              <Badge variant="secondary" className="text-xs">Compare</Badge>
            </label>
          </RadioGroup>
        </div>

        {/* Additional Tags */}
        <div className="space-y-3">
          <Label htmlFor="additionalTags">
            Additional Style Tags
            <span className="text-xs text-muted-foreground ml-2">(comma-separated)</span>
          </Label>
          <Textarea
            id="additionalTags"
            value={customization.additionalTags}
            onChange={(e) => updateField('additionalTags', e.target.value)}
            placeholder="e.g., orchestral strings, choir, trap hi-hats, piano intro"
            className="min-h-[60px]"
          />
        </div>

        {/* Persona ID (Advanced) */}
        <div className="space-y-3">
          <Label htmlFor="personaId">
            Voice Persona ID
            <span className="text-xs text-muted-foreground ml-2">(optional - specific voice)</span>
          </Label>
          <Input
            id="personaId"
            value={personaId}
            onChange={(e) => onPersonaIdChange(e.target.value)}
            placeholder="Leave empty for random voice"
            className="font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const getCustomizationStyleTags = (customization: MusicCustomization): string => {
  const tags: string[] = [];

  // Tempo tags
  const tempoMap = {
    'slow': 'slow tempo, laid-back',
    'medium': 'medium tempo, groovy',
    'fast': 'fast tempo, energetic',
    'very-fast': 'very fast tempo, high energy, rapid',
  };
  tags.push(tempoMap[customization.tempo]);

  // Mood tags
  const moodMap = {
    'uplifting': 'uplifting, positive, inspiring',
    'triumphant': 'triumphant, victorious, powerful',
    'intense': 'intense, driving, focused',
    'aggressive': 'aggressive, hard-hitting, fierce',
    'emotional': 'emotional, heartfelt, deep',
    'calm': 'calm, peaceful, serene',
  };
  tags.push(moodMap[customization.mood]);

  // Energy level
  if (customization.energy <= 3) {
    tags.push('low energy, relaxed');
  } else if (customization.energy <= 6) {
    tags.push('moderate energy');
  } else {
    tags.push('high energy, powerful');
  }

  // Vocal intensity
  const vocalMap = {
    'soft': 'soft vocals, smooth delivery',
    'medium': 'balanced vocals',
    'powerful': 'powerful vocals, strong delivery',
  };
  tags.push(vocalMap[customization.vocalIntensity]);

  // Instrumental emphasis
  const instrumentalMap = {
    'balanced': 'balanced production',
    'beat-heavy': 'heavy drums, percussion focused',
    'melodic': 'melodic, synth-driven',
    'bass-heavy': 'deep bass, 808s',
  };
  tags.push(instrumentalMap[customization.instrumentalEmphasis]);

  // Additional tags
  if (customization.additionalTags.trim()) {
    tags.push(customization.additionalTags.trim());
  }

  return tags.join(', ');
};

export const defaultMusicCustomization: MusicCustomization = {
  tempo: 'medium',
  energy: 7,
  mood: 'uplifting',
  vocalIntensity: 'medium',
  instrumentalEmphasis: 'balanced',
  additionalTags: '',
};
