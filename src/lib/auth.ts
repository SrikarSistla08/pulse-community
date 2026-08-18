export type Role = "student" | "business" | "organization" | "admin"

export const ROLES: Role[] = ["student", "business", "organization", "admin"]

export const ROLE_HOME: Record<Role, string> = {
  student: "/feed",
  business: "/business/dashboard",
  organization: "/organization/dashboard",
  admin: "/admin/dashboard",
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value)
}

export function homeForRole(role: Role | null | undefined): string {
  if (role && isRole(role)) return ROLE_HOME[role]
  return ROLE_HOME.student
}
