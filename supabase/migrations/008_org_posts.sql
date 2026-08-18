-- Migration 008: Add organization_id to posts for org attribution
-- This allows organization admins to create posts attributed to their org.

-- Add organization_id column to posts
ALTER TABLE public.posts
  ADD COLUMN organization_id uuid REFERENCES public.organizations (id) ON DELETE SET NULL;

CREATE INDEX idx_posts_organization ON public.posts (organization_id);

-- Update RLS policy to allow organization owners to insert posts with their org
DROP POLICY IF EXISTS "Authors can insert posts" ON public.posts;

CREATE POLICY "Authors can insert posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      business_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = business_id AND owner_id = auth.uid()
      )
    )
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id AND owner_id = auth.uid()
      )
    )
  );

-- Update RLS policy to allow organization owners to update posts with their org
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;

CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND owner_id = auth.uid()
    )
  );

-- Update RLS policy to allow organization owners to delete posts with their org
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;

CREATE POLICY "Authors can delete own posts"
  ON public.posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND owner_id = auth.uid()
    )
  );
