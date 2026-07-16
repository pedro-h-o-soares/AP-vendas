import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { sampleUsers } from "../data/sampleData";
import type { Role, UserProfile } from "../domain/types";

export interface AuthContextValue {
  user: UserProfile | null;
  signIn: (role: Role) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const signIn = (role: Role) => {
    const demoUser = sampleUsers.find(
      (candidate) => candidate.role === role && candidate.active,
    );
    if (!demoUser) throw new Error(`Demo user not found for role: ${role}`);
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

// The provider and hook intentionally share this small authentication module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}
