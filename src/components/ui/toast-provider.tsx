"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "rgb(var(--color-surface))",
          color: "rgb(var(--color-text-strong))",
          border: "1px solid rgb(var(--color-line))",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-floating)",
          fontSize: "14px",
          padding: "12px 16px"
        },
        success: {
          iconTheme: { primary: "rgb(var(--color-success))", secondary: "#fff" }
        },
        error: {
          iconTheme: { primary: "rgb(var(--color-danger))", secondary: "#fff" }
        }
      }}
    />
  );
}
