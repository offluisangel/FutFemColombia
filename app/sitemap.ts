import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/constants"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data } = await supabase.from("teams").select("slug")

  const teamPages = (data ?? []).map((t) => ({
    url: `${SITE_URL}/equipos/${t.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/cuadrangulares`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...teamPages,
  ]
}
