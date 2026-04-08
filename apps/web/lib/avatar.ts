import { createHash } from "crypto"

const DICEBEAR_API = "https://api.dicebear.com/9.x/identicon/svg"

export function getAvatarUrl(email: string | undefined | null): string {
  const seed = email
    ? createHash("sha256").update(email).digest("hex")
    : "default"
  return `${DICEBEAR_API}?seed=${seed}`
}
