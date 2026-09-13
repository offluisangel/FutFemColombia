// Public site URL used across server and client code.
// Prefer the environment variable `NEXT_PUBLIC_SITE_URL` for deploy-time configuration.
// Fallback to the hardcoded default to preserve existing behavior in local/dev.
export const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://www.futfemcolombia.site"
