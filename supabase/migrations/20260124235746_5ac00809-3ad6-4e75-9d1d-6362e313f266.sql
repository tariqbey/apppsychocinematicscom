-- Add collaboration fields to user_profiles for Director's Corner
-- These enable directors to share their dreams, skills, and connections

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS public_vision TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS looking_for TEXT,
ADD COLUMN IF NOT EXISTS can_offer TEXT,
ADD COLUMN IF NOT EXISTS show_collaboration_info BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.public_vision IS 'The director''s public dream/vision they want to manifest';
COMMENT ON COLUMN public.user_profiles.skills IS 'Array of skills the director has';
COMMENT ON COLUMN public.user_profiles.looking_for IS 'What kind of people, skills, or connections the director is seeking';
COMMENT ON COLUMN public.user_profiles.can_offer IS 'What connections, skills, or help the director can offer others';
COMMENT ON COLUMN public.user_profiles.show_collaboration_info IS 'Whether to display collaboration info publicly in Director''s Corner';