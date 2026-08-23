import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = { restoring: boolean; session: Session | null; restore: (session: Session | null) => void };
export const useAuthStore = create<AuthState>((set) => ({ restoring: true, session: null, restore: (session) => { set({ restoring: false, session }); } }));
 
