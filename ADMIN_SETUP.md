# Admin setup

The admin dashboard is intentionally closed by default. It does not use an email allowlist in browser code or expose an elevation flow.

After deploying `20261029000000_admin_governance.sql`, a database owner must grant the first role from a trusted Supabase SQL session:

```sql
INSERT INTO public.admin_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'epraiz121@gmail.com';
```

Only an existing `superadmin` may then grant or revoke roles through the protected admin API. Service-role credentials remain server-only.

The dashboard intentionally labels retention, active-user estimates, external health, and historic report data as unavailable until the platform collects the required events or connects a monitoring provider.
