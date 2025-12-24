"use client";

import { HeroUIProvider } from "@heroui/react";

import Navbar from "./navbar/Navbar";

import { Provider } from "react-redux";
import { store } from "@/redux/store";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "react-hot-toast";
import { useState } from "react";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { setAuthStatus, setUser } from "@/redux/authSlice";
import { useEffect } from "react";
import axios from "axios";

const AuthChecker = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/auth/me", { withCredentials: true });
        if (res.data.success) {
          dispatch(setUser(res.data.user));
          dispatch(setAuthStatus(true));
        }
      } catch (error) {
        // Not authenticated
      }
    };
    checkAuth();
  }, [dispatch]);

  return null;
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AuthChecker />
        <HeroUIProvider>
          <Navbar />
          <Toaster />
          {children}
        </HeroUIProvider>
      </Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
