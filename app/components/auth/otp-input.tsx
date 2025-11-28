"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: OTPInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create an array of length `length`,
  // filling with existing characters from `value` or "" if none left.
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value) {
      onChange("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (newValue.length <= length) {
      onChange(newValue);
    }
  };

  return (
    <div className="group relative" onClick={handleClick}>
      <div className="flex gap-3 justify-center">
        {digits.map((digit, i) => (
          <div
            key={i}
            className={cn(
              "relative w-12 h-14 flex items-center justify-center text-xl font-semibold transition-all",
              "border-2 rounded-lg bg-white shadow-sm",
              focused && "border-neutral-900 shadow-md",
              !focused && "border-neutral-200",
              digit && "text-neutral-950 border-neutral-300",
              !digit && "text-neutral-400"
            )}
          >
            {digit || ""}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        autoComplete="one-time-code"
      />
    </div>
  );
}
