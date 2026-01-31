import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl px-4 py-2 text-base transition-all duration-300 outline-none",
        "bg-gray-50 border border-gray-200 text-[#2f3a44]",
        "placeholder:text-gray-400",
        "focus:border-[#93784a] focus:bg-white",
        "focus:ring-2 focus:ring-[rgba(147,120,74,0.15)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
