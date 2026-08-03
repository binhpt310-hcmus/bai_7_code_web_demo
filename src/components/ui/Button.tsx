import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-[#a8451f] active:scale-[0.98] disabled:bg-accent/40",
  secondary:
    "bg-surface text-ink border border-border hover:border-ink/30 active:scale-[0.98] disabled:opacity-40",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 active:scale-[0.98] disabled:opacity-40",
  danger:
    "bg-danger-bg text-danger hover:bg-danger/15 active:scale-[0.98] disabled:opacity-40",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3.5 py-1.5 gap-1.5",
  md: "text-sm px-5 py-2.5 gap-2",
  lg: "text-base px-6 py-3.5 gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
