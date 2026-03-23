import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dglcbpnyorczbmgpsnlx.supabase.co'
const supabaseAnonKey = 'sb_publishable_y_-ZZueg1dHBV8Qtor2ciw_AwuHXcEq'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
