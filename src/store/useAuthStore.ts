import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

interface AuthState {
  status: AuthStatus
  session: Session | null
}

export const useAuthStore = create<AuthState>(() => ({
  status: 'loading',
  session: null,
}))

supabase.auth.getSession().then(({ data }) => {
  useAuthStore.setState({
    session: data.session,
    status: data.session ? 'signedIn' : 'signedOut',
  })
})

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ session, status: session ? 'signedIn' : 'signedOut' })
})
