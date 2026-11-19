import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={clsx(
        "border-l-4 border-crimson pl-2.5 text-xs leading-tight font-extrabold tracking-wider text-crimson uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Deck-style headline: ink text with the key phrase in crimson, ending in a full stop. */
export function Headline({
  lead,
  accent,
  as: Tag = "h1",
}: {
  lead: string;
  accent?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={clsx(
        "font-extrabold tracking-tight text-balance",
        Tag === "h1" ? "text-3xl leading-[1.1] sm:text-4xl" : "text-2xl leading-tight",
      )}
    >
      {lead} {accent && <span className="text-crimson">{accent}</span>}
    </Tag>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={clsx(
        "rounded-xl bg-card p-5 shadow-[0_1px_3px_rgba(34,32,35,.08)] ring-1 ring-line",
        className,
      )}
    >
      {children}
    </section>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "ghost";
  busy?: boolean;
};

export function Button({ variant = "primary", busy, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition",
        "disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-crimson text-white hover:bg-crimson-deep",
        variant === "dark" && "bg-ink text-white hover:bg-black",
        variant === "ghost" && "bg-transparent text-ink ring-1 ring-line hover:ring-muted",
        className,
      )}
    >
      {busy && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "crimson" | "gold" | "leaf";
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap",
        tone === "neutral" && "bg-sunk text-muted",
        tone === "crimson" && "bg-blush text-crimson-deep",
        tone === "gold" && "bg-gold-soft text-gold-ink",
        tone === "leaf" && "bg-leaf-soft text-leaf",
      )}
    >
      {children}
    </span>
  );
}

export function ErrorNote({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 rounded-lg bg-blush px-4 py-3 text-sm font-semibold text-crimson-deep">
      {message}
    </p>
  );
}

export function SyntheticBanner() {
  return (
    <div className="bg-ink text-center text-xs font-semibold tracking-wide text-paper">
      <p className="mx-auto max-w-6xl px-4 py-1.5">
        Synthetic demo data. Every person, organization and figure here is invented.
      </p>
    </div>
  );
}
