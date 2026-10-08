<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Demo cart/orders live in one table (demo_requests) with status cart|submitted; client reads/writes via browser client under RLS — keeps the flow simple with owner-only access.
- Catalog and service policies live in public samples/services tables; public reads use a server function and shared query options so all storefronts reflect admin edits.
- Admin rights live only in user_roles and are verified through authenticated server calls and RLS; initial designated-admin claiming requires a verified Google identity because email signup auto-confirms unverified addresses.
- Order lifecycle keeps cart|submitted separate from processing_status; validation triggers protect required fields and admin-only changes.
