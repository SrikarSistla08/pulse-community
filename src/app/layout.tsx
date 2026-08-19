import type { Metadata, Viewport } from "next"
import "./globals.css"
import Navbar from "@/components/navbar"
import { ToastProvider } from "@/components/toast"
import ServiceWorker from "@/components/service-worker"
import PushNotifications from "@/components/push-notifications"

export const metadata: Metadata = {
  title: "Pulse",
  description: "Heartbeat of your community",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pulse",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#ad5b3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="mt-auto">
            <div className="border-t border-[var(--hr)] py-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1">
                  <h2 className="font-serif text-2xl font-bold tracking-wider mb-2">PULSE</h2>
                  <p className="text-sm text-[var(--dim)] mb-4">Heartbeat of your community</p>
                  <a href="https://the-valley-inc.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--dim)] hover:text-[var(--fg)] transition-colors">
                    TheValleyInc
                  </a>
                </div>

                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest mb-4 newspaper-label">Product</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Feed</a></li>
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Map</a></li>
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Events</a></li>
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Businesses</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest mb-4 newspaper-label">Company</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Blog</a></li>
                    <li><a href="https://the-valley-inc.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--fg)] transition-colors">TheValleyInc</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest mb-4 newspaper-label">Resources</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Dashboard</a></li>
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Check-In</a></li>
                    <li><a href="#" className="hover:text-[var(--fg)] transition-colors">Create Post</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--hr)] py-4">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--dim)]">
                <div className="flex items-center gap-2">
                  <PushNotifications />
                  <span>&copy; {new Date().getFullYear()} PULSE. All rights reserved.</span>
                </div>
                <div>
                  EDITION: VOL 1.0 | PRINTED IN ARBUTUS
                </div>
              </div>
            </div>
          </footer>
          <ServiceWorker />
        </ToastProvider>
      </body>
    </html>
  )
}
