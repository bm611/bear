import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
export const useAuthStore = create(() => ({
    status: 'loading',
    session: null,
}));
supabase.auth.getSession().then(({ data }) => {
    useAuthStore.setState({
        session: data.session,
        status: data.session ? 'signedIn' : 'signedOut',
    });
});
supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session, status: session ? 'signedIn' : 'signedOut' });
});
