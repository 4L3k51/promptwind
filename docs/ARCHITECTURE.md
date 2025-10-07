# LLM Prompt Tracker - Architecture Document

## Overview
A Next.js 14 application for tracking LLM prompts, tokens, costs, and analytics with Supabase as the backend.

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4.18
- **UI Components:** shadcn/ui (New York style, Slate theme)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Date Handling:** date-fns

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage (if needed)

## Project Structure

```
llm-prompt-tracker-2025/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles with Tailwind
├── components/                   # React components
│   └── ui/                      # shadcn/ui components
├── lib/                         # Utilities and helpers
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client
│   └── utils.ts                # Utility functions (cn, etc.)
├── types/                       # TypeScript type definitions
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── PROGRESS.md             # Development progress
│   └── CURSOR_INSTRUCTIONS.md  # Agent instruction log
├── .env.local                   # Environment variables (not in git)
├── components.json              # shadcn/ui configuration
├── tailwind.config.ts           # Tailwind configuration
└── package.json                 # Dependencies
```

## Database Schema

### Tables

#### 1. users
Extends Supabase auth.users
```sql
- id (uuid, primary key, references auth.users)
- email (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. prompts
Main table for storing prompt interactions
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- model (text) - e.g., "gpt-4", "claude-3-opus"
- prompt_text (text) - the actual prompt
- response_text (text) - the LLM response
- prompt_tokens (integer)
- completion_tokens (integer)
- total_tokens (integer)
- cost (decimal) - calculated cost
- tags (text[]) - array of tags
- metadata (jsonb) - flexible additional data
- created_at (timestamp)
```

#### 3. models
Reference table for LLM models and pricing
```sql
- id (uuid, primary key)
- name (text) - model identifier
- provider (text) - "openai", "anthropic", etc.
- input_price_per_1k (decimal) - price per 1k input tokens
- output_price_per_1k (decimal) - price per 1k output tokens
- active (boolean)
- created_at (timestamp)
```

#### 4. tags
User-defined tags for organizing prompts
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- name (text)
- color (text) - hex color for UI
- created_at (timestamp)
```

## Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Session stored in HTTP-only cookies
3. Server Components use `lib/supabase/server.ts`
4. Client Components use `lib/supabase/client.ts`
5. Row Level Security (RLS) enforces data isolation

## Key Features

### 1. Prompt Logging
- Manual entry form
- Batch import (CSV/JSON)
- API integration for automatic logging

### 2. Analytics Dashboard
- Total tokens used (by date range)
- Total cost (by date range)
- Cost breakdown by model
- Most used models
- Token usage trends over time

### 3. Prompt Library
- Search and filter prompts
- Tag organization
- Copy to clipboard
- Edit/delete prompts

### 4. Model Management
- Add/edit model pricing
- Enable/disable models
- View model statistics

## Security

### Row Level Security (RLS)
All tables have RLS policies:
```sql
-- Example for prompts table
CREATE POLICY "Users can view their own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- Never expose service_role key to frontend

## Data Flow

### Adding a Prompt
```
User Input -> Form Validation -> Client Component
  -> Supabase Client -> Database (with RLS)
  -> Real-time Update -> UI Refresh
```

### Viewing Analytics
```
Server Component -> Supabase Server Client
  -> Database Query (aggregations) -> Server Component
  -> Hydration -> Client Interactivity (charts)
```

## API Routes (Future)

```
POST /api/prompts        - Create new prompt
GET  /api/prompts        - List prompts (paginated)
GET  /api/prompts/:id    - Get single prompt
PUT  /api/prompts/:id    - Update prompt
DELETE /api/prompts/:id  - Delete prompt
GET  /api/analytics      - Get analytics data
```

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push to main

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Performance Considerations

- Use React Server Components for data fetching when possible
- Implement pagination for large prompt lists
- Cache analytics queries (consider Redis in future)
- Optimize images with next/image
- Use dynamic imports for heavy components

## Future Enhancements

1. **AI-Powered Features**
   - Prompt suggestion/improvement
   - Automatic tagging
   - Similar prompt search

2. **Team Features**
   - Shared prompt libraries
   - Team analytics
   - Role-based access

3. **Advanced Analytics**
   - Cost predictions
   - Usage anomaly detection
   - A/B testing prompts

4. **Integrations**
   - OpenAI API direct logging
   - LangChain integration
   - Slack/Discord notifications

## Development Workflow

1. Create feature branch
2. Develop locally with `npm run dev`
3. Test thoroughly
4. Update PROGRESS.md
5. Commit with descriptive message
6. Create PR
7. Review and merge
8. Deploy to production

## Testing Strategy

- **Unit Tests:** Utilities and helpers
- **Integration Tests:** API routes
- **E2E Tests:** Critical user flows (Playwright)
- **Manual Testing:** UI/UX validation

## Monitoring & Logging

- Vercel Analytics for performance
- Supabase logs for database queries
- Error tracking (consider Sentry)
- Custom analytics events

---

**Document Version:** 1.0  
**Last Updated:** October 7, 2025  
**Author:** Development Team

