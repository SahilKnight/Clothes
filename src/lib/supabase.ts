import { createClient } from '@supabase/supabase-js';

// Uses the secret key since new Supabase projects only provide sb_publishable/sb_secret keys
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SECRET_KEY
);

export default supabase;
