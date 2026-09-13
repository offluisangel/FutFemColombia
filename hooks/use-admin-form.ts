import { useState } from "react";

export function useAdminForm<T>(initialForm: T) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<unknown>(null);
  const [form, setForm] = useState(initialForm);
  const resetForm = () => { setForm(initialForm); setEditing(null); };
  return { open, setOpen, saving, setSaving, editing, setEditing, form, setForm, resetForm };
}
