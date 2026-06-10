# Security and Permissions Canon

## Principle

Access must follow role and need, not curiosity.

## Roots Account

`roots@amora.cr` is powerful and must be protected.

Required:

- Strong unique password.
- 2-Step Verification or passkey.
- Recovery controlled by Amora.
- No casual password sharing.
- API keys in Railway/Vercel environment variables only.
- Quarterly access review.
- Documented recovery procedure.

## Google Workspace

Google controls access to Gmail, Drive, Docs, Meet, Calendar, and shared files.

The worker can only process files Roots can access.

Do not rely on email forwarding as permission.

## Notion

Notion controls access to structured backend.

Recommended roles:

- Workspace owner/admin: authorized stewards only.
- Normal staff: limited access/member.
- External collaborators: guest/limited access.
- Sensitive review: restricted.

## Claude Team

Claude Project permissions control who can use or edit Claude-facing project spaces.

They do not replace Google or Notion permissions.

## Automation Permissions

Automation may write draft/review records.

Automation must not publish canon or overwrite approved docs.

## Sensitive Content

Sensitive content includes:

- Interpersonal conflict
- Accusations
- Legal concerns
- Financial concerns
- Family/client privacy
- Health details
- Trauma disclosures
- Safety concerns
- Consent issues
- Relationship dynamics
- Power dynamics

Sensitive content must route to review and must not become general memory without approval.

## Secrets

Never commit:

- Google client secret
- Google refresh token
- Notion API key
- Anthropic API key
- Railway tokens
- Vercel tokens

## MCP Future Warning

If a private MCP server is added later:

- It must be authenticated.
- It must be private.
- It must be tool-scoped.
- It must be logged.
- It must not expose direct canon publishing to normal users.
- It must not expose delete/permission-change tools.
