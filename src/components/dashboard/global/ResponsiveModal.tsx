"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  trigger: React.ReactNode;

  title?: React.ReactNode;
  description?: React.ReactNode;

  children: React.ReactNode;

  /** desktop dialog sizing */
  dialogClassName?: string;

  /** drawer sizing */
  drawerClassName?: string;

  /** scroll container class */
  scrollClassName?: string;
};

export function ResponsiveModal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  dialogClassName,
  drawerClassName,
  scrollClassName,
}: Props) {
  const isDesktop = !useIsMobile(); // md

  // Shared scroll wrapper: makes body scroll, not entire page
  const ScrollBody = (
    <div
      className={cn(
        "max-h-[75vh] overflow-y-auto pr-1", // internal scroll
        scrollClassName,
      )}>
      {children}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent
          className={cn(
            // responsive desktop sizing + scroll
            "w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden",
            dialogClassName,
          )}>
          {(title || description) && (
            <DialogHeader>
              {title ? <DialogTitle>{title}</DialogTitle> : null}
              {description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </DialogHeader>
          )}

          {ScrollBody}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent
        className={cn(
          // drawer should not exceed screen; content scrolls
          "max-h-[95vh] overflow-hidden",
          drawerClassName,
        )}>
        {(title || description) && (
          <DrawerHeader className="text-left">
            {title ? <DrawerTitle>{title}</DrawerTitle> : null}
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
        )}

        <div className="px-4 pb-4">
          {/* on mobile, give a bit more height */}
          <div
            className={cn(
              "max-h-[75vh] overflow-y-auto pr-1",
              scrollClassName,
            )}>
            {children}
          </div>

          {/* Optional footer close button */}
          <div className="pt-3">
            <DrawerClose asChild>
              <button className="w-full rounded-md border px-3 py-2 text-sm">
                Close
              </button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
