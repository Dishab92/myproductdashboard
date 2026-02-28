import { CustomerMetrics } from "@/lib/types";
import { HealthBadge } from "./HealthBadge";
import { TrendBadge } from "./TrendBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  customers: CustomerMetrics[];
  onSelect?: (customerId: string) => void;
  title?: string;
}

export function CustomerTable({ customers, onSelect, title }: Props) {
  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>}
      <div className="rounded-lg overflow-hidden glass-strong border-glow-cyan">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50" style={{ background: 'hsla(195, 100%, 50%, 0.04)' }}>
              <TableHead className="text-xs font-medium text-muted-foreground backdrop-blur-sm">Customer</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Product</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Release</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Active Users</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Adoption</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Momentum</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(c => (
              <TableRow
                key={c.customer_id}
                className="cursor-pointer transition-all duration-200 border-l-2 border-l-transparent hover:border-l-primary"
                onClick={() => onSelect?.(c.customer_id)}
                style={{}}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'hsla(195, 100%, 50%, 0.04)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px hsla(195, 100%, 50%, 0.06)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                <TableCell className="font-medium text-sm">{c.customer_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.product}</TableCell>
                <TableCell className="text-xs">{c.release}</TableCell>
                <TableCell className="text-sm text-right tabular-nums">{c.activeUsers}</TableCell>
                <TableCell className="text-sm text-right tabular-nums font-medium">{c.adoptionScore}</TableCell>
                <TableCell className="text-right"><TrendBadge value={c.momentum} /></TableCell>
                <TableCell><HealthBadge status={c.health} /></TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
