# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lunch Duel is a team lunch voting application built with Next.js 16 and Convex. It helps teams decide where to eat lunch through a fun two-phase process: a "vibe" selection phase followed by a voting phase on finalist restaurants.

## Development Commands

\`\`\`bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Start Convex backend (required for database/real-time features)
npx convex dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
\`\`\`

## Tech Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Backend/Database**: Convex (real-time backend-as-a-service)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives + custom components in `components/ui/`
- **Type Safety**: TypeScript with strict mode
- **Deployment**: Vercel (auto-synced from v0.app)

## Architecture

### Data Flow & State Management

The app uses **Convex** for all backend operations and real-time data synchronization. There is no traditional REST API or separate backend server.

**Key Concepts:**
- **Queries** (`useQuery`): Read data from Convex database, automatically re-render on changes
- **Mutations** (`useMutation`): Write data to Convex database
- **Local Storage**: User ID and Team ID are stored in localStorage with keys `lunchDuel_currentUserId` and `lunchDuel_currentTeamId`

### Database Schema (`convex/schema.ts`)

Three main tables:

1. **teams**: Stores team info, member IDs, restaurant lists, lunch windows
   - Indexed by `code` (6-character uppercase team code)
   - Contains array of restaurant objects with tags, dietary options, walk times, etc.

2. **users**: Individual user profiles with preferences
   - Fields: name, teamId, dietaryRestrictions, budget (1-3), maxWalkDistance (minutes)
   - Has nested `vibes` object (rushMode, spicy, tryingNew)

3. **dailySessions**: Daily lunch voting sessions per team
   - Indexed by `[teamId, date]`
   - Tracks phase (vibe → vote → result → inactive)
   - Stores selectedVibes (Record<userId, vibes[]>), votes (Record<userId, Record<restaurantId, score>>)
   - Has vibeDeadline and voteDeadline timestamps

### Application Flow

1. **Entry** (`/app/page.tsx`): Checks localStorage for userId/teamId, redirects to either `/join` or `/team/{code}/vibe`

2. **Join Flow** (`/app/join/page.tsx`):
   - User chooses to join existing team or create new one
   - Creates user record via `api.users.createUser`
   - Either joins team via `api.teams.joinTeam` or creates new team via `api.teams.createTeam`
   - New team creators go to `/admin/setup` to configure restaurants and settings

3. **Daily Session** (routes under `/app/team/[code]/`):
   - **Vibe Phase** (`vibe/page.tsx`): Users select mood/preferences for the day
   - **Vote Phase** (`vote/page.tsx`): Users vote on finalist restaurants
   - **Result Phase** (`result/page.tsx`): Display winning restaurant with confetti

4. **Admin Routes** (`/app/admin/`):
   - `/admin/setup`: Configure team settings (office address, lunch window)
   - `/admin/places`: Manage restaurant list for the team

### Convex Functions Organization

- `convex/teams.ts`: Team CRUD operations, joinTeam, updateTeam
- `convex/users.ts`: User CRUD operations, getUser, getUsersByIds
- `convex/sessions.ts`: Daily session management, phase transitions, vibe/vote tracking

### Routing Structure

\`\`\`
/                          -> Entry point (redirects based on auth state)
/join                      -> Join or create team
/preferences               -> Set user dietary/budget preferences
/team/[code]/vibe          -> Daily vibe selection phase
/team/[code]/vote          -> Daily voting phase
/team/[code]/result        -> Daily result display
/admin/setup               -> Team configuration (first-time setup)
/admin/places              -> Restaurant management
\`\`\`

### Component Organization

- `components/ui/`: Reusable UI primitives (built on Radix UI)
- `components/convex-provider.tsx`: Wraps app with ConvexProvider, handles missing CONVEX_URL gracefully
- `components/countdown-timer.tsx`: Reusable timer component for deadlines
- `components/theme-provider.tsx`: Dark mode support (via next-themes)

### Styling Conventions

- Uses Tailwind CSS v4 with PostCSS
- CSS variables defined in `app/globals.css` for theming
- Font variables: `--font-sans` (Inter), `--font-serif` (Fraunces)
- Path alias `@/*` points to project root (configured in tsconfig.json)

## Important Notes

- **Build Configuration**: `next.config.mjs` has `ignoreBuildErrors` and `ignoreDuringBuilds` set to true for TypeScript/ESLint - fix these when adding new features
- **Convex Setup**: If CONVEX_URL is missing, run `npx convex dev --once --configure=new`
- **v0.app Sync**: This repo auto-syncs with v0.app deployments - coordinate changes carefully
- **localStorage Keys**: Always use constants `CURRENT_USER_ID_KEY` and `CURRENT_TEAM_ID_KEY` for consistency
- **Date Format**: Sessions use `YYYY-MM-DD` format for dates (from `new Date().toISOString().split("T")[0]`)
- **Team Codes**: 6-character codes exclude ambiguous characters (O, I, 0, 1)

## Convex Development

When modifying Convex functions:
1. Ensure `npx convex dev` is running to see changes
2. Schema changes require updating both `convex/schema.ts` and TypeScript types
3. Use `v` validators from `convex/values` for all mutation/query arguments
4. Convex auto-generates types in `convex/_generated/` - import from there

## Common Patterns

**Checking user/team state:**
\`\`\`typescript
const userId = getUserId(); // from localStorage
const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
// Wait for loading: if (user === undefined) return;
// Check exists: if (!user) redirect("/join");
\`\`\`

**Creating/updating sessions:**
\`\`\`typescript
const today = new Date().toISOString().split("T")[0];
const session = useQuery(api.sessions.getSession,
  team?._id ? { teamId: team._id, date: today } : "skip"
);
\`\`\`

**Dynamic routes with team code:**
\`\`\`typescript
const params = useParams();
const teamCode = params?.code as string;
const team = useQuery(api.teams.getTeamByCode,
  teamCode ? { code: teamCode.toUpperCase() } : "skip"
);
\`\`\`
