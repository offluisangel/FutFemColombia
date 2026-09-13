import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Liga Femenina de Colombia",
    short_name: "LigaF",
    description: "Calendario, resultados, tabla de posiciones y goleadoras de la Liga Femenina Colombiana de Fútbol.",
    start_url: "/",
    display: "standalone",
    background_color: "#240320",
    theme_color: "#3a0835",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
