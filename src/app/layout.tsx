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
          <footer className="border-t border-[var(--hr)] py-8 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
              <div>
                <span className="font-bold text-[var(--fg)] tracking-wider">PULSE</span>
                <span className="mx-1.5 text-[var(--dim)]">·</span>
                <span>heartbeat of your community</span>
              </div>
              <div className="text-[var(--dim)]">
                &copy; {new Date().getFullYear()} Pulse
              </div>
            </div>
          </footer>
          <ServiceWorker />
          <PushNotifications />
        </ToastProvider>
      </body>
    </html>
  )
}
