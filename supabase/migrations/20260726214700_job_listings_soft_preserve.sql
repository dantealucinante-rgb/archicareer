-- DECISION: Soft-delete preservation for job_listings on account deletion
--
-- Hard-delete (ON DELETE CASCADE) was the original choice, but this means
-- job postings vanish silently if a firm deletes their account, making the
-- history inaccessible to candidates who saved those listings.
--
-- CHOSEN APPROACH: Drop the FK cascade and replace with SET NULL.
-- - The listing is preserved with user_id = NULL when the posting account is deleted.
-- - The existing `status` column is used to mark those listings as 'closed'
--   automatically via a trigger, so they disappear from the open feed.
-- - No new `archived` column is needed; status = 'closed' is sufficient.
-- - This decision is also noted in TODO_LIVE_VERIFICATION.md.

-- Step 1: Drop the old cascading FK on job_listings
ALTER TABLE public.job_listings
  DROP CONSTRAINT fk_job_user;

-- Step 2: Re-add FK with SET NULL behaviour
ALTER TABLE public.job_listings
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.job_listings
  ADD CONSTRAINT fk_job_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- Step 3: Trigger function — auto-close listings when their owner's account is deleted
-- This fires after the FK has been SET NULL for matching rows.
CREATE OR REPLACE FUNCTION public.close_orphaned_listings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.job_listings
  SET status = 'closed'
  WHERE user_id IS NULL AND status = 'open';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER close_orphaned_job_listings
AFTER UPDATE OF user_id ON public.job_listings
FOR EACH ROW
WHEN (OLD.user_id IS NOT NULL AND NEW.user_id IS NULL)
EXECUTE FUNCTION public.close_orphaned_listings();

-- The FK's ON DELETE SET NULL action updates job_listings.user_id, which invokes
-- the trigger above and closes the preserved listing immediately.
