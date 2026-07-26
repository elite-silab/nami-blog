type LogoProps = {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
};

export function Logo({ size = "md", showSubtitle = true }: LogoProps) {
  const dims = {
    sm: { w: 120, h: 34, icon: 1.5, wave: 0.8 },
    md: { w: 160, h: 42, icon: 1.8, wave: 1 },
    lg: { w: 220, h: 56, icon: 2.2, wave: 1.3 },
  }[size];
  return (
    <svg viewBox="0 0 200 50" width={dims.w} height={dims.h} aria-label="Nami Blog" role="img">
      <ellipse cx="14" cy="10" rx="3.5" ry="6" fill="none" stroke="var(--color-primary)" strokeWidth="1.2" transform="rotate(-30,14,10)" opacity="0.5" />
      <ellipse cx="21" cy="12" rx="2.8" ry="5" fill="none" stroke="var(--color-primary)" strokeWidth="1.2" transform="rotate(20,21,12)" opacity="0.35" />
      <ellipse cx="10" cy="16" rx="2" ry="3.5" fill="none" stroke="var(--color-primary)" strokeWidth="0.8" transform="rotate(-50,10,16)" opacity="0.25" />
      <path d="M4 26 Q8 20 12 26 Q16 32 20 26" stroke="var(--color-primary)" strokeWidth={dims.icon} fill="none" strokeLinecap="round" opacity="0.6" />
      <text x="30" y="34" fontFamily="Georgia,'Noto Serif SC',serif" fontSize="32" fontWeight="700"><tspan fill="var(--color-primary)">N</tspan><tspan fill="var(--color-text)">ami</tspan></text>
      {showSubtitle && <text x="132" y="34" fontFamily="'Avenir Next','Noto Sans SC',sans-serif" fontSize="12" fill="var(--color-text-secondary)" fontWeight="300">blog</text>}
      <path d="M30 42 Q50 37 70 42 Q90 47 110 42 Q130 37 150 42 Q165 47 175 42" stroke="var(--color-primary)" strokeWidth={dims.wave} fill="none" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-label="Nami" role="img">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="var(--color-primary)" />
      <path d="M14 36 L14 12 L34 36 L34 12" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2.5" fill="white" opacity="0.5" />
      <circle cx="14" cy="5" r="1.5" fill="white" opacity="0.4" />
      <circle cx="5" cy="14" r="1.5" fill="white" opacity="0.3" />
      <path d="M8 40 Q15 36 22 40 Q29 44 36 40" stroke="white" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
    </svg>
  );
}
