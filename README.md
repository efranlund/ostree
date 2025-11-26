# Opportunity Solution Tree (OST) Collaboration Tool

A real-time collaborative tool for building and managing Opportunity Solution Trees based on Teresa Torres' framework. Built for the EliteProspects product management team.

## Features

### Core Functionality
- ✅ **Interactive Tree Visualization** - React Flow-based visual editor with custom node types
- ✅ **Real-time Collaboration** - Live updates across multiple users using Supabase real-time
- ✅ **Inline Editing** - Double-click any node to edit title and description with auto-save
- ✅ **Node Management** - Create, edit, delete, and reposition nodes with drag-and-drop
- ✅ **Voting & Priority** - Team voting on opportunities and solutions (1-5 scale)
- ✅ **Activity Feed** - Track all changes and activities in the tree
- ✅ **Presence Indicators** - See who's currently viewing/editing the tree
- ✅ **Export & Share** - Export as JSON, toggle public sharing, copy shareable links
- ✅ **Templates** - Start with blank or pre-configured templates

### Node Types
- **Outcome** - Business goals and desired outcomes (blue)
- **Opportunity** - Customer problems and needs (orange)
- **Solution** - Solution ideas and approaches (green)
- **Experiment** - Tests to validate solutions (purple/gray)

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **UI**: Tailwind CSS, React Flow, Lucide Icons
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **State Management**: Zustand
- **Deployment**: Ready for Vercel deployment

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase project created
- Git (optional)

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can get these values from your Supabase project settings.

### 2. Database Setup

The database schema has already been created via migrations. To verify:

1. Go to your Supabase project dashboard
2. Navigate to Database → Migrations
3. You should see the following migrations:
   - `create_core_tables` - Creates all tables
   - `enable_rls_and_realtime` - Sets up RLS policies
   - `enable_realtime_publication` - Enables real-time subscriptions

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Authentication Setup

This app uses **passwordless authentication** via magic links:

1. Navigate to `/login` or `/signup`
2. Enter your email address
3. Click "Send Magic Link"
4. Check your email for the authentication link
5. Click the link to sign in automatically

**For local development:**
- If using Supabase local development, check the [Supabase Inbucket](http://localhost:54324) for magic link emails
- If using Supabase cloud, configure your email provider in the Supabase dashboard
- Magic links expire after a set time (default: 1 hour)

**Note:** Password authentication has been disabled in favor of more secure magic link authentication.

## Project Structure

```
/Users/ericfranlund/Dev/ostree/
├── app/
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   └── trees/          # Tree listing and editor
│   ├── layout.tsx          # Root layout with auth provider
│   └── globals.css         # Global styles + React Flow CSS
├── components/
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Dashboard navigation
│   ├── tree/               # Tree editor components
│   │   ├── nodes/          # Custom React Flow nodes
│   │   ├── TreeEditor.tsx  # Main editor component
│   │   ├── ActivityFeed.tsx
│   │   ├── PresenceIndicator.tsx
│   │   └── VotingWidget.tsx
│   └── trees/              # Tree list and creation
├── lib/
│   ├── supabase/           # Supabase client setup
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── middleware.ts           # Auth middleware
└── README.md              # This file
```

## Database Schema

The database includes the following main tables:

- `trees` - Root container for OSTs
- `outcomes` - Business outcomes (1 per tree typically)
- `opportunities` - Customer problems (many per outcome)
- `solutions` - Solution ideas (many per opportunity)
- `experiments` - Experiments/tests (many per solution)
- `tree_members` - Access control
- `votes` - Voting data
- `activity_log` - Change history
- `user_profiles` - Extended user information
- `comments` - Discussion threads (polymorphic)
- `evidence` - Research/evidence attachments (polymorphic)

All tables have:
- Row Level Security (RLS) enabled
- Real-time subscriptions enabled
- Automatic `updated_at` triggers

## Usage Guide

### Creating a Tree
1. Click "New Tree" on the dashboard
2. Choose a template or start blank
3. Enter a name and optional description
4. A default outcome will be created automatically

### Editing Nodes
- **Edit Title**: Double-click the node title
- **Edit Description**: Double-click the description (or click "+ Add description")
- **Move Node**: Drag the node to reposition
- **Add Child**: Click the "+" button on any node

### Collaboration
- **Real-time Updates**: Changes from other users appear automatically
- **Activity Feed**: Click the activity button (bottom right) to see recent changes
- **Presence**: See avatars of users currently viewing the tree (top right)

### Voting
- Click the numbered buttons (1-5) on opportunities or solutions to vote
- Vote counts are displayed in real-time
- Click the same number again to remove your vote

### Sharing
- Owners/editors can toggle public sharing in the "Export & Share" menu
- Public trees are viewable by anyone with the link (no account required)
- Export tree as JSON for backup or migration

## Development Notes

### Real-time Subscriptions
The app uses Supabase real-time subscriptions to sync changes across users. The subscriptions automatically refresh the tree data when any node is created, updated, or deleted.

### Auto-save
Node edits are auto-saved after 500ms of inactivity (debounced). Position changes are saved immediately when dragging stops.

### Access Control
- **Owner**: Full control, can delete tree, manage members
- **Editor**: Can create/edit/delete nodes, but cannot manage tree settings
- **Viewer**: Read-only access

## Future Enhancements (Not Implemented)

The following features were planned but skipped per requirements:
- Evidence attachment system
- Detailed experiment tracking
- Alternative views (timeline, dashboard)

These can be added in future iterations if needed.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables Needed:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

Private - For EliteProspects internal use only.

## Support

For issues or questions, contact the development team.
