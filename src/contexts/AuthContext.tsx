import { createContext, useContext, useEffect, useState } from "react";
import { localDb, LocalUser } from "../lib/localDb";

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  neuralPassword: string | null;
  setNeuralPassword: (pwd: string | null) => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [neuralPassword, setNeuralPassword] = useState<string | null>(null);

  useEffect(() => {
    // Initialize session synchronously from localStorage on mount
    const sessionUser = localDb.getSessionUser();
    setUser(sessionUser);
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    const sessionUser = await localDb.signUp(email, password);
    setUser(sessionUser);
  };

  const signIn = async (email: string, password: string) => {
    const sessionUser = await localDb.signIn(email, password);
    setUser(sessionUser);
  };

  const signOut = async () => {
    await localDb.signOut();
    setUser(null);
    setNeuralPassword(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        neuralPassword,
        setNeuralPassword,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
