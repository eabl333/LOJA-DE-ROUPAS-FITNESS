const SUPABASE_URL = "https://rvbpppmcliehinmdzovd.supabase.co";
const SUPABASE_KEY = "sb_publishable_UQqWFVNe7lAhrUIX3kwk4g_xMSpqexz";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase conectado:", supabaseClient);
