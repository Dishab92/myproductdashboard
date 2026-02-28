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
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-medium">Customer</TableHead>
              <TableHead className="text-xs font-medium">Product</TableHead>
              <TableHead className="text-xs font-medium">Release</TableHead>
              <TableHead className="text-xs font-medium text-right">Active Users</TableHead>
              <TableHead className="text-xs font-medium text-right">Adoption</TableHead>
              <TableHead className="text-xs font-medium text-right">Momentum</TableHead>
              <TableHead className="text-xs font-medium">Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(c => (
              <TableRow
                key={c.customer_id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onSelect?.(c.customer_id)}
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
