-- Create testimonials table for user-submitted transformation stories
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  testimonial_type TEXT NOT NULL CHECK (testimonial_type IN ('text', 'audio', 'video')),
  text_content TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  user_title TEXT,
  result_highlight TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Users can insert their own testimonials
CREATE POLICY "Users can submit their own testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own testimonials
CREATE POLICY "Users can view their own testimonials"
ON public.testimonials
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all testimonials
CREATE POLICY "Admins can view all testimonials"
ON public.testimonials
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can update testimonials (approve/reject)
CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete testimonials
CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Public can view approved testimonials
CREATE POLICY "Public can view approved testimonials"
ON public.testimonials
FOR SELECT
USING (status = 'approved');

-- Create storage bucket for testimonial media
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('testimonials', 'testimonials', true, 5242880);

-- Storage policies for testimonials bucket
CREATE POLICY "Users can upload their own testimonial media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own testimonial media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own testimonial media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view testimonial media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'testimonials');

-- Create trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();