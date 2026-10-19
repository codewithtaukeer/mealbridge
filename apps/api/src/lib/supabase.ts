import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const DEFAULT_SUPABASE_URL = 'https://udcijvuccyjptptttvai.supabase.co';
const DEFAULT_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkY2lqdnVjY3lqcHRwdHR0dmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMDg1NjMsImV4cCI6MjEwNzg4NDU2M30.-61pio1jTvaHO58CQUB3usbSwA3KTHfNYWvZS56VXz4';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_ANON_KEY || DEFAULT_KEY;

// Admin / Server client for operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: WebSocket as any,
  },
});
