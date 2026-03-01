import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Search, FileBarChart, Database, ChevronRight, UserCheck, Camera, ShieldAlert,
  BarChart3, Clock,
} from "lucide-react";
import { Starfield } from "@/components/effects/Starfield";
import { EffectsMenu } from "@/components/effects/EffectsMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DefinitionsDictionary } from "@/components/dashboard/DefinitionsDictionary";
import { SnapshotToolbar } from "@/components/layout/SnapshotToolbar";
import { SnapshotFrame } from "@/components/layout/SnapshotFrame";
import { PageTransition } from "@/components/layout/PageTransition";
import { useSnapshot } from "@/context/SnapshotContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { path: "/", label: "Portfolio Overview", icon: LayoutDashboard, group: "Dashboard" },
  { path: "/customer", label: "Customer Snapshot", icon: Users, group: "Dashboard" },
  { path: "/drilldown", label: "Customer Drilldown", icon: Search, group: "Dashboard" },
  { path: "/agent-adoption", label: "Agent Adoption", icon: UserCheck, group: "Dashboard" },
  { path: "/adoption-health", label: "Adoption Health", icon: ShieldAlert, group: "Dashboard" },
  { path: "/insights/features", label: "Feature Insights", icon: BarChart3, group: "Insights" },
  { path: "/insights/agents", label: "Agent Insights", icon: UserCheck, group: "Insights" },
  { path: "/insights/cases", label: "Case Time", icon: Clock, group: "Insights" },
  { path: "/reports", label: "Reports Hub", icon: FileBarChart, group: "Tools" },
  { path: "/data", label: "Data Management", icon: Database, group: "Tools" },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Portfolio Overview",
  "/customer": "Customer Snapshot",
  "/drilldown": "Customer Drilldown",
  "/agent-adoption": "Agent Adoption",
  "/adoption-health": "Adoption Health",
  "/insights/features": "Feature Insights",
  "/insights/agents": "Agent Insights",
  "/insights/cases": "Case Time",
  "/reports": "Reports Hub",
  "/data": "Data Management",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isSnapshotMode, toggleSnapshot, contentRef } = useSnapshot();
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border relative">
          <h1 className="text-base font-extrabold tracking-tight text-gradient-cyan">
            PM Master
          </h1>
          <p className="text-xs text-sidebar-foreground mt-0.5">Product Command Center</p>
          <div className="absolute bottom-0 left-5 right-5 h-[1px] animate-glow-pulse"
               style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }} />
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item, idx) => {
            const active = location.pathname === item.path;
            const prevGroup = idx > 0 ? NAV_ITEMS[idx - 1].group : null;
            const showGroupLabel = item.group !== prevGroup;
            return (
              <div key={item.path}>
                {showGroupLabel && (
                  <p className={`text-[10px] uppercase tracking-wider text-sidebar-foreground/40 px-3 ${idx > 0 ? "pt-3 pb-1" : "pb-1"}`}>
                    {item.group}
                  </p>
                )}
                <Link
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    active
                      ? "text-sidebar-accent-foreground font-medium border-l-2 border-primary"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground border-l-2 border-transparent"
                  }`}
                  style={active ? {
                    background: 'hsla(var(--primary), 0.08)',
                    boxShadow: '0 0 12px hsla(var(--primary), 0.1)',
                  } : {}}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider">
            Internal Tool
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top nav bar */}
        <header className="flex items-center justify-between px-6 py-2 border-b border-border bg-background/80 backdrop-blur-sm z-20">
          <h2 className="text-sm font-semibold text-foreground">{pageTitle}</h2>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <EffectsMenu />
            <DefinitionsDictionary />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSnapshotMode ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 ${isSnapshotMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={toggleSnapshot}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Snapshot Mode</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Snapshot toolbar */}
        {isSnapshotMode && <SnapshotToolbar />}

        <main className="relative flex-1 overflow-auto bg-background">
          {/* Starfield behind everything */}
          <Starfield />
          {/* Background orbs */}
          <div className="orb orb-cyan w-[300px] h-[300px] top-10 right-10 opacity-20" />
          <div className="orb orb-violet w-[250px] h-[250px] bottom-20 left-20 opacity-15" />
          <div className="orb orb-magenta w-[200px] h-[200px] top-1/2 left-1/2 opacity-10" />
          <div className="relative z-10" ref={contentRef}>
            <SnapshotFrame>
              <PageTransition locationKey={location.pathname}>
                {children}
              </PageTransition>
            </SnapshotFrame>
          </div>
        </main>
      </div>
    </div>
  );
}
