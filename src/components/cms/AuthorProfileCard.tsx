/**
 * AuthorProfileCard
 *
 * Read-only display card for author profiles.
 * Shows avatar, name, bio, expertise tags, and social links.
 */

import { Github, Linkedin, Twitter, Globe, BookOpen, Award } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, truncateText } from '@/lib/utils';
import type { AuthorProfile } from '@/lib/db';
import { AuthorAvatar } from './AuthorAvatar';

// =============================================================================
// Types
// =============================================================================

type SocialPlatform = 'github' | 'linkedin' | 'twitter' | 'website';

interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

interface AuthorStats {
  totalLessons: number;
  totalCourses: number;
}

interface AuthorProfileCardProps {
  profile: AuthorProfile;
  showStats?: boolean;
  stats?: AuthorStats;
  className?: string;
}

// Note: AuthorAvatar requires userId which is available on AuthorProfile

// =============================================================================
// Constants
// =============================================================================

const PLATFORM_ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  website: Globe,
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  website: 'Website',
};

const MAX_BIO_DISPLAY_LENGTH = 150;
const MAX_EXPERTISE_DISPLAY = 5;

// =============================================================================
// Helper Functions
// =============================================================================

function parseSocialLinks(json: string): SocialLink[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (link): link is SocialLink =>
          typeof link === 'object' &&
          link !== null &&
          typeof link.platform === 'string' &&
          typeof link.url === 'string'
      );
    }
  } catch {
    // Invalid JSON, return empty array
  }
  return [];
}

function parseExpertise(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    // Invalid JSON, return empty array
  }
  return [];
}

// =============================================================================
// AuthorProfileCard Component
// =============================================================================

export function AuthorProfileCard({
  profile,
  showStats = false,
  stats,
  className,
}: AuthorProfileCardProps) {
  const expertise = parseExpertise(profile.expertise);
  const socialLinks = parseSocialLinks(profile.socialLinks);
  const displayedExpertise = expertise.slice(0, MAX_EXPERTISE_DISPLAY);
  const remainingExpertiseCount = expertise.length - MAX_EXPERTISE_DISPLAY;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <AuthorAvatar
            userId={profile.userId}
            displayName={profile.displayName}
            avatarType={profile.avatarType}
            avatarData={profile.avatarData}
            avatarBgColor={profile.avatarBgColor}
            size="lg"
          />

          {/* Name and Bio */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text truncate">
              {profile.displayName}
            </h3>
            {profile.bio && (
              <p className="mt-1 text-sm text-text-muted line-clamp-3">
                {truncateText(profile.bio, MAX_BIO_DISPLAY_LENGTH)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        {showStats && stats && (
          <div className="flex gap-4 py-3 border-y border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-text-muted" />
              <span className="text-sm">
                <span className="font-semibold text-text">{stats.totalLessons}</span>
                <span className="text-text-muted"> lessons</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-text-muted" />
              <span className="text-sm">
                <span className="font-semibold text-text">{stats.totalCourses}</span>
                <span className="text-text-muted"> courses</span>
              </span>
            </div>
          </div>
        )}

        {/* Expertise Tags */}
        {displayedExpertise.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Expertise
            </h4>
            <div className="flex flex-wrap gap-1.5" role="list" aria-label="Expertise areas">
              {displayedExpertise.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs"
                  role="listitem"
                >
                  {tag}
                </Badge>
              ))}
              {remainingExpertiseCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs text-text-muted"
                  role="listitem"
                >
                  +{remainingExpertiseCount} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Connect
            </h4>
            <div className="flex gap-2" role="list" aria-label="Social links">
              {socialLinks.map((link) => {
                const Icon = PLATFORM_ICONS[link.platform];
                const label = PLATFORM_LABELS[link.platform];

                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md',
                      'border border-border bg-background',
                      'text-text-muted hover:text-text hover:bg-surface',
                      'transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-background'
                    )}
                    aria-label={`Visit ${label} profile`}
                    role="listitem"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {expertise.length === 0 && socialLinks.length === 0 && !profile.bio && (
          <p className="text-sm text-text-muted text-center py-2">
            No additional profile information available
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default AuthorProfileCard;
