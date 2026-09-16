---
title: FieldDays Session Planner
description: Fabric app for proposing, supporting, facilitating, and discussing community-led FieldDays sessions.
ms.date: 2026-09-16
ms.topic: reference
---

# FieldDays Session Planner

The FieldDays Session Planner is an authenticated React and Rayfin app for
building an event agenda with the community.

Signed-in users can:

* Propose sessions with a title, topic, format, and description.
* Upvote sessions they want to attend.
* Volunteer to help facilitate sessions.
* Add comments to session discussions.
* Sort proposals by popularity or recency.

## Getting started

```bash
npm run dev
```

Open <http://localhost:5173> to use the local app. Local development uses the
Rayfin mock authentication service and in-memory session data.

## Project structure

```text
rayfin/
  data/                    Secured entities for proposals and participation
  rayfin.yml               Fabric auth, data, and static hosting configuration
src/
  components/AuthPage.tsx  Sign-in experience
  hooks/AuthContext.tsx    Authentication state
  pages/HomePage.tsx       Session planning experience
  services/sessions.ts     Local and Fabric data operations
```

The Rayfin data model uses separate entities for session proposals, votes,
facilitator volunteers, and comments. Authentication policies associate
participation records with the signed-in user.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Apply backend state and start local development |
| `npm run build` | Type-check and build the production app |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run rayfin:up` | Deploy the app and schema to Fabric |

## Deployment

Deploy the current app and database schema:

```bash
npx rayfin up
npx rayfin up status
```

The deployment targets the configured **Session Planner** Fabric workspace.
