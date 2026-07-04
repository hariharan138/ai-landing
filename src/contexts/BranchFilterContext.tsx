import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { getAccessToken } from "@/lib/auth";
import { MOCK_BRANCHES, toLocations, type Location } from "@/lib/locations";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const STORAGE_KEY = "platepilot_branch";

interface BranchFilterState {
  branch: string;
  setBranch: (b: string) => void;
  branches: string[];
  /** branches with their fixed identity color, in stable order */
  locations: Location[];
  isLoadingBranches: boolean;
}

const BranchFilterContext = createContext<BranchFilterState>({
  branch: "all",
  setBranch: () => {},
  branches: [],
  locations: [],
  isLoadingBranches: false,
});

export function BranchFilterProvider({ children }: { children: ReactNode }) {
  const [branch, setBranchState] = useState("all");
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Persist the selected location so a refresh doesn't reset it.
  // Read in an effect (not lazy init) to keep SSR hydration consistent.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBranchState(stored);
  }, []);

  const setBranch = (b: string) => {
    setBranchState(b);
    try {
      localStorage.setItem(STORAGE_KEY, b);
    } catch {
      // storage unavailable — selection just won't persist
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const token = getAccessToken();
        const res = await fetch(`${API_BASE}/api/dashboard/branches`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const items: string[] = data.items || data.branches || [];
          setBranches(items.length ? items : [...MOCK_BRANCHES]);
        } else {
          setBranches([...MOCK_BRANCHES]);
        }
      } catch {
        setBranches([...MOCK_BRANCHES]);
      } finally {
        setIsLoadingBranches(false);
      }
    }
    load();
  }, []);

  // If a stored selection no longer exists in the branch list, fall back to "all"
  useEffect(() => {
    if (!isLoadingBranches && branch !== "all" && branches.length && !branches.includes(branch)) {
      setBranchState("all");
    }
  }, [isLoadingBranches, branches, branch]);

  const locations = useMemo(() => toLocations(branches), [branches]);

  return (
    <BranchFilterContext.Provider
      value={{ branch, setBranch, branches, locations, isLoadingBranches }}
    >
      {children}
    </BranchFilterContext.Provider>
  );
}

export function useBranchFilter() {
  return useContext(BranchFilterContext);
}
