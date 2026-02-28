import { Sparkles } from "lucide-react";
import { useEffects, EffectLevel } from "@/context/EffectsContext";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LEVELS: { value: EffectLevel; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "subtle", label: "Subtle" },
  { value: "medium", label: "Medium" },
];

export function EffectsMenu() {
  const { level, setLevel, parallax, setParallax, reduceMotion } = useEffects();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Sparkles className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Effects</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-56 glass-strong border-glow-cyan" align="end">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Starfield</p>
          <div className="flex gap-1">
            {LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${
                  level === l.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Parallax</span>
            <Switch checked={parallax} onCheckedChange={setParallax} className="scale-75" />
          </div>
          {reduceMotion && (
            <p className="text-[10px] text-muted-foreground/60">
              Reduced motion detected — effects default to Off.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
