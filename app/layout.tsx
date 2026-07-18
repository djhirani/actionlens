import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ActionLens",
  description: "Human-confirmed actions from everyday instructions"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <div className="shell">
          <header className="nav">
            <Link className="brand" href="/">
              ActionLens
            </Link>
            <nav className="navlinks" aria-label="Primary navigation">
              <Link href="/">Home</Link>
              <Link href="/inbox">Action Inbox</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
