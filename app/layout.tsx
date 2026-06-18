import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantacalcetto",
  description: "MVP Fantacalcetto per leghe private da 5 giocatori."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
