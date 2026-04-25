import * as React from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-md p-6 mb-6",
        className
      )}
    >
      <h3 className="text-md font-semibold mb-4 border-b pb-2">{title}</h3>
      {children}
    </div>
  );
}
