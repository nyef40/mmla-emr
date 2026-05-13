"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
    >
      Print
    </button>
  );
}
