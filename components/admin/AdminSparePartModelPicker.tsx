"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type PickablePhoneType = { _id: string; name: string };

interface AdminSparePartModelPickerProps {
  brandSelected: boolean;
  phoneTypes: PickablePhoneType[];
  selectedIds: string[];
  onChangeIds: (ids: string[]) => void;
  newModelName: string;
  onNewModelNameChange: (v: string) => void;
  blockedNewBecauseSelection?: boolean;
  /** إذا كانت `false` تُخفى حق «موديل جديد بالاسم» (مثلاً أكسسوارات تُنشأ بالمعرف فقط). */
  showNewModelRow?: boolean;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function AdminSparePartModelPicker({
  brandSelected,
  phoneTypes,
  selectedIds,
  onChangeIds,
  newModelName,
  onNewModelNameChange,
  blockedNewBecauseSelection = false,
  showNewModelRow = true,
}: AdminSparePartModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setPortalEl(typeof document !== "undefined" ? document.body : null);
  }, []);

  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of phoneTypes) m.set(p._id, p.name);
    return m;
  }, [phoneTypes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return phoneTypes;
    return phoneTypes.filter((p) => p.name.toLowerCase().includes(q));
  }, [phoneTypes, query]);

  const commitDropdownMeasure = () => {
    const el = comboRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const minW = 280;
    const width = Math.max(r.width, minW);

    let left = r.left;
    const pad = 10;
    const vw = window.innerWidth;
    if (left + width > vw - pad) {
      left = Math.max(pad, vw - width - pad);
    }

    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - gap - pad;
    const maxHeight = Math.max(108, Math.min(240, spaceBelow));

    setDropdownPos({
      top: r.bottom + gap,
      left,
      width,
      maxHeight,
    });
  };

  useLayoutEffect(() => {
    if (!open || !portalEl) {
      setDropdownPos(null);
      return;
    }
    commitDropdownMeasure();

    function onViewportChange() {
      commitDropdownMeasure();
    }
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, portalEl, phoneTypes.length]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  function toggle(id: string) {
    if (selectedIds.includes(id))
      onChangeIds(selectedIds.filter((x) => x !== id));
    else onChangeIds([...selectedIds, id]);
  }

  function selectAll() {
    if (!phoneTypes.length) return;
    onChangeIds(phoneTypes.map((p) => p._id));
  }

  function clearAll() {
    onChangeIds([]);
  }

  if (!brandSelected) {
    return (
      <p className="rounded-md border border-dashed border-slate-200/90 bg-white/60 px-2 py-3 text-center text-[10px] leading-snug text-slate-500">
        اختر الماركة أولاً
      </p>
    );
  }

  const fldCombo =
    "admin-input flex h-7 w-full cursor-pointer items-center gap-1.5 rounded-md border border-slate-200/90 bg-white py-1 ps-2 pe-1.5 text-[11px] text-slate-800 shadow-[inset_0_1px_1px_rgba(15,23,42,.04)] focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100";

  const dropdown =
    open && portalEl && dropdownPos ? (
      createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[220] flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/10"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            maxHeight: dropdownPos.maxHeight,
          }}
          dir="rtl"
          role="listbox"
        >
          <input
            type="search"
            dir="auto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب للتصفية…"
            className="shrink-0 border-b border-slate-100 px-2 py-1.5 text-[11px] outline-none placeholder:text-slate-400"
            aria-label="تصفية الموديلات"
            autoComplete="off"
            onMouseDown={(e) => e.stopPropagation()}
          />
          <div className="flex shrink-0 flex-wrap gap-1 border-b border-slate-100 px-2 py-1">
            <button
              type="button"
              onClick={selectAll}
              disabled={!phoneTypes.length}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-white disabled:opacity-40"
            >
              كل ({phoneTypes.length})
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
            >
              إفراغ
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto py-1 text-[11px]">
            {filtered.length === 0 ? (
              <li className="px-2 py-2 text-center text-[10px] text-slate-500">
                لا نتائج
              </li>
            ) : (
              filtered.map((p) => {
                const on = selectedIds.includes(p._id);
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => toggle(p._id)}
                      className={`flex w-full items-center gap-2 px-2 py-1.5 text-start transition hover:bg-slate-50 ${
                        on ? "bg-sky-50/90" : ""
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          on ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {on ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-slate-800">{p.name}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>,
        portalEl
      )
    ) : null;

  return (
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col gap-1">
      {dropdown}

      <div className="flex flex-wrap gap-1">
        {selectedIds.length === 0 ? (
          <span className="rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[10px] text-slate-500">
            لم يتم اختيار موديل
          </span>
        ) : (
          selectedIds.map((id) => (
            <span
              key={id}
              className="group inline-flex max-w-full items-center gap-0.5 rounded-full border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-950"
              title={nameById.get(id) ?? id}
            >
              <span className="max-w-[8.5rem] truncate">{nameById.get(id) ?? id}</span>
              <button
                type="button"
                aria-label={`إزالة ${nameById.get(id)}`}
                onClick={() => onChangeIds(selectedIds.filter((x) => x !== id))}
                className="rounded-full p-0.5 text-sky-600 opacity-70 hover:bg-white/70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="relative">
        <button
          ref={comboRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={fldCombo}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? "-rotate-180" : ""}`}
            aria-hidden
          />
          <span className="min-w-0 flex-1 text-start text-[10px] text-slate-500">
            بحث في الموديلات وإضافتها
          </span>
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        </button>
      </div>

      {showNewModelRow ? (
        <div className="mt-auto shrink-0">
          <label className="mb-0.5 block text-[10px] font-medium text-slate-500">موديل جديد بالاسم</label>
          <input
            type="text"
            disabled={blockedNewBecauseSelection || !brandSelected}
            value={newModelName}
            onChange={(e) => onNewModelNameChange(e.target.value)}
            className="admin-input h-7 rounded-md px-2 py-0.5 text-[11px] disabled:opacity-45"
            placeholder={
              blockedNewBecauseSelection ? "أزل تحديد القائمة" : "اختياري — بدون اختيار من القائمة"
            }
            dir="auto"
          />
        </div>
      ) : null}
    </div>
  );
}
