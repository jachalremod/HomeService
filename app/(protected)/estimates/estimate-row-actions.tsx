"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { restoreEstimate } from "./actions";

type EstimateRowActionsProps = {
  estimateId: string;
  deleted: boolean;
};

export default function EstimateRowActions({
  estimateId,
  deleted,
}: EstimateRowActionsProps) {
  if (deleted) {
    return (
      <div className="flex justify-end gap-3">
        <Link
          href={`/estimates/${estimateId}`}
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          Open
        </Link>

        <form action={restoreEstimate.bind(null, estimateId)}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <RotateCcw size={15} />
            Restore
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href={`/estimates/${estimateId}`}
      className="font-semibold text-blue-700 hover:text-blue-900"
    >
      Open
    </Link>
  );
}