"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { approveEstimateWithSignature } from "./actions";

export default function SignaturePad({ token }: { token: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function getPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { x, y } = getPos(event);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !signedName.trim()) return;

    setSubmitting(true);
    const dataUrl = canvas.toDataURL("image/png");

    const formData = new FormData();
    formData.set("token", token);
    formData.set("signature", dataUrl);
    formData.set("signedName", signedName.trim());

    await approveEstimateWithSignature(formData);
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-bold text-slate-900">Sign to approve</h3>
      <p className="mt-1 text-xs text-slate-500">
        By signing below, you approve this estimate and authorize the described work.
      </p>

      <label className="mt-4 block text-xs font-semibold text-slate-600">
        Your full name
        <input
          value={signedName}
          onChange={(event) => setSignedName(event.target.value)}
          placeholder="Type your full name"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-600"
        />
      </label>

      <div className="mt-3">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-slate-50"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-400">Draw your signature above</p>
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            <RotateCcw size={13} />
            Clear
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasSignature || !signedName.trim() || submitting}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Approving…" : "Approve & Sign Estimate"}
      </button>
    </div>
  );
}