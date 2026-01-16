/**
 * AuthorProfileEditor
 *
 * Form component for editing author profile information.
 * Handles display name, bio, expertise tags, social links, and avatar.
 */

import { useState, useCallback, useEffect, useId } from 'react';
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Plus,
  X,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
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

interface AuthorProfileEditorProps {
  profile: AuthorProfile | null;
  userId: string;
  onSave: (data: Partial<AuthorProfile>) => Promise<void>;
  isSaving?: boolean;
}

interface FormData {
  displayName: string;
  bio: string;
  expertise: string[];
  socialLinks: SocialLink[];
  avatarType: AuthorProfile['avatarType'];
  avatarData: string | null;
  avatarBgColor: string | null;
}

// =============================================================================
// Constants
// =============================================================================

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'website', label: 'Website' },
];

const PLATFORM_ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  website: Globe,
};

const MAX_BIO_LENGTH = 500;

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
// AuthorProfileEditor Component
// =============================================================================

export function AuthorProfileEditor({
  profile,
  userId,
  onSave,
  isSaving = false,
}: AuthorProfileEditorProps) {
  const formId = useId();

  // Initialize form data from profile
  const [formData, setFormData] = useState<FormData>(() => ({
    displayName: profile?.displayName ?? '',
    bio: profile?.bio ?? '',
    expertise: profile ? parseExpertise(profile.expertise) : [],
    socialLinks: profile ? parseSocialLinks(profile.socialLinks) : [],
    avatarType: profile?.avatarType ?? 'initials',
    avatarData: profile?.avatarData ?? null,
    avatarBgColor: profile?.avatarBgColor ?? null,
  }));

  // State for expertise tag input
  const [expertiseInput, setExpertiseInput] = useState('');

  // State for new social link
  const [newLinkPlatform, setNewLinkPlatform] = useState<SocialPlatform>('github');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        bio: profile.bio,
        expertise: parseExpertise(profile.expertise),
        socialLinks: parseSocialLinks(profile.socialLinks),
        avatarType: profile.avatarType,
        avatarData: profile.avatarData,
        avatarBgColor: profile.avatarBgColor,
      });
    }
  }, [profile]);

  // Handle display name change
  const handleDisplayNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, displayName: value }));
      if (errors.displayName && value.trim()) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.displayName;
          return next;
        });
      }
    },
    [errors.displayName]
  );

  // Handle bio change
  const handleBioChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_BIO_LENGTH) {
        setFormData((prev) => ({ ...prev, bio: value }));
      }
    },
    []
  );

  // Handle expertise tag input (comma-separated)
  const handleExpertiseKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const tag = expertiseInput.trim().replace(/,/g, '');
        if (tag && !formData.expertise.includes(tag)) {
          setFormData((prev) => ({
            ...prev,
            expertise: [...prev.expertise, tag],
          }));
        }
        setExpertiseInput('');
      }
    },
    [expertiseInput, formData.expertise]
  );

  // Handle expertise tag removal
  const handleRemoveExpertise = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  // Handle adding a new social link
  const handleAddSocialLink = useCallback(() => {
    const url = newLinkUrl.trim();
    if (!url) return;

    // Check if platform already exists
    const exists = formData.socialLinks.some(
      (link) => link.platform === newLinkPlatform
    );
    if (exists) {
      // Update existing link
      setFormData((prev) => ({
        ...prev,
        socialLinks: prev.socialLinks.map((link) =>
          link.platform === newLinkPlatform ? { ...link, url } : link
        ),
      }));
    } else {
      // Add new link
      setFormData((prev) => ({
        ...prev,
        socialLinks: [...prev.socialLinks, { platform: newLinkPlatform, url }],
      }));
    }

    setNewLinkUrl('');
  }, [newLinkPlatform, newLinkUrl, formData.socialLinks]);

  // Handle removing a social link
  const handleRemoveSocialLink = useCallback((platform: SocialPlatform) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((link) => link.platform !== platform),
    }));
  }, []);

  // Handle avatar update from AuthorAvatar component
  // Note: The AuthorAvatar component stores images in Cache API and returns the path
  const handleAvatarChange = useCallback(
    (type: AuthorProfile['avatarType'], data: string | null) => {
      setFormData((prev) => ({
        ...prev,
        avatarType: type,
        avatarData: data,
      }));
    },
    []
  );

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.displayName]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        await onSave({
          displayName: formData.displayName.trim(),
          bio: formData.bio.trim(),
          expertise: JSON.stringify(formData.expertise),
          socialLinks: JSON.stringify(formData.socialLinks),
          avatarType: formData.avatarType,
          avatarData: formData.avatarData,
          avatarBgColor: formData.avatarBgColor,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to save profile:', error);
      }
    },
    [formData, onSave, validateForm]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Choose how you appear on your published content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthorAvatar
            userId={userId}
            displayName={formData.displayName || 'Author'}
            avatarType={formData.avatarType}
            avatarData={formData.avatarData}
            avatarBgColor={formData.avatarBgColor}
            editable
            onAvatarChange={handleAvatarChange}
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Your public author profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-displayName`}>
              Display Name <span className="text-error">*</span>
            </Label>
            <Input
              id={`${formId}-displayName`}
              value={formData.displayName}
              onChange={handleDisplayNameChange}
              placeholder="Enter your display name"
              aria-invalid={!!errors.displayName}
              aria-describedby={errors.displayName ? `${formId}-displayName-error` : undefined}
              disabled={isSaving}
            />
            {errors.displayName && (
              <p
                id={`${formId}-displayName-error`}
                className="text-sm text-error"
                role="alert"
              >
                {errors.displayName}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${formId}-bio`}>Bio</Label>
              <span
                className={cn(
                  'text-xs',
                  formData.bio.length > MAX_BIO_LENGTH * 0.9
                    ? 'text-warning'
                    : 'text-text-muted'
                )}
              >
                {formData.bio.length}/{MAX_BIO_LENGTH}
              </span>
            </div>
            <textarea
              id={`${formId}-bio`}
              value={formData.bio}
              onChange={handleBioChange}
              placeholder="Tell learners about yourself..."
              rows={4}
              className={cn(
                'flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'placeholder:text-text-muted',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'resize-none'
              )}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expertise Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Expertise</CardTitle>
          <CardDescription>
            Add tags to highlight your areas of expertise (comma-separated)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-expertise`}>Add Expertise Tags</Label>
            <Input
              id={`${formId}-expertise`}
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyDown={handleExpertiseKeyDown}
              placeholder="Type a tag and press Enter or comma"
              disabled={isSaving}
            />
          </div>

          {formData.expertise.length > 0 && (
            <div className="flex flex-wrap gap-2" role="list" aria-label="Expertise tags">
              {formData.expertise.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1"
                  role="listitem"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveExpertise(tag)}
                    className="ml-1 rounded-full p-0.5 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-border-focus"
                    aria-label={`Remove ${tag}`}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Add links to your social profiles and website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Link */}
          <div className="flex gap-2">
            <select
              value={newLinkPlatform}
              onChange={(e) => setNewLinkPlatform(e.target.value as SocialPlatform)}
              className={cn(
                'flex h-11 w-32 rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              disabled={isSaving}
              aria-label="Social platform"
            >
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
            <Input
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className="flex-1"
              disabled={isSaving}
              aria-label="Social link URL"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddSocialLink}
              disabled={!newLinkUrl.trim() || isSaving}
              aria-label="Add social link"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Existing Links */}
          {formData.socialLinks.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Social links">
              {formData.socialLinks.map((link) => {
                const Icon = PLATFORM_ICONS[link.platform];
                const platformLabel = SOCIAL_PLATFORMS.find(
                  (p) => p.value === link.platform
                )?.label;

                return (
                  <div
                    key={link.platform}
                    className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
                    role="listitem"
                  >
                    <Icon className="h-5 w-5 text-text-muted" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium">{platformLabel}</p>
                      <p className="truncate text-xs text-text-muted">{link.url}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSocialLink(link.platform)}
                      aria-label={`Remove ${platformLabel} link`}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default AuthorProfileEditor;
