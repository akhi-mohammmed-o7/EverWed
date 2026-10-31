import React, { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";
import { SILK_EASE } from "../../lib/motion";

interface AnimatedCounterProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatIndianCurrency?: boolean;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatIndianCurrency = false,
  duration = 1.6,
  className = "",
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [displayValue, setDisplayValue] = useState<string>("0");

  // Parse string value if needed (e.g. "₹25,00,000" or "400+" or "99.9%")
  let targetNumber = 0;
  let inferredPrefix = prefix;
  let inferredSuffix = suffix;

  if (typeof value === "number") {
    targetNumber = value;
  } else {
    const trimmed = value.trim();
    const match = trimmed.match(/^([^0-9.-]*)([\d,.-]+)([^0-9.-]*)$/);
    if (match) {
      if (!prefix && match[1]) inferredPrefix = match[1];
      const cleanedNumStr = match[2].replace(/,/g, "");
      targetNumber = parseFloat(cleanedNumStr) || 0;
      if (!suffix && match[3]) inferredSuffix = match[3];
    } else {
      targetNumber = parseFloat(trimmed) || 0;
    }
  }

  const formatNumber = (num: number): string => {
    if (formatIndianCurrency) {
      return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(num);
    }
    if (decimals > 0) {
      return num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return Math.round(num).toLocaleString("en-US");
  };

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(formatNumber(targetNumber));
      return;
    }

    if (!isInView) {
      setDisplayValue(formatNumber(0));
      return;
    }

    const controls = animate(0, targetNumber, {
      duration,
      ease: SILK_EASE,
      onUpdate: (latest) => {
        setDisplayValue(formatNumber(latest));
      },
      onComplete: () => {
        setDisplayValue(formatNumber(targetNumber));
      },
    });

    return () => controls.stop();
  }, [isInView, targetNumber, duration, decimals, formatIndianCurrency]);

  return (
    <span ref={ref} className={`inline-flex items-baseline tabular-nums ${className}`}>
      {inferredPrefix && <span className="opacity-90">{inferredPrefix}</span>}
      <span>{displayValue}</span>
      {inferredSuffix && <span className="opacity-90">{inferredSuffix}</span>}
    </span>
  );
};

export default AnimatedCounter;

