-- Firms currently have no owner column or firm-management API. Do not allow
-- arbitrary authenticated users to modify every firm record.
DROP POLICY IF EXISTS "Allow changes to firms for authenticated users" ON public.firms;
