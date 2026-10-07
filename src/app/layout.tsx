import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "@/store/StoreProvider";

export const metadata: Metadata = {
  title: "GitHub Developer Intelligence",
  description: "Analyze GitHub profiles: skills, activity, scores, recommendations and comparisons.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
