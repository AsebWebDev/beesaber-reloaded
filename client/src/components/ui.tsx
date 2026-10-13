import { useState } from 'react';

import { timeAgo } from '@/lib/format.ts';

import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

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

/**
 * A heading that looks like a neon tube. With `as="p"` it only looks like
 * one: a slogan is not the title of a section, and someone who jumps from
 * heading to heading should not land on it.
 *
 * With `focusRef`, a script can move the focus to it, for when the thing
 * that had the focus is gone. The Tab key still passes it by.
 */
const NeonHeading = ({
  as: Tag = 'h1',
  children,
  className = '',
  color = 'red',
  focusRef,
}: {
  as?: 'h1' | 'h2' | 'h3' | 'p';
  children: ReactNode;
  className?: string;
  color?: NeonColor;
  focusRef?: Ref<HTMLElement>;
}) => (
  <Tag
    // One ref type for the four tags it can be
    ref={focusRef as Ref<HTMLHeadingElement & HTMLParagraphElement>}
    tabIndex={focusRef === undefined ? undefined : -1}
    className={`font-neon tracking-wide uppercase outline-none ${glow[color]} ${className}`}
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
  ref?: Ref<HTMLButtonElement>;
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

/**
 * A square picture that lives on another server: an avatar or a cover from
 * ScoreSaber's image store.
 *
 * - If it cannot be loaded, a plain box of the same size takes its place
 *   instead of the browser's "broken image" mark.
 * - The other server is not told which page asked for the picture.
 * - It has no description, because it never stands alone: the name or the
 *   title is right next to it.
 */
const Picture = ({
  className = '',
  size,
  src,
}: {
  className?: string;
  size: number;
  src: string;
}) => {
  // Remembered per address, so a new picture gets a new chance
  const [failedSrc, setFailedSrc] = useState<string>();
  const box = { width: size, height: size };

  return failedSrc === src ? (
    <span
      aria-hidden="true"
      data-testid="picture-missing"
      className={`bg-night-line inline-block shrink-0 ${className}`}
      style={box}
    />
  ) : (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={`bg-night shrink-0 object-cover ${className}`}
      style={box}
    />
  );
};

/**
 * A player's picture. Decoration: it always stands next to the player's
 * name, so describing it would only make a screen reader say the name twice.
 */
const Avatar = ({ size = 40, src }: { size?: number; src: string }) => (
  <Picture
    src={src}
    size={size}
    className="border-night-line rounded-full border"
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

/**
 * "3 days ago", with the exact moment for machines and, on hover, for
 * people who want to know.
 */
const TimeAgo = ({ className, date }: { className?: string; date: string }) => (
  <time
    dateTime={date}
    // In the visitor's own way of writing dates
    title={new Date(date).toLocaleString()}
    className={className}
  >
    {timeAgo(date)}
  </time>
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

export {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  NeonHeading,
  Picture,
  Spinner,
  TimeAgo,
};
