import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

/**
 * AudioPlayer Props
 */
export interface AudioPlayerProps {
  /** URL to the audio file (from Cache API) */
  src: string;
  /** Title for accessibility */
  title?: string;
  /** Called when playback starts */
  onPlay?: () => void;
  /** Called when playback pauses */
  onPause?: () => void;
  /** Called when audio ends */
  onEnded?: () => void;
  /** Called with current time during playback for sync */
  onTimeUpdate?: (currentTime: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * AudioPlayer Component
 *
 * Audio playback component optimized for offline use with Cache API.
 *
 * Features:
 * - Play/pause control
 * - Progress bar with scrubbing
 * - Time display (current / total)
 * - Mute toggle
 * - Works with cached audio files
 * - Progress tracking callbacks
 *
 * Accessibility:
 * - Proper button labels
 * - Keyboard controls
 * - Screen reader announcements
 */
export function AudioPlayer({
  src,
  title = 'Audio',
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress as percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle play/pause
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        await audio.play();
        setIsPlaying(true);
        onPlay?.();
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setError('Failed to play audio');
    }
  }, [isPlaying, onPlay, onPause]);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Handle progress bar click for seeking
  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const progressBar = progressRef.current;
      if (!audio || !progressBar || duration === 0) return;

      const rect = progressBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;

      audio.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Handle keyboard controls
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const audio = audioRef.current;
      if (!audio) return;

      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowRight':
          event.preventDefault();
          audio.currentTime = Math.min(duration, audio.currentTime + 5);
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          break;
      }
    },
    [togglePlay, toggleMute, duration]
  );

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoaded(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onTimeUpdate, onEnded]);

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-error/50 bg-error/10 p-3',
          className
        )}
        role="alert"
      >
        <span className="text-sm text-error">{error}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-surface p-3',
        className
      )}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label={`Audio player: ${title}`}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={!isLoaded}
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white',
          'transition-all duration-fast',
          'hover:bg-primary-light',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="flex flex-1 cursor-pointer flex-col gap-1"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Audio progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
      >
        <Progress value={progress} className="h-1" />
      </div>

      {/* Time display */}
      <span className="flex-shrink-0 text-xs font-medium text-text-muted">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Mute button */}
      <button
        type="button"
        onClick={toggleMute}
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          'text-text-muted hover:text-text',
          'transition-colors duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-background'
        )}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        aria-pressed={isMuted}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/**
 * AudioPlayerSkeleton
 *
 * Loading skeleton for the AudioPlayer component.
 */
export function AudioPlayerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-surface p-3',
        className
      )}
      aria-busy="true"
      aria-label="Loading audio player..."
    >
      <div className="h-10 w-10 animate-pulse rounded-full bg-surface-hover" />
      <div className="h-1 flex-1 animate-pulse rounded-full bg-surface-hover" />
      <div className="h-4 w-16 animate-pulse rounded bg-surface-hover" />
      <div className="h-8 w-8 animate-pulse rounded-full bg-surface-hover" />
    </div>
  );
}

export default AudioPlayer;
