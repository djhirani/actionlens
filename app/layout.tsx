import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const description = "Human-confirmed actions from everyday instructions";

export const metadata: Metadata = {
  metadataBase: new URL("https://actionlens-five.vercel.app"),
  title: "ActionLens",
  description,
  icons: {
    icon: [
      { url: "/brand/actionlens/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/brand/actionlens/icon.svg", type: "image/svg+xml", sizes: "256x256" }
    ],
    shortcut: "/brand/actionlens/favicon.svg",
    apple: [{ url: "/brand/actionlens/icon.svg", sizes: "256x256", type: "image/svg+xml" }]
  },
  openGraph: {
    title: "ActionLens",
    description,
    type: "website",
    images: [
      {
        url: "/brand/actionlens/logo-horizontal.svg",
        width: 420,
        height: 112,
        alt: "ActionLens"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ActionLens",
    description,
    images: ["/brand/actionlens/logo-horizontal.svg"]
  }
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
              <Image
                className="brand-logo"
                src="/brand/actionlens/logo-dark.svg"
                alt="ActionLens"
                width={420}
                height={112}
                priority
              />
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
