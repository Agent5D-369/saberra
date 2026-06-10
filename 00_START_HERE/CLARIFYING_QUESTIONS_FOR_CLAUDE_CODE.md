# Clarifying Questions Claude Code Should Ask Rick

Before implementation, ask only the questions required to start the next phase.

## Project / Repo

1. Should I create a new repo or use an existing repo?
2. Preferred language: TypeScript/Node or Python?
3. Is there an existing Railway project to deploy into?
4. Is there a Vercel project, or should dashboard wait?

## Google

5. Does a Google Cloud project already exist for Amora?
6. Are Gmail API, Drive API, Docs API, and Calendar API enabled?
7. Do we already have OAuth client credentials?
8. Has `roots@amora.cr` completed OAuth consent for Gmail/Drive/Docs access?
9. Should the worker use Gmail polling for MVP? Default: yes.
10. Should the system create Gmail labels automatically or do they already exist?

## Notion

11. Are the MVP Notion databases already created?
12. Do you want me to generate Notion setup scripts/templates?
13. Do you have the Notion integration token?
14. Has the Notion integration been shared with all required databases?
15. Do we have database IDs?

## Claude API

16. Do we have an Anthropic API key?
17. Which model should be used for extraction?
18. Any token/cost limit per processing run?

## Processing

19. Should raw email body be stored in Notion, or summary + source link only?
20. Should long transcripts be stored only in Drive and summarized in Notion? Default: yes.
21. Who receives admin notifications?
22. Who receives access failure alerts?
23. Should access request emails be sent automatically from Roots? Default: yes.
24. Should recording audio transcription be excluded from MVP unless transcript/notes missing? Default: yes.

## Review

25. Who can approve canon changes?
26. Who can review sensitive items?
27. Should People/Organization profile updates remain draft-only? Default: yes.
28. Should CCOS ledger entries remain draft-only? Default: yes.

## Claude Team

29. Is the Claude Team workspace already created?
30. Who should have edit access to the main project?
31. Who should have view/use access?
32. Should restricted Claude Projects wait until after MVP?
