import { ChefHat, Database, Truck, CloudSun, FileSpreadsheet, CreditCard } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "Recipes",
    date: "Menu",
    content:
      "Import and sync your recipe database. Auto-calculate food costs, portion sizes, and nutritional info per dish.",
    category: "Menu",
    icon: ChefHat,
    relatedIds: [2, 5],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 2,
    title: "Tally",
    date: "ERP",
    content:
      "Sync inventory, purchases, and financial data directly from Tally. Real-time stock updates without manual entry.",
    category: "ERP",
    icon: Database,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Suppliers",
    date: "Procurement",
    content:
      "Manage vendor catalogs, purchase orders, and pricing. Compare supplier rates and automate reordering.",
    category: "Procurement",
    icon: Truck,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 75,
  },
  {
    id: 4,
    title: "Weather",
    date: "External",
    content:
      "Integrate live weather data to predict demand, adjust inventory for seasonal trends, and optimize delivery ops.",
    category: "External",
    icon: CloudSun,
    relatedIds: [3, 6],
    status: "completed" as const,
    energy: 88,
  },
  {
    id: 5,
    title: "CSV",
    date: "Import",
    content:
      "Bulk-import any data via CSV — menu items, inventory counts, employee records, or historical sales.",
    category: "Import",
    icon: FileSpreadsheet,
    relatedIds: [1, 6],
    status: "completed" as const,
    energy: 92,
  },
  {
    id: 6,
    title: "POS",
    date: "Sales",
    content:
      "Connect any POS system to stream live orders, track sales patterns, and reconcile end-of-day settlements.",
    category: "Sales",
    icon: CreditCard,
    relatedIds: [4, 5],
    status: "in-progress" as const,
    energy: 80,
  },
];

export function IntegrationsTimeline() {
  return (
    <div className="w-full">
      <RadialOrbitalTimeline timelineData={timelineData} className="bg-[#111113]" />
    </div>
  );
}
