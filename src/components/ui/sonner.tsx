import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "var(--font-sans)",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
        },
      }}
    />
  );
}
