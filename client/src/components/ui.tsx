import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * The small building blocks every page uses. Styling is done with Tailwind
 * classes right here, so each block carries its look with it.
 */

type NeonColor = 'blue' | 'red' | 'yellow';

const glow: Record<NeonColor, string> = {
  blue: 'glow-blue',
  red: 'glow-red',
  yellow: 'glow-yellow',
};

/** A heading that looks like a neon tube */
const NeonHeading = ({
  as: Tag = 'h1',
  children,
  className = '',
  color = 'red',
}: {
  as?: 'h1' | 'h2' | 'h3';
  children: ReactNode;
  className?: string;
  color?: NeonColor;
}) => (
  <Tag
    className={`font-neon tracking-wide uppercase ${glow[color]} ${className}`}
  >
    {children}
  </Tag>
);

const buttonLook: Record<'danger' | 'ghost' | 'primary', string> = {
  primary:
    'border-neon-blue text-neon-blue-core hover:bg-neon-blue hover:halo-blue',
  // Dark text on the red: the light one is too close to it to read
  danger:
    'border-neon-red text-neon-red-core hover:bg-neon-red hover:text-night hover:halo-red',
  ghost: 'border-night-control text-slate-300 hover:border-slate-300',
};

const Button = ({
  children,
  className = '',
  look = 'primary',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  look?: keyof typeof buttonLook;
}) => (
  <button
    type={type}
    className={`cursor-pointer rounded border px-4 py-2 text-sm font-semibold tracking-wider uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${buttonLook[look]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

const Card = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`border-night-line bg-night-raised rounded-lg border p-4 ${className}`}
  >
    {children}
  </div>
);

const Avatar = ({
  name,
  size = 40,
  src,
}: {
  name: string;
  size?: number;
  src: string;
}) => (
  <img
    src={src}
    alt={`Avatar of ${name}`}
    width={size}
    height={size}
    loading="lazy"
    className="border-night-line shrink-0 rounded-full border object-cover"
    style={{ width: size, height: size }}
  />
);

const Spinner = ({ label = 'Loading' }: { label?: string }) => (
  <div
    role="status"
    className="flex items-center gap-3 py-6 text-sm text-slate-400"
  >
    {/* Stands still for people who asked their system for less motion */}
    <span className="border-neon-yellow size-4 rounded-full border-2 border-t-transparent motion-safe:animate-spin" />
    {label}…
  </div>
);

/** Shown instead of a list that has nothing in it */
const EmptyState = ({ children }: { children: ReactNode }) => (
  <p className="border-night-line rounded-lg border border-dashed px-4 py-8 text-center text-slate-400">
    {children}
  </p>
);

/**
 * Announces a failure. `role="alert"` makes screen readers read it out.
 * With `onRetry`, it offers to try again right where it failed.
 */
const ErrorNote = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) => (
  <div
    role="alert"
    className="border-neon-red/60 text-neon-red-core flex flex-wrap items-center justify-between gap-3 rounded border bg-red-950/40 px-3 py-2 text-sm"
  >
    <span>
      {error instanceof Error ? error.message : 'Something went wrong'}
    </span>
    {onRetry !== undefined && (
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer font-semibold underline"
      >
        Try again
      </button>
    )}
  </div>
);

export { Avatar, Button, Card, EmptyState, ErrorNote, NeonHeading, Spinner };
