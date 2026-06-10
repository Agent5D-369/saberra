# Productization Canon

## Generic Product Name

Living Memory Hub

## Technical Core

Living Memory Core

## First Customer Instance

Amora Living Memory Hub

## Productization Requirements

The system must be built as a reusable core, not Amora-only scripts.

Use:

- Tenant configuration
- Schema maps
- Connector modules
- Service layer boundaries
- Processing Events
- Review/canon workflow abstractions

## Core Service Modules

- ConfigService
- GmailIngestionService
- EmailClassifierService
- MeetAssetParserService
- GoogleAccessService
- GoogleDocsExportService
- NotionWriterService
- ClaudeExtractionService
- RetryService
- AccessRequestService
- ReviewRoutingService
- ProcessingEventService

## Tenant Configuration

Each org should configure:

- tenant_id
- organization_name
- instance_name
- capture_email
- google_workspace_domain
- notion_database_ids
- drive_folder_ids
- review_rules
- enabled connectors
- restricted categories

## MCP Readiness

MCP is a future interface layer, not the MVP automation engine.

Design internal service functions so they can later become private MCP tools:

Safe read tools:

- living_memory.search
- living_memory.get_meeting
- living_memory.get_open_tasks
- living_memory.get_person
- living_memory.get_organization
- living_memory.get_pending_reviews

Safe write tools:

- living_memory.create_task
- living_memory.submit_memory_candidate
- living_memory.submit_decision_candidate
- living_memory.submit_canon_change_request
- living_memory.create_ledger_draft

Restricted future tools:

- approve_memory_candidate
- approve_canon_change
- publish_policy_update
- update_role_definition
- update_circle_definition

Forbidden normal-user tools:

- delete_records
- overwrite_canon
- change_permissions
- send_external_email_without_review
- bulk_export_sensitive_records
- approve_governance_changes_without_review

## Deployment Profiles

### MVP Mode

- One capture account
- Railway worker
- Notion backend
- Claude API
- Gmail polling
- No MCP
- No custom dashboard required

### Pro Mode

- Separate capture and automation accounts
- Railway/Postgres
- Optional Vercel dashboard
- Private MCP server optional

### Enterprise Mode

- Tenant isolation
- SSO/security upgrades
- Audit log export
- Private MCP
- Advanced admin dashboard
- More formal data retention policies

## Redeployable Setup Checklist

For each customer:

1. Collect org details.
2. Create capture account.
3. Create Notion backend.
4. Create tenant config.
5. Configure Google OAuth.
6. Deploy Railway worker.
7. Run test matrix.
8. Train team.
9. Set review cadence.
