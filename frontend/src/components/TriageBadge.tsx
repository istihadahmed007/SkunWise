import React from "react";

interface TriageBadgeProps {
  tier: number;
  label?: string;
  title?: string;
  badgeColor?: string;
  size?: "sm" | "md" | "lg";
}

export const TriageBadge: React.FC<TriageBadgeProps> = ({ tier, label, title, size = "md" }) => {
  let bgClass = "bg-surface-container-high text-on-surface";
  let dotClass = "bg-secondary";
  let text = title || label || "Assessment Pending";

  if (tier === 1) {
    bgClass = "bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]";
    dotClass = "bg-[#10b981]";
    text = label || "MILD / GENERAL SELF-CARE";
  } else if (tier === 2) {
    bgClass = "bg-[#fffbeb] text-[#92400e] border border-[#fde68a]";
    dotClass = "bg-[#d97706]";
    text = label || "MEDICAL ASSESSMENT RECOMMENDED";
  } else if (tier === 3) {
    bgClass = "bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]";
    dotClass = "bg-[#dc2626]";
    text = label || "URGENT CARE / EMERGENCY";
  }

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-headline font-bold uppercase tracking-wider ${sizeClasses} ${bgClass}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotClass} animate-pulse`} />
      <span>{text}</span>
    </span>
  );
};
