"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(m);
    timer.current = setTimeout(() => setMsg(""), 3200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {msg ? (
        <div
          data-testid="toast"
          style={{
            position: "fixed",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1E2A3A",
            color: "#F2E6BC",
            padding: "11px 20px",
            borderRadius: 10,
            fontSize: 13.5,
            boxShadow: "0 8px 30px rgba(28,23,18,0.3)",
            zIndex: 60,
          }}
        >
          {msg}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
