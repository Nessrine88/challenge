
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X, Settings2 } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ChallengeManagementDrawer({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (document.querySelector("dialog[open]")) return;

      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const items = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter((element) => element.getClientRects().length > 0);

        if (items.length === 0) {
          event.preventDefault();
          return;
        }

        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;

        if (
          event.shiftKey &&
          (active === first || active === panelRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-amber-200 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
      >
        <Settings2 className="size-4" />
        Manage challenge
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          <aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl outline-none animate-in slide-in-from-right duration-300 motion-reduce:animate-none"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">
                  Manage challenge
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage tasks and schedules.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close panel"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {children}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
