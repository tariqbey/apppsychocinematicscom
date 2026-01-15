import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Trash2, ExternalLink, Eye, EyeOff, LucideIcon } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  isConnected: boolean;
  onSave: (key: string, additionalSettings?: Record<string, string>) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  helpUrl?: string;
  helpSteps?: string[];
  inputLabel?: string;
  inputPlaceholder?: string;
  additionalFields?: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
  }[];
  note?: string;
}

export function IntegrationCard({
  name,
  description,
  icon: Icon,
  isConnected,
  onSave,
  onDelete,
  helpUrl,
  helpSteps,
  inputLabel = "API Key",
  inputPlaceholder = "Enter your API key...",
  additionalFields,
  note,
}: IntegrationCardProps) {
  const [apiKey, setApiKey] = useState("");
  const [additionalValues, setAdditionalValues] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setSaving(true);
    const success = await onSave(apiKey.trim(), additionalValues);
    if (success) {
      setApiKey("");
      setAdditionalValues({});
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Integration Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your {name} integration is securely configured
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{inputLabel}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={inputPlaceholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {additionalFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={additionalValues[field.key] || ""}
                  onChange={(e) => setAdditionalValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}

            <Button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Connect"
              )}
            </Button>
            
            {(helpSteps || helpUrl) && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                {helpSteps && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">How to get your credentials:</p>
                    <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                      {helpSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </>
                )}
                {helpUrl && (
                  <a
                    href={helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Get your credentials
                  </a>
                )}
              </div>
            )}

            {note && (
              <p className="text-xs text-muted-foreground">{note}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
