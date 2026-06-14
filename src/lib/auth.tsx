import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, setAuthTokenGetter, getMeQueryKey, type User } from "@/api";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setAuthTokenGetter(() => null);

    supabase.auth.getSession().then(() => setSessionReady(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: getMeQueryKey() });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: sessionReady,
      retry: false,
    },
  });

  const login = (_token: string) => {
    queryClient.invalidateQueries({ queryKey: getMeQueryKey() });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: getMeQueryKey() });
  };

  useEffect(() => {
    if (error) {
      supabase.auth.signOut();
    }
  }, [error]);

  const isLoading = !sessionReady || isUserLoading;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
