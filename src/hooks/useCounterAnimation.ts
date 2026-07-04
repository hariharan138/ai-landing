import { useEffect, useState, useRef } from "react";

interface UseCounterAnimationOptions {
  duration?: number;
  start?: number;
  decimals?: number;
}

export function useCounterAnimation(
  end: number,
  options: UseCounterAnimationOptions = {}
) {
  const { duration = 1500, start = 0, decimals = 0 } = options;
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (end === start) return;

    setIsAnimating(true);
    startTimeRef.current = performance.now();

    const animate = (currentTime: DOMHighResTimeStamp) => {
      const elapsed = currentTime - (startTimeRef.current || 0);
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: ease-out quart
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      setCount(Number(current.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, start, duration, decimals]);

  return { count, isAnimating };
}
