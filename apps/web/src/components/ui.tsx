import clsx from "clsx";
import { AlertCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={clsx("min-w-0 rounded-xl border border-line bg-panel", className)}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] leading-6 font-bold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  busy?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  busy,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || busy}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition-[background-color,box-shadow,color] duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-9 px-3.5 text-[13px]" : "h-7 px-2.5 text-xs",
        variant === "primary" &&
          "bg-crimson text-white shadow-[0_1px_2px_rgba(122,5,29,.25)] hover:bg-crimson-ink",
        variant === "secondary" &&
          "border border-line-strong bg-panel text-ink shadow-[0_1px_2px_rgba(34,32,35,.06)] hover:bg-sunk",
        variant === "ghost" && "text-ink-2 hover:bg-sunk hover:text-ink",
        className,
      )}
    >
      {busy && (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}

export type Tone = "neutral" | "crimson" | "gold" | "leaf";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-2xs font-semibold whitespace-nowrap",
        tone === "neutral" && "bg-sunk text-ink-2",
        tone === "crimson" && "bg-blush text-crimson-ink",
        tone === "gold" && "bg-gold-soft text-gold-ink",
        tone === "leaf" && "bg-leaf-soft text-leaf",
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-blush font-bold text-crimson-ink",
        size === "md" ? "size-8 text-xs" : "size-6 text-2xs",
      )}
    >
      {initials}
    </span>
  );
}

export function ErrorNote({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-2 rounded-lg bg-blush px-3 py-2.5 text-[13px] text-crimson-ink"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-[13px] text-muted">{children}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl leading-tight font-extrabold tracking-[-0.02em] text-balance text-ink">
          {title}
        </h1>
        {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
