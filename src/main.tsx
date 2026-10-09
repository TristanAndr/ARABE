import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/amiri-quran/400.css'
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/newsreader/opsz.css'
import './styles/global.css'
import { ConfigMissing } from './components/ConfigMissing'
import { appUrl, getInitialRedirect, getSupabase } from './lib/supabase'
import { Root } from './Root'
import { createSupabaseStore } from './sync/supabaseStore'

function boot(): ReactNode {
  let client
  try {
    client = getSupabase()
  } catch (e) {
    return <ConfigMissing detail={(e as Error).message} />
  }
  if (!client) return <ConfigMissing />
  const supabase = client
  return (
    <Root
      authClient={supabase.auth}
      createRemote={(user) => createSupabaseStore(supabase, user.id)}
      redirect={getInitialRedirect()}
      redirectTo={appUrl}
    />
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode>{boot()}</StrictMode>)
