import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://idlmmalosmqriglmsyqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbG1tYWxvc21xcmlnbG1zeXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzMzNTYsImV4cCI6MjA2MzcwOTM1Nn0.H8rCn94riWMwHHKfevv-AAE5AopdtnAR3AvmCW0Hd9E';

export const supabase = createClient(supabaseUrl, supabaseKey);
