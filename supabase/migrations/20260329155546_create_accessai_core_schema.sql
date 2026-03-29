/*
  # AccessAI Core Database Schema

  ## Overview
  Complete database schema for AccessAI mobile backend supporting real-time environment scanning,
  AI interactions, personalized accessibility assistance, and user session management.

  ## Tables Created

  ### 1. user_profiles
  Stores user accessibility preferences and settings
  - `id` (uuid, primary key) - Links to auth.users
  - `display_name` (text) - User's preferred name
  - `accessibility_needs` (jsonb) - Array of accessibility requirements (visual, hearing, mobility, cognitive, employment)
  - `preferred_voice` (text) - TTS voice preference (alloy, echo, fable, onyx, nova, shimmer)
  - `reading_level` (text) - Cognitive assistance level (eli5, simple, teen, adult)
  - `interaction_mode` (text) - Preferred interaction (voice, text, both)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. scan_sessions
  Tracks individual environment scanning sessions
  - `id` (uuid, primary key) - Unique session identifier
  - `user_id` (uuid, foreign key) - References user_profiles
  - `session_type` (text) - Type of scan (environment, document, object, navigation)
  - `location_context` (jsonb) - GPS coordinates, place name, context
  - `started_at` (timestamptz) - Session start time
  - `ended_at` (timestamptz) - Session end time (null if active)
  - `total_interactions` (integer) - Count of AI interactions in session
  - `metadata` (jsonb) - Additional session data

  ### 3. environment_scans
  Stores individual environment scan results
  - `id` (uuid, primary key) - Unique scan identifier
  - `session_id` (uuid, foreign key) - References scan_sessions
  - `user_id` (uuid, foreign key) - References user_profiles
  - `scan_type` (text) - Type (photo, live_stream, document, sign, face)
  - `image_data` (text) - Base64 image data (stored temporarily)
  - `ai_description` (text) - AI-generated scene description
  - `detected_objects` (jsonb) - Array of detected objects with positions
  - `detected_text` (jsonb) - OCR results and text extraction
  - `accessibility_alerts` (jsonb) - Important accessibility information (hazards, navigation)
  - `created_at` (timestamptz) - Scan timestamp

  ### 4. ai_conversations
  Tracks conversational AI interactions
  - `id` (uuid, primary key) - Unique conversation identifier
  - `session_id` (uuid, foreign key) - References scan_sessions
  - `user_id` (uuid, foreign key) - References user_profiles
  - `user_message` (text) - User's query or command
  - `ai_response` (text) - AI assistant response
  - `context_type` (text) - Context (environment_query, navigation, assistance, general)
  - `response_time_ms` (integer) - AI response latency
  - `created_at` (timestamptz) - Conversation timestamp

  ### 5. learned_environments
  Stores frequently visited places for contextual assistance
  - `id` (uuid, primary key) - Unique environment identifier
  - `user_id` (uuid, foreign key) - References user_profiles
  - `place_name` (text) - User-defined or AI-suggested name
  - `location` (jsonb) - GPS coordinates
  - `common_objects` (jsonb) - Frequently detected objects
  - `navigation_notes` (text) - User notes or AI observations
  - `visit_count` (integer) - Number of times scanned
  - `last_visited` (timestamptz) - Last scan timestamp
  - `created_at` (timestamptz) - First scan timestamp

  ## Security
  All tables have Row Level Security (RLS) enabled with policies ensuring:
  - Users can only access their own data
  - Authenticated users required for all operations
  - Data isolation per user account

  ## Indexes
  Optimized indexes for:
  - User lookups by session
  - Session history queries
  - Conversation history retrieval
  - Location-based environment matching
*/

-- ─── USER PROFILES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  accessibility_needs jsonb DEFAULT '[]'::jsonb,
  preferred_voice text DEFAULT 'nova',
  reading_level text DEFAULT 'simple',
  interaction_mode text DEFAULT 'both',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ─── SCAN SESSIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_type text NOT NULL,
  location_context jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  total_interactions integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_started_at ON scan_sessions(started_at DESC);

ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON scan_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON scan_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON scan_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── ENVIRONMENT SCANS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS environment_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES scan_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  scan_type text NOT NULL,
  image_data text,
  ai_description text NOT NULL,
  detected_objects jsonb DEFAULT '[]'::jsonb,
  detected_text jsonb DEFAULT '[]'::jsonb,
  accessibility_alerts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_environment_scans_session_id ON environment_scans(session_id);
CREATE INDEX IF NOT EXISTS idx_environment_scans_user_id ON environment_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_environment_scans_created_at ON environment_scans(created_at DESC);

ALTER TABLE environment_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scans"
  ON environment_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans"
  ON environment_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─── AI CONVERSATIONS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES scan_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  context_type text NOT NULL,
  response_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─── LEARNED ENVIRONMENTS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learned_environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  place_name text NOT NULL,
  location jsonb DEFAULT '{}'::jsonb,
  common_objects jsonb DEFAULT '[]'::jsonb,
  navigation_notes text DEFAULT '',
  visit_count integer DEFAULT 1,
  last_visited timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learned_environments_user_id ON learned_environments(user_id);
CREATE INDEX IF NOT EXISTS idx_learned_environments_last_visited ON learned_environments(last_visited DESC);

ALTER TABLE learned_environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learned environments"
  ON learned_environments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learned environments"
  ON learned_environments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learned environments"
  ON learned_environments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);