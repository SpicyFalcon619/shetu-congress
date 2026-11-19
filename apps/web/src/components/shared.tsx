import clsx from "clsx";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Avatar as UIAvatar, AvatarFallback } from "@/components/ui/avatar";
import { Button as UIButton } from "@/components/ui/button";

/** A content surface: white card, hairline border, soft shadow. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={clsx(
        "min-w-0 rounded-xl border bg-card text-card-foreground shadow-[0_1px_2px_rgba(34,32,35,0.04)]",
        className,
      )}
    >
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
    <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] leading-6 font-semibold tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

type ButtonProps = Omit<ComponentProps<typeof UIButton>, "variant" | "size"> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  busy?: boolean;
};

const VARIANT = { primary: "default", secondary: "outline", ghost: "ghost" } as const;

export function Button({ variant = "primary", size = "md", busy, disabled, children, ...rest }: ButtonProps) {
  return (
    <UIButton
      {...rest}
      variant={VARIANT[variant]}
      size={size === "md" ? "lg" : "sm"}
      disabled={disabled || busy}
    >
      {busy && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </UIButton>
  );
}

export type Tone = "neutral" | "crimson" | "gold" | "leaf";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-2xs font-medium whitespace-nowrap ring-1 ring-inset",
        tone === "neutral" && "bg-secondary text-ink-2 ring-border",
        tone === "crimson" && "bg-blush text-crimson-ink ring-rose/60",
        tone === "gold" && "bg-gold-soft text-gold-ink ring-gold/30",
        tone === "leaf" && "bg-leaf-soft text-leaf ring-leaf/20",
      )}
    >
      {children}
    </span>
  );
}

export function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <UIAvatar
      className={clsx(size === "sm" && "size-6", size === "md" && "size-8", size === "lg" && "size-10")}
    >
      <AvatarFallback
        className={clsx(
          "bg-blush font-semibold text-crimson-ink",
          size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm",
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </UIAvatar>
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
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">{children}</div>}
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
        <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em] text-balance">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
