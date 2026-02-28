import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type EffectLevel = "off" | "subtle" | "medium";

interface EffectsState {
  level: EffectLevel;
  setLevel: (l: EffectLevel) => void;
  parallax: boolean;
  setParallax: (p: boolean) => void;
  reduceMotion: boolean;
}

const EffectsContext = createContext<EffectsState>({
  level: "subtle",
  setLevel: () => {},
  parallax: false,
  setParallax: () => {},
  reduceMotion: false,
});

export const useEffects = () => useContext(EffectsContext);

export function EffectsProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [level, setLevelState] = useState<EffectLevel>(() => {
    const saved = localStorage.getItem("pm-effects-level");
    return (saved as EffectLevel) || (reduceMotion ? "off" : "subtle");
  });

  const [parallax, setParallaxState] = useState(() => {
    return localStorage.getItem("pm-effects-parallax") === "true";
  });

  const setLevel = (l: EffectLevel) => {
    setLevelState(l);
    localStorage.setItem("pm-effects-level", l);
  };

  const setParallax = (p: boolean) => {
    setParallaxState(p);
    localStorage.setItem("pm-effects-parallax", String(p));
  };

  return (
    <EffectsContext.Provider value={{ level, setLevel, parallax, setParallax, reduceMotion }}>
      {children}
    </EffectsContext.Provider>
  );
}
