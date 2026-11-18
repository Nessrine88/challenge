
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Settings2, X } from "lucide-react";

import { CreateChallengeForm } from "../create-challenge-form";
import type { Challenge } from "../challenge-form.types";

type Props = {
  challenge: Challenge;
  children?: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ChallengeManagementDrawer({
  challenge,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const titleId = useId();

  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const items = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            FOCUSABLE,
          ),
        ).filter(
          (element) => element.getClientRects().length > 0,
        );

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
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
      >
        <Settings2 className="size-4" />
        Manage challenge
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-[2px]"
          />

          {/* Drawer panel */}
          <aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-green-100 shadow-2xl outline-none animate-in slide-in-from-right duration-300 motion-reduce:animate-none"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2
                  id={titleId}
                  className="text-lg font-semibold"
                >
                  Manage challenge
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update challenge information, tasks and schedules.
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

            {/* Drawer content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <CreateChallengeForm
                mode="update"
                challenge={challenge}
              />

              {children}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
