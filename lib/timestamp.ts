export function parseDateTime(ms: string): { fecha: string; hora: string } {
  const ts = parseInt(ms, 10)
  if (isNaN(ts)) return { fecha: "", hora: "" }
  const d = new Date(ts)
  const fecha = d.toISOString().split("T")[0]
  const hora = d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
    hour12: false,
  })
  return { fecha, hora }
}
