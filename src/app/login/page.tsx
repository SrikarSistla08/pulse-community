import type { Metadata } from "next"
import LoginForm from "./login-form"

export const metadata: Metadata = { title: "Login — Pulse" }

export default function LoginPage() {
  return <LoginForm />
}
