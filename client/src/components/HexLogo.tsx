/** The honeycomb: a hexagon drawn as a yellow neon tube */
const HexLogo = ({ size = 96 }: { size?: number }) => (
  <svg
    viewBox="0 0 102 92"
    width={size}
    height={(size * 92) / 102}
    aria-hidden="true"
    className="shrink-0 drop-shadow-[0_0_8px_var(--color-neon-yellow)]"
  >
    <path
      d="M 26,3 L 76,3 L 101,46.3 L 76,89.6 L 26,89.6 L 1,46.3 Z"
      fill="none"
      stroke="var(--color-neon-yellow-core)"
      strokeLinejoin="round"
      strokeWidth="3.5"
    />
  </svg>
);

export { HexLogo };
