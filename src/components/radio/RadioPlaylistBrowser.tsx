import { useState, useEffect } from "react";
import { Music, Play, ListMusic, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRadio, RadioPlaylist, RadioTrack } from "@/hooks/useRadio";

interface RadioPlaylistBrowserProps {
  onPlayTrack?: (track: RadioTrack) => void;
}

export const RadioPlaylistBrowser = ({ onPlayTrack }: RadioPlaylistBrowserProps) => {
  const {
    playlists,
    currentPlaylist,
    tracks,
    selectPlaylist,
    playTrack,
    loading,
  } = useRadio();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayTrack = (track: RadioTrack) => {
    playTrack(track);
    onPlayTrack?.(track);
  };

  if (loading) {
    return (
      <Card className="glass-card cinematic-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted/20 rounded w-1/3" />
            <div className="h-20 bg-muted/20 rounded" />
            <div className="h-20 bg-muted/20 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card cinematic-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListMusic className="h-5 w-5 text-gold" />
          Playlists
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playlist Grid */}
        {!currentPlaylist && (
          <div className="grid gap-3">
            {playlists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No playlists available yet
              </p>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => selectPlaylist(playlist)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/20 to-amber-600/20 flex items-center justify-center overflow-hidden">
                    {playlist.cover_image_url ? (
                      <img 
                        src={playlist.cover_image_url} 
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-6 h-6 text-gold/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate group-hover:text-gold transition-colors">
                        {playlist.name}
                      </p>
                      {playlist.is_featured && (
                        <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Track List */}
        {currentPlaylist && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectPlaylist(null as unknown as RadioPlaylist)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Playlists
              </Button>
              <span className="text-sm text-muted-foreground">
                {tracks.length} tracks
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/10 border border-gold/20">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-gold/30 to-amber-600/30 flex items-center justify-center overflow-hidden">
                {currentPlaylist.cover_image_url ? (
                  <img 
                    src={currentPlaylist.cover_image_url} 
                    alt={currentPlaylist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-7 h-7 text-gold" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gold">{currentPlaylist.name}</h3>
                {currentPlaylist.description && (
                  <p className="text-sm text-muted-foreground">{currentPlaylist.description}</p>
                )}
              </div>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {tracks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tracks in this playlist
                  </p>
                ) : (
                  tracks.map((track, index) => (
                    <button
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors w-full text-left group"
                    >
                      <span className="w-6 text-center text-sm text-muted-foreground group-hover:hidden">
                        {index + 1}
                      </span>
                      <Play className="w-4 h-4 text-gold hidden group-hover:block ml-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-gold transition-colors">
                          {track.title}
                        </p>
                        {track.artist && (
                          <p className="text-sm text-muted-foreground truncate">
                            {track.artist}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDuration(track.duration_seconds)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
