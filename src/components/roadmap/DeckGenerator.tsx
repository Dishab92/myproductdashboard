import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import type { RoadmapItem } from "./RoadmapCard";

interface DeckGeneratorProps {
  items: RoadmapItem[];
  customerSafe: boolean;
}

export function DeckGenerator({ items, customerSafe }: DeckGeneratorProps) {
  const generate = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [1280, 720] });

      const filtered = customerSafe
        ? items.filter((i) => i.customer_visibility === "Customer Safe")
        : items;

      const quarters = [...new Set(filtered.map((i) => i.release_quarter || "Unscheduled"))].sort();

      quarters.forEach((q, qIdx) => {
        if (qIdx > 0) doc.addPage();
        // Slide background
        doc.setFillColor(15, 15, 25);
        doc.rect(0, 0, 1280, 720, "F");

        // Quarter title
        doc.setTextColor(0, 230, 230);
        doc.setFontSize(36);
        doc.text(q, 60, 80);

        const qItems = filtered.filter((i) => (i.release_quarter || "Unscheduled") === q);
        const byProduct: Record<string, RoadmapItem[]> = {};
        qItems.forEach((i) => (byProduct[i.product_type] ||= []).push(i));

        let y = 130;
        Object.entries(byProduct).forEach(([product, pItems]) => {
          doc.setTextColor(180, 180, 200);
          doc.setFontSize(18);
          doc.text(product, 60, y);
          y += 30;

          pItems.forEach((item) => {
            if (y > 660) { doc.addPage(); doc.setFillColor(15, 15, 25); doc.rect(0, 0, 1280, 720, "F"); y = 60; }
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text(`[${item.priority}] ${item.title}`, 80, y);
            if (item.description) {
              doc.setTextColor(140, 140, 160);
              doc.setFontSize(11);
              const desc = item.description.length > 120 ? item.description.slice(0, 120) + "..." : item.description;
              doc.text(desc, 100, y + 16);
              y += 40;
            } else {
              y += 24;
            }
          });
          y += 10;
        });
      });

      if (quarters.length === 0) {
        doc.setFillColor(15, 15, 25);
        doc.rect(0, 0, 1280, 720, "F");
        doc.setTextColor(140, 140, 160);
        doc.setFontSize(24);
        doc.text("No roadmap items to display", 500, 360);
      }

      doc.save(`Roadmap_Deck_${customerSafe ? "CustomerSafe" : "Internal"}.pdf`);
      toast.success("Deck downloaded!");
    } catch (err) {
      toast.error("Failed to generate deck");
      console.error(err);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generate} className="gap-1.5">
      <FileDown className="w-4 h-4" />
      Generate Deck
    </Button>
  );
}
