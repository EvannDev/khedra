import { createHash } from "crypto"

export function getAvatarUrl(email: string | undefined | null): string {
  const seed = email
    ? createHash("sha256").update(email).digest("hex")
    : "default"
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`
}
