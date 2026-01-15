import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Trash2, ExternalLink, Eye, EyeOff, Facebook, Instagram, Twitter } from "lucide-react";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";
import type { Json } from "@/integrations/supabase/types";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  helpUrl: string;
  fields: { key: string; label: string; placeholder: string }[];
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="h-5 w-5" />,
    color: "bg-blue-600/10 text-blue-500",
    helpUrl: "https://developers.facebook.com/apps/",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "Your Facebook access token..." },
      { key: "page_id", label: "Page ID (optional)", placeholder: "Your Facebook page ID..." },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    color: "bg-pink-600/10 text-pink-500",
    helpUrl: "https://developers.facebook.com/docs/instagram-api/",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "Your Instagram access token..." },
      { key: "user_id", label: "User ID", placeholder: "Your Instagram user ID..." },
    ],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: <Twitter className="h-5 w-5" />,
    color: "bg-sky-600/10 text-sky-400",
    helpUrl: "https://developer.twitter.com/en/portal/dashboard",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Your Twitter API key..." },
      { key: "api_secret", label: "API Secret", placeholder: "Your Twitter API secret..." },
      { key: "access_token", label: "Access Token", placeholder: "Your access token..." },
      { key: "access_secret", label: "Access Token Secret", placeholder: "Your access token secret..." },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <TikTokIcon />,
    color: "bg-neutral-800/50 text-white",
    helpUrl: "https://developers.tiktok.com/",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "Your TikTok access token..." },
      { key: "open_id", label: "Open ID", placeholder: "Your TikTok Open ID..." },
    ],
  },
];

export function SocialMediaConnections() {
  const { integrations, loading, saveIntegration, deleteIntegration, getIntegration } = useUserIntegrations();
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSave = async (platformId: string, fields: { key: string }[]) => {
    setSaving(platformId);
    
    // Collect all field values for this platform
    const settings: Record<string, string> = {};
    let apiKey = "";
    
    fields.forEach((field, index) => {
      const value = formValues[`${platformId}_${field.key}`] || "";
      if (index === 0) {
        apiKey = value; // First field is treated as the primary key
      } else {
        settings[field.key] = value;
      }
    });

    if (apiKey) {
      const success = await saveIntegration(`social_${platformId}`, apiKey, settings as Json);
      if (success) {
        setFormValues({});
        setExpandedPlatform(null);
      }
    }
    
    setSaving(null);
  };

  const handleDelete = async (platformId: string) => {
    setDeleting(platformId);
    await deleteIntegration(`social_${platformId}`);
    setDeleting(null);
  };

  const isConnected = (platformId: string) => {
    return !!getIntegration(`social_${platformId}`)?.api_key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
        <CardDescription>
          Connect your social accounts to share directly with "Posted from Psycho-Cinematics" branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {SOCIAL_PLATFORMS.map((platform) => {
          const connected = isConnected(platform.id);
          const isExpanded = expandedPlatform === platform.id;
          
          return (
            <div
              key={platform.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => !connected && setExpandedPlatform(isExpanded ? null : platform.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <span className="font-medium">{platform.name}</span>
                </div>
                
                {connected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(platform.id);
                      }}
                      disabled={deleting === platform.id}
                    >
                      {deleting === platform.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Connected
                  </Badge>
                )}
              </div>

              {isExpanded && !connected && (
                <div className="p-4 pt-0 space-y-4 border-t border-border/50 bg-muted/10">
                  {platform.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-sm">{field.label}</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets[`${platform.id}_${field.key}`] ? "text" : "password"}
                          placeholder={field.placeholder}
                          value={formValues[`${platform.id}_${field.key}`] || ""}
                          onChange={(e) => setFormValues(prev => ({
                            ...prev,
                            [`${platform.id}_${field.key}`]: e.target.value
                          }))}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecrets(prev => ({
                            ...prev,
                            [`${platform.id}_${field.key}`]: !prev[`${platform.id}_${field.key}`]
                          }))}
                        >
                          {showSecrets[`${platform.id}_${field.key}`] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={platform.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Get API credentials
                    </a>
                    
                    <Button
                      onClick={() => handleSave(platform.id, platform.fields)}
                      disabled={saving === platform.id || !formValues[`${platform.id}_${platform.fields[0].key}`]}
                      size="sm"
                    >
                      {saving === platform.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground pt-2">
          Connected accounts will automatically include "Posted from Psycho-Cinematics" when sharing content.
        </p>
      </CardContent>
    </Card>
  );
}
