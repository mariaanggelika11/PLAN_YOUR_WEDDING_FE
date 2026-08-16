"use client";

import { AppInput } from "@/shared/components/ui/FormFields";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = Omit<React.ComponentProps<typeof AppInput>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <AppInput
        {...props}
        className={`pr-11 ${className ?? ""}`}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={isVisible}
        className="absolute right-3 top-9 grid size-7 place-items-center text-stone-400 hover:text-blush"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
