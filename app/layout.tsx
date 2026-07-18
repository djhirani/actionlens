import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ActionLens",
  description: "Human-confirmed actions from everyday instructions"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <div className="shell">
          <header className="nav">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                A
              </span>
              <span>ActionLens</span>
            </Link>
            <nav className="navlinks" aria-label="Primary navigation">
              <Link href="/">Home</Link>
              <Link href="/inbox">Action Inbox</Link>
            </nav>
          </header>
          <div id="main-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
