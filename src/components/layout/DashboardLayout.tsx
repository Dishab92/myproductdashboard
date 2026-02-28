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
      <aside className="w-60 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <h1 className="text-base font-bold text-sidebar-accent-foreground tracking-tight">
            PM Master
          </h1>
          <p className="text-xs text-sidebar-foreground mt-0.5">Product Analytics</p>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Internal Tool</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
