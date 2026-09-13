import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { label: string; icon: LucideIcon; onClick: () => void; destructive?: boolean };
export function AdminActionButton({ label, icon: Icon, onClick, destructive = false }: Props) {
  return <Button aria-label={label} title={label} variant={destructive ? "destructive" : "outline"} size="sm" className={cn("rounded-full")} onClick={onClick}><Icon size={14} /><span className="hidden sm:inline">{label}</span></Button>;
}
