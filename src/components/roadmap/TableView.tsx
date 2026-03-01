import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapItem } from "./RoadmapCard";

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500/20 text-red-300 border-red-500/30",
  P1: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  P2: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  P3: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLORS: Record<string, string> = {
  Backlog: "bg-muted text-muted-foreground",
  "In Progress": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Beta: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Released: "bg-green-500/20 text-green-300 border-green-500/30",
};

type SortKey = "product_type" | "title" | "priority" | "status" | "release_quarter" | "owner";

interface TableViewProps {
  items: RoadmapItem[];
  onEdit: (item: RoadmapItem) => void;
  onDelete: (item: RoadmapItem) => void;
  hideNotes?: boolean;
}

export function TableView({ items, onEdit, onDelete, hideNotes }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...items].sort((a, b) => {
    const av = a[sortKey] || "";
    const bv = b[sortKey] || "";
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(k)}>
      <span className="flex items-center gap-1 text-xs">
        {label} <ArrowUpDown className="w-3 h-3" />
      </span>
    </TableHead>
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Product" k="product_type" />
            <SortHeader label="Title" k="title" />
            <SortHeader label="Priority" k="priority" />
            <SortHeader label="Status" k="status" />
            <SortHeader label="Quarter" k="release_quarter" />
            <SortHeader label="Owner" k="owner" />
            <TableHead className="text-xs w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/30">
              <TableCell className="text-xs">{item.product_type}</TableCell>
              <TableCell className="text-xs font-medium">{item.title}</TableCell>
              <TableCell>
                <Badge className={cn("text-[10px]", PRIORITY_COLORS[item.priority])}>{item.priority}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("text-[10px]", STATUS_COLORS[item.status])}>{item.status}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.release_quarter || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.owner || "—"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                No roadmap items found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
