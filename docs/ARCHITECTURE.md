LLM Prompt Tracking Tool - Complete Architecture Document
Project Overview
Name: LLM Prompt Tracker (or your chosen name)
Purpose: Track and analyze how different large language models respond to specific prompts over time, with statistically rigorous measurement and uncertainty quantification.
Key Principle: Maximize Supabase usage - no separate backend. Everything runs on Supabase + Next.js frontend.
Repository: Public monorepo (may become partially closed later)
Monetization: Users provide their own LLM API keys (OpenAI, Anthropic, etc.)

Architecture Overview
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                 │
│  - User interface for configuration & analytics    │
│  - Direct Supabase client integration              │
│  - Real-time updates via Supabase subscriptions   │
│  - Deployed on Vercel                              │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ (All communication via Supabase)
                       │
┌──────────────────────▼──────────────────────────────┐
│                    SUPABASE                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PostgreSQL Database                                │
│  ├── Tables (intents, queries, responses, etc.)   │
│  ├── Row-Level Security (RLS) policies            │
│  ├── Database functions (statistics, extraction)   │
│  └── pg_cron for scheduled jobs                    │
│                                                     │
│  Supabase Auth                                      │
│  └── Email/password authentication                 │
│                                                     │
│  Supabase Vault                                     │
│  └── Encrypted storage for user API keys          │
│                                                     │
│  Edge Functions (Deno/TypeScript)                  │
│  ├── run_llm_query                                 │
│  ├── process_response                              │
│  ├── extract_citations                             │
│  ├── calculate_statistics                          │
│  └── run_scheduled_queries                         │
│                                                     │
│  Real-time                                          │
│  └── WebSocket subscriptions for live updates     │
│                                                     │
└─────────────────────────────────────────────────────┘
                       │
                       │ (Edge Functions call)
                       │
┌──────────────────────▼──────────────────────────────┐
│              External LLM APIs                      │
│  ├── OpenAI (GPT-4, GPT-4 Turbo, etc.)            │
│  ├── Anthropic (Claude 3.5 Sonnet, etc.)          │
│  ├── Google (Gemini Pro, etc.)                     │
│  └── Others (Cohere, etc.)                         │
└─────────────────────────────────────────────────────┘

Tech Stack
Frontend

Framework: Next.js 14 (App Router)
Language: TypeScript
UI Components: shadcn/ui (Radix UI + Tailwind CSS)
Charts: Recharts
Supabase Integration: @supabase/supabase-js
Deployment: Vercel

Backend (Supabase)

Database: PostgreSQL (via Supabase)
Edge Functions: Deno/TypeScript
Scheduling: pg_cron (built into Supabase)
Authentication: Supabase Auth
Secrets Management: Supabase Vault
Real-time: Supabase Realtime

Development Tools

Version Control: Git (public monorepo)
Package Manager: npm or pnpm
Linting: ESLint
Formatting: Prettier
Type Checking: TypeScript strict mode


Core Features
1. Data Collection (Per Query)
Query Configuration:

Prompt text
Intent label (business question this represents)
Model name (e.g., "gpt-4", "claude-sonnet-3.5")
Model version (captured from API response)
Query parameters:

temperature
top_p
max_tokens
system_prompt (optional)



Response Capture:

Raw response text (full, unprocessed)
Response hash (SHA-256 for deduplication)
Response length (characters)
Query timestamp (ISO 8601 with milliseconds)
Response duration (milliseconds)
Success/failure status
Error details (if failed)

Brand Analysis:

Your brand mentioned (boolean)
Your brand position among all brands (1st, 2nd, 3rd...)
Your brand first mention position:

Character position in response
Percentage position (0-100%)
In introduction (first 20% of text)
In conclusion (last 20% of text)


Context snippet (50 chars around brand mention)

Competitive Analysis:

All brands mentioned (ordered list)
For each competitor:

Brand name
Position in mention order
Link included (boolean)



Link Tracking:

All URLs in response (ordered)
For each link:

Full URL
Domain (normalized)
Position in response
Belongs to your brand (boolean)



2. Configuration Settings
Per-Intent Configuration:

Daily sample size (1-50 queries/day)
Business priority (Low/Medium/High/Critical)
List of paraphrases (query variations)
Paraphrase rotation strategy (Sequential/Random)
Active/inactive status

Per-Model Configuration:

Model identifier (e.g., "gpt-4-turbo")
Temperature (0.0-2.0)
Top_p (0.0-1.0)
Max_tokens (100-4000)
Custom system prompt (optional)
Active/inactive status

Scheduling:

Total daily query budget
Time-of-day distribution (optional: morning/afternoon/evening)
Adaptive sampling (optional: allocate extra samples to high-variance intents)

Control Queries:

Positive control (should always cite you)
Negative control (should never cite you)
Automatic validation alerts

3. Analytics Features
Confidence Intervals:

Wilson score interval for all proportions
Displayed everywhere: "62% (95% CI: 47%-76%, n=15)"
Confidence level badges:

🟢 High confidence (CI width <10%, n≥30)
🟡 Medium confidence (CI width 10-20%, n=10-29)
🔴 Low confidence (CI width >20%, n<10)
⚪ Insufficient data (n<3)



Sample Size Planning:

Built-in calculator
Input: current citation rate, desired precision
Output: required daily samples, days to confidence

Statistical Testing:

Two-proportion z-test for changes
Benjamini-Hochberg multiple testing correction (FDR=0.05)
Never show "significant" without proper correction

Trend Analysis:

Time series charts with confidence bands
Sample size displayed per data point
Change-point detection
Annotation support

Bayesian Estimation (Optional):

Beta-Binomial model with Beta(10,10) prior
Regularizes small-sample estimates
Toggle on/off in UI

Data Export:

CSV format
JSON format
Includes all raw data, confidence intervals, metadata

System Health Dashboard:

Control query status
Extraction validation metrics
Query success rate
API rate limits status


Database Schema
Tables
sql-- Users (managed by Supabase Auth)
-- auth.users table provided by Supabase

-- User API Keys (encrypted in Vault)
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
  key_name TEXT, -- user-friendly label
  vault_secret_id TEXT NOT NULL, -- reference to vault.secrets
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, key_name)
);

-- Intents (what business question to track)
CREATE TABLE intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  label TEXT NOT NULL, -- "Database Selection - Indie Developers"
  description TEXT,
  business_priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  daily_sample_size INT DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paraphrases (variations of the same intent)
CREATE TABLE paraphrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID REFERENCES intents ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Models (LLM configurations)
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
  model_name TEXT NOT NULL, -- 'gpt-4-turbo', 'claude-3-5-sonnet-20241022'
  api_key_id UUID REFERENCES user_api_keys NOT NULL,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  top_p NUMERIC(3,2) DEFAULT 1.0,
  max_tokens INT DEFAULT 2000,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queries (individual LLM query executions)
CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  intent_id UUID REFERENCES intents NOT NULL,
  paraphrase_id UUID REFERENCES paraphrases NOT NULL,
  model_id UUID REFERENCES models NOT NULL,
  
  -- Request details
  prompt_text TEXT NOT NULL,
  temperature NUMERIC(3,2),
  top_p NUMERIC(3,2),
  max_tokens INT,
  
  -- Response details
  response_text TEXT,
  response_hash TEXT, -- SHA-256 hash
  response_length INT,
  model_version TEXT, -- captured from API response
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INT,
  
  -- Status
  success BOOLEAN DEFAULT true,
  error_type TEXT,
  error_message TEXT,
  
  -- Metadata
  scheduled BOOLEAN DEFAULT false, -- true if from cron, false if manual
  track_type TEXT DEFAULT 'stochastic' -- 'stochastic' or 'deterministic'
);

-- Brand mentions (your brand analysis)
CREATE TABLE brand_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries ON DELETE CASCADE NOT NULL,
  
  -- Basic detection
  mentioned BOOLEAN NOT NULL,
  
  -- Position among brands
  position_among_brands INT, -- 1st, 2nd, 3rd...
  
  -- Position in text
  first_mention_char INT, -- character position
  first_mention_percent NUMERIC(5,2), -- 0-100%
  in_introduction BOOLEAN, -- first 20%
  in_conclusion BOOLEAN, -- last 20%
  
  -- Context
  context_snippet TEXT, -- 50 chars around mention
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor mentions
CREATE TABLE competitor_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries ON DELETE CASCADE NOT NULL,
  
  brand_name TEXT NOT NULL,
  position INT NOT NULL, -- order mentioned
  has_link BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Links extracted from responses
CREATE TABLE response_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries ON DELETE CASCADE NOT NULL,
  
  url TEXT NOT NULL,
  domain TEXT NOT NULL, -- normalized (no www, etc.)
  position INT NOT NULL, -- order in response
  is_user_brand BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Control queries (validation)
CREATE TABLE control_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  type TEXT NOT NULL, -- 'positive' or 'negative'
  prompt TEXT NOT NULL,
  expected_citation_rate NUMERIC(3,2), -- 0.90 for positive, 0.05 for negative
  runs_per_day INT DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statistics cache (pre-calculated for performance)
CREATE TABLE intent_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  intent_id UUID REFERENCES intents NOT NULL,
  model_id UUID REFERENCES models NOT NULL,
  
  -- Time window
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Citation stats
  total_queries INT NOT NULL,
  citations_count INT NOT NULL,
  citation_rate NUMERIC(5,4), -- 0.6234
  
  -- Confidence interval (Wilson)
  ci_lower NUMERIC(5,4),
  ci_upper NUMERIC(5,4),
  ci_width NUMERIC(5,4),
  
  -- Confidence level
  confidence_level TEXT, -- 'high', 'medium', 'low', 'insufficient'
  
  -- Change detection
  change_detected BOOLEAN DEFAULT false,
  change_pvalue NUMERIC(10,8),
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(intent_id, model_id, period_start, period_end)
);

Project Structure
llm-prompt-tracker/
├── README.md
├── .gitignore
├── package.json
├── tsconfig.json
│
├── app/                          # Next.js application
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard
│   ├── intents/
│   │   ├── page.tsx              # List intents
│   │   ├── [id]/                # Intent details
│   │   └── new/                  # Create intent
│   ├── models/
│   │   ├── page.tsx              # Configure models
│   │   └── new/
│   ├── analytics/
│   │   ├── page.tsx              # Analytics dashboard
│   │   └── [intent_id]/          # Intent-specific analytics
│   └── settings/
│       ├── page.tsx              # User settings
│       └── api-keys/             # Manage API keys
├── components/
│   ├── ui/                       # shadcn components
│   ├── charts/
│   │   ├── TrendChart.tsx
│   │   └── ConfidenceInterval.tsx
│   ├── ConfidenceBadge.tsx
│   ├── SampleSizeCalculator.tsx
│   └── IntentForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   └── server.ts             # Server-side client
│   ├── statistics.ts             # Wilson interval, etc.
│   └── utils.ts
├── types/
│   └── database.ts               # Generated from Supabase
└── public/

Security Considerations

API Keys: Always encrypted in Vault, never exposed to frontend
RLS Policies: Enforce at database level, users can only access own data
Edge Functions: Use service role key, but respect RLS
Frontend: Uses anon key, RLS automatically enforced
Rate Limiting: Implement per-user query limits
Input Validation: Sanitize all user inputs


Development Workflow
Local Development

Start Supabase locally:

bashnpx supabase start

Run Next.js dev server:

bashnpm run dev

Deploy Edge Functions locally:

bashnpx supabase functions serve
Database Changes

Create migration:

bashnpx supabase migration new migration_name

Apply migration:

bashnpx supabase db push

Generate TypeScript types:

bashnpx supabase gen types typescript --local > types/database.ts

Document Version: 2.0
Last Updated: October 7, 2025
Application Type: AEO (Answer Engine Optimization) Tracking Tool