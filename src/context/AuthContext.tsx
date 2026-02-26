import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Mock Token Types
interface User {
  username: string;
  role: "ADMIN" | "STAFF" | "KIOSK";
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (pin: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Configure axios for cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = ""; // Set your API base URL if needed

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage only for USER info (not token)
    // The token is now in a secure HttpOnly cookie
    const storedUser = localStorage.getItem("adaqueue_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Add Axios interceptor for refresh token
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshStored = localStorage.getItem("adaqueue_refresh");
          if (refreshStored) {
            try {
              const res = await axios.post("/api/auth/refresh", {
                refreshToken: refreshStored,
              });
              if (res.data.rtCode === "1") {
                return axios(originalRequest);
              }
            } catch (err) {
              logout();
            }
          }
        }
        return Promise.reject(error);
      },
    );

    setIsLoading(false);
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (pin: string): Promise<User | null> => {
    try {
      const response = await axios.post("/api/auth/login", { pin });
      const data = response.data;

      if (data.rtCode === "1" && data.roResult) {
        const { user: apiUser, refreshToken } = data.roResult;

        const loggedInUser: User = {
          username: apiUser.username,
          role: apiUser.role as "ADMIN" | "STAFF" | "KIOSK",
          name: apiUser.name,
        };

        localStorage.setItem("adaqueue_user", JSON.stringify(loggedInUser));
        localStorage.setItem("adaqueue_refresh", refreshToken);
        setUser(loggedInUser);
        return loggedInUser;
      }
      return null;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("adaqueue_user");
    localStorage.removeItem("adaqueue_refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
