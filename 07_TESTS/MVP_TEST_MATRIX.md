# MVP Test Matrix

## Gmail / Email

| Test | Expected |
|---|---|
| New email to Roots | Source Email created |
| Duplicate Gmail message | Skipped |
| Email with [AMORA CAPTURE] | Classified as Operational Email |
| Forwarded thread | Classified as Forwarded Thread |
| Unknown email | Logged as Unknown or Manual Review |

## Google Meet Recording

| Test | Expected |
|---|---|
| Recording email received | Meeting Asset created |
| Recording link accessible | Access Confirmed |
| Recording link denied | Needs Access + request sent |
| Recording arrives before transcript | Meeting created, waits for text |
| Duplicate recording email | Existing asset updated/skipped |

## Google Meet Transcript

| Test | Expected |
|---|---|
| Transcript email received | Transcript asset created |
| Transcript accessible | Text exported |
| Transcript denied | Needs Access + retry |
| Transcript processed | Summary/extractions created |

## Google Meet Notes

| Test | Expected |
|---|---|
| Notes email received | Notes asset created |
| Notes accessible | Text exported |
| Notes processed | Meeting summary/tasks/decisions/risks created |

## Extraction

| Test | Expected |
|---|---|
| Clear task | Task record created |
| No owner | Task Needs Owner |
| Clear decision | Decision Candidate created |
| Canon-impacting issue | Canon Change Request created |
| Sensitive content | Sensitive flag created |
| Invalid Claude JSON | Retry/Manual Review |

## Access Retry

| Test | Expected |
|---|---|
| Immediate failure | Retry scheduled |
| Access granted before retry | Processing completes |
| Final retry fails | Manual Review |

## Canon Safety

| Test | Expected |
|---|---|
| Policy change detected | Canon Change Request only |
| Role change detected | Canon Change Request only |
| Legal/financial commitment detected | Canon Change Request only |
| Automation tries to publish canon | Blocked by design |
