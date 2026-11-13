"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Confirmation for destructive actions. `trigger` receives a function that opens the dialog. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  trigger,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<boolean | void>;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      {trigger(() => setOpen(true))}
      <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const keepOpen = (await onConfirm()) === false;
                  if (!keepOpen) setOpen(false);
                })
              }
            >
              {pending && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
