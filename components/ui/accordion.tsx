"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("mb-4", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group w-full rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black px-6 py-5 text-left text-lg font-medium text-white backdrop-blur-xl transition-all hover:border-blue-400/40",
        "data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        {children}
        <Plus className="h-5 w-5 text-emerald-400 transition-transform duration-500 ease-in-out group-data-[state=open]:rotate-45" />
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-gray-300",
      "transition-all duration-300 ease-in-out",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      "rounded-b-2xl border border-t-0 border-blue-400/20 bg-gradient-to-br from-blue-900/10 to-black backdrop-blur-xl",
      className
    )}
    {...props}
  >
    <div className={cn(
      "px-6 py-5",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
