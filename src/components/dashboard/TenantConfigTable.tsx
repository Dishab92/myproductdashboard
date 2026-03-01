import { useState, useEffect } from "react";
import { TenantConfig } from "@/lib/types";
import { useData } from "@/context/DataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Save, CheckCircle } from "lucide-react";

export function TenantConfigTable() {
  const { data, setTenantConfig } = useData();
  const [configs, setConfigs] = useState<TenantConfig[]>([]);
  const [saved, setSaved] = useState(false);

  // Derive tenant IDs from events and merge with existing config
  useEffect(() => {
    const tenantIds = [...new Set(data.events.map(e => e.customer_id))];
    const existingMap = new Map(data.tenantConfig.map(c => [c.tenant_id, c]));

    const merged = tenantIds.map(tid => existingMap.get(tid) || {
      tenant_id: tid,
      customer_name: "",
      go_live_date: null,
      stage: "Live",
    });
    setConfigs(merged);
  }, [data.events, data.tenantConfig]);

  const eventCounts = data.events.reduce<Record<string, number>>((acc, e) => {
    acc[e.customer_id] = (acc[e.customer_id] || 0) + 1;
    return acc;
  }, {});

  const updateConfig = (idx: number, field: keyof TenantConfig, value: any) => {
    setConfigs(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    setSaved(false);
  };

  const handleSave = () => {
    setTenantConfig(configs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (configs.length === 0) return null;

  return (
    <Card className="p-5 border bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Customer Configuration</h3>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleSave}>
          {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved" : "Save Config"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Map tenant IDs to customer names for reporting. Config is saved locally.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Tenant ID</TableHead>
              <TableHead className="text-xs">Customer Name</TableHead>
              <TableHead className="text-xs">Go-Live Date</TableHead>
              <TableHead className="text-xs">Stage</TableHead>
              <TableHead className="text-xs text-right">Events</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((c, i) => (
              <TableRow key={c.tenant_id}>
                <TableCell className="text-xs font-mono text-muted-foreground">{c.tenant_id}</TableCell>
                <TableCell>
                  <Input
                    value={c.customer_name}
                    onChange={e => updateConfig(i, "customer_name", e.target.value)}
                    placeholder="Enter name..."
                    className="h-7 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={c.go_live_date ? new Date(c.go_live_date).toISOString().slice(0, 10) : ""}
                    onChange={e => updateConfig(i, "go_live_date", e.target.value ? new Date(e.target.value) : null)}
                    className="h-7 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Select value={c.stage} onValueChange={v => updateConfig(i, "stage", v)}>
                    <SelectTrigger className="h-7 text-xs w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Live">Live</SelectItem>
                      <SelectItem value="Pilot">Pilot</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums">
                  {(eventCounts[c.tenant_id] || 0).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
