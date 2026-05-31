"use client";

import { icons, type LucideProps } from "lucide-react";

interface Props extends LucideProps {
  name: string;
}

/** Render a lucide icon by its string name; falls back to a circle. */
export default function Icon({ name, ...props }: Props) {
  const Cmp = (icons as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Cmp) {
    const Fallback = icons.Circle;
    return <Fallback {...props} />;
  }
  return <Cmp {...props} />;
}
