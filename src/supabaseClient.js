import { createClient } from '@supabase/supabase-js'

// Temporarily hardcode to test
const supabaseUrl = 'https://zozkkwxynqmtpvisdfyl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvemtrd3h5bnFtdHB2aXNkZnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzU3OTQsImV4cCI6MjA3MDAxMTc5NH0.5PhqG2yp4_BkkoO7pYCfC4PvZ2uHhQIBcA1uDW3Wre0'

console.log('Using URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)