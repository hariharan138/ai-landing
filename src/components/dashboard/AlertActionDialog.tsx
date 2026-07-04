import { CheckCircle, ShieldAlert } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AlertActionDialog({
  open,
  onOpenChange,
  activeCount = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-border bg-card shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-foreground">
                Data Reconciliation Center
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Review discrepancies between POS sales and Tally accounting records.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {activeCount > 0 ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive-soft/10 p-3.5">
              <p className="text-[11.5px] leading-relaxed text-foreground">
                <span className="font-extrabold text-destructive">
                  {activeCount} alert{activeCount === 1 ? "" : "s"}
                </span>{" "}
                detected from incomplete or mismatched records. Review POS Sales and Tally Vouchers
                to resolve them.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-success/20 bg-success-soft/10 p-3.5 flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="text-[11.5px] leading-relaxed text-foreground">
                <span className="font-extrabold text-success">All clear.</span> No pending
                discrepancies in the current data set.
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-secondary/20 p-6 text-center">
            <p className="text-[12px] font-semibold text-foreground">
              No detailed reconciliation items
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Individual mismatch records will appear here once a reconciliation API is connected.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-[11.5px]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
