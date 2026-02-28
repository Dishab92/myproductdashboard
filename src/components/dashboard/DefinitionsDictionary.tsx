import { useState } from "react";
import { Book, Search } from "lucide-react";
import { METRIC_DEFINITIONS, METRIC_CATEGORIES } from "@/lib/metric-definitions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DefinitionsDictionary() {
  const [search, setSearch] = useState("");

  const filtered = METRIC_DEFINITIONS.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Book className="w-4 h-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Definitions</TooltipContent>
      </Tooltip>
      <SheetContent className="w-[400px] sm:w-[440px] glass-strong border-l border-border">
        <SheetHeader>
          <SheetTitle className="text-gradient-cyan">Metric Definitions</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search metrics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm glass-strong border-glow-cyan"
            />
          </div>
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-6 pr-4">
              {METRIC_CATEGORIES.map(cat => {
                const items = filtered.filter(m => m.category === cat.key);
                if (items.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                      {cat.label}
                    </h3>
                    <div className="space-y-3">
                      {items.map(m => (
                        <div key={m.id} className="p-3 rounded-lg glass border-glow-cyan space-y-1.5">
                          <p className="text-sm font-semibold text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.definition}</p>
                          {m.formula && (
                            <p className="text-xs">
                              <span className="font-medium text-primary">Formula: </span>
                              <span className="text-muted-foreground whitespace-pre-line">{m.formula}</span>
                            </p>
                          )}
                          <p className="text-xs">
                            <span className="font-medium text-primary">Interpretation: </span>
                            <span className="text-muted-foreground">{m.interpretation}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 italic">Source: {m.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
