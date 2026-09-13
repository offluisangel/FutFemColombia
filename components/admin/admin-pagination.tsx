import { Button } from "@/components/ui/button";

export function AdminPagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 font-mono text-xs text-[color:var(--color-foreground)]/75">
      <span>Página {page} de {pageCount}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-full" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
        <Button variant="outline" size="sm" className="rounded-full" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>Siguiente</Button>
      </div>
    </div>
  );
}
