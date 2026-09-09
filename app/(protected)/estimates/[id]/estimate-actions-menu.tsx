"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ClipboardList,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { deleteEstimate } from "../actions";
import {
  duplicateEstimate,
  updateEstimateDisplayOptions,
} from "./actions";

type EstimateActionsMenuProps = {
  estimateId: string;
  status: string;
  hasInvoice: boolean;
  showQuantity: boolean;
  showRate: boolean;
};

export default function EstimateActionsMenu({
  estimateId,
  status,
  hasInvoice,
  showQuantity,
  showRate,
}: EstimateActionsMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const canEdit = status === "draft" || status === "sent";
  const isApproved = status === "approved";

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      const menu = menuRef.current;

      if (
        menu &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      ) {
        menu.removeAttribute("open");
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        menuRef.current?.removeAttribute("open");
      }
    }

    document.addEventListener(
      "pointerdown",
      closeOnOutsideClick,
    );
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeOnOutsideClick,
      );
      document.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, []);

  return (
    <details ref={menuRef} className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">
        Actions
        <ChevronDown size={17} />
      </summary>

      <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        <form
          action={updateEstimateDisplayOptions}
          className="mb-2 rounded-lg bg-slate-50 p-3"
        >
          <input
            type="hidden"
            name="estimateId"
            value={estimateId}
          />

          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Customer document display
          </p>

          <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              name="showQuantity"
              defaultChecked={showQuantity}
              className="size-4 rounded border-slate-300"
            />
            Show quantity
          </label>

          <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              name="showRate"
              defaultChecked={showRate}
              className="size-4 rounded border-slate-300"
            />
            Show rate
          </label>

          <button
            type="submit"
            className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save display options
          </button>
        </form>
        {canEdit ? (
          <Link
            href={`/estimates/${estimateId}/edit`}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Pencil size={17} />
            Edit estimate
          </Link>
        ) : null}

        {isApproved ? (
          <Link
            href={`/estimates/${estimateId}/work-orders/new`}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ClipboardList size={17} />
            Create work order
          </Link>
        ) : null}

        <form action={duplicateEstimate}>
          <input
            type="hidden"
            name="estimateId"
            value={estimateId}
          />

          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Copy size={17} />
            Duplicate estimate
          </button>
        </form>

        <a
          href={`/api/estimates/${estimateId}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ExternalLink size={17} />
          Open/Print PDF
        </a>

        {!hasInvoice ? (
          <>
            <div className="my-2 border-t border-slate-200" />

            <form
              action={deleteEstimate.bind(null, estimateId)}
              onSubmit={(event) => {
                const confirmed = window.confirm(
                  "Move this estimate to Deleted?",
                );

                if (!confirmed) {
                  event.preventDefault();
                }
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={17} />
                Delete estimate
              </button>
            </form>
          </>
        ) : (
          <p className="px-3 py-2 text-xs text-slate-500">
            Estimates with invoices cannot be deleted.
          </p>
        )}
      </div>
    </details>
  );
}