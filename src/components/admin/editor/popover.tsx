"use client";

import type { ReactElement, ReactNode } from "react";
import { Popover as Root, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Small convenience wrapper: `trigger` is the element that opens the popover. */
export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  children: ReactNode;
}) {
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="start" className="w-auto p-2">
        {children}
      </PopoverContent>
    </Root>
  );
}
