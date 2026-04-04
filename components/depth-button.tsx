import Link from "next/link";

type Tone = "violet" | "cyan" | "ghost";
type Size = "md" | "sm";

type DepthButtonProps = {
  children: React.ReactNode;
  href?: string;
  tone?: Tone;
  size?: Size;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

function buildClassName(tone: Tone, size: Size, className?: string) {
  return ["depth-button", `depth-button--${tone}`, `depth-button--${size}`, className].filter(Boolean).join(" ");
}

export function DepthButton({
  children,
  href,
  tone = "violet",
  size = "md",
  className,
  onClick,
  type = "button",
}: DepthButtonProps) {
  const classes = buildClassName(tone, size, className);
  const content = (
    <>
      <span className="depth-button__face">{children}</span>
      <span className="depth-button__shadow" aria-hidden="true" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {content}
    </button>
  );
}
