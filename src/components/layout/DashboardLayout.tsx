import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Search, FileBarChart, Database, ChevronRight, UserCheck
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Portfolio Overview", icon: LayoutDashboard },
  { path: "/customer", label: "Customer Snapshot", icon: Users },
  { path: "/drilldown", label: "Customer Drilldown", icon: Search },
  { path: "/agent-adoption", label: "Agent Adoption", icon: UserCheck },
  { path: "/reports", label: "Reports Hub", icon: FileBarChart },
  { path: "/data", label: "Data Management", icon: Database },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-sidebar-border"
        style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%), hsl(220 30% 8%))' }}>
        <div className="px-5 py-5 border-b border-sidebar-border relative">
          <h1 className="text-base font-extrabold tracking-tight text-gradient-cyan">
            PM Master
          </h1>
          <p className="text-xs text-sidebar-foreground mt-0.5">Product Command Center</p>
          {/* Pulsing accent line */}
          <div className="absolute bottom-0 left-5 right-5 h-[1px] animate-glow-pulse"
               style={{ background: 'linear-gradient(90deg, hsl(195 100% 50%), hsl(270 100% 65%))' }} />
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                  active
                    ? "text-sidebar-accent-foreground font-medium border-l-2 border-primary"
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground border-l-2 border-transparent"
                }`}
                style={active ? {
                  background: 'hsla(195, 100%, 50%, 0.08)',
                  boxShadow: '0 0 12px hsla(195, 100%, 50%, 0.1)',
                } : {}}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider"
             style={{ textShadow: '0 0 6px hsla(195, 100%, 50%, 0.15)' }}>
            Internal Tool
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="relative flex-1 overflow-auto bg-background">
        {/* Background orbs */}
        <div className="orb orb-cyan w-[300px] h-[300px] top-10 right-10 opacity-20" />
        <div className="orb orb-violet w-[250px] h-[250px] bottom-20 left-20 opacity-15" />
        <div className="orb orb-magenta w-[200px] h-[200px] top-1/2 left-1/2 opacity-10" />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
