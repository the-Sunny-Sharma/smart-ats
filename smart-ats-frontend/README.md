# SmartATS Frontend

Next.js 14 frontend for the Smart ATS system.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and set your API URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=SmartATS
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Analytics overview |
| `/jobs` | Job listings |
| `/jobs/new` | Post new job |
| `/jobs/[id]` | Edit job |
| `/candidates` | Candidate pool |
| `/candidates/[id]` | Candidate profile |
| `/applications` | Application pipeline (list + kanban) |
| `/interviews` | Interview schedule |
| `/analytics` | Detailed analytics |

## Tech Stack

- **Next.js 14** (App Router)
- **TanStack Query** - server state
- **Zustand** - auth state
- **Tailwind CSS** - styling
- **Recharts** - charts
- **React Hot Toast** - notifications
- **Lucide React** - icons
- **Axios** - HTTP client
