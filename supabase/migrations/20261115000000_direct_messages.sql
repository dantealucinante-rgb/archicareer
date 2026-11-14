-- Direct messages between two people.
--
-- A conversation is not a stored row: it is the set of messages between an
-- unordered pair of users. That keeps the schema to one table and means a
-- thread exists exactly when someone has written in it.

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 4000),
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT messages_no_self_send CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(recipient_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only the two people in a conversation can read it.
DROP POLICY IF EXISTS "Participants can read their messages" ON public.messages;
CREATE POLICY "Participants can read their messages" ON public.messages
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- You can only send as yourself, and only from an active account.
DROP POLICY IF EXISTS "Active users can send messages" ON public.messages;
CREATE POLICY "Active users can send messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id AND public.is_active_account());

-- Only the recipient can mark a message read.
DROP POLICY IF EXISTS "Recipients can mark messages read" ON public.messages;
CREATE POLICY "Recipients can mark messages read" ON public.messages
    FOR UPDATE TO authenticated
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- Senders can take back a message they sent.
DROP POLICY IF EXISTS "Senders can delete their messages" ON public.messages;
CREATE POLICY "Senders can delete their messages" ON public.messages
    FOR DELETE TO authenticated
    USING (auth.uid() = sender_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
REVOKE ALL ON public.messages FROM anon;
