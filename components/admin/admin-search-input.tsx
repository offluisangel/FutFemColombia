import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminSearchInput({ value, onChange, placeholder = "Buscar..." }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-foreground)]/60" size={15} /><Input aria-label={placeholder} className="pl-9" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>;
}
