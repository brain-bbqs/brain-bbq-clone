import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type EntityType =
  | "investigator"
  | "grant"
  | "publication"
  | "software"
  | "species"
  | "organization"
  | "job"
  | "announcement"
  | "dataset"
  | "benchmark"
  | "ml_model"
  | "protocol";

export interface EntityRef {
  type: EntityType;
  id: string;          // UUID from the entity's own table
  resourceId?: string; // UUID from the resources table (for comments)
  label?: string;      // Display name for breadcrumb
}

interface EntitySummaryContextValue {
  stack: EntityRef[];
  current: EntityRef | null;
  open: (ref: EntityRef) => void;
  close: () => void;
  goBack: () => void;
  isOpen: boolean;
}

const EntitySummaryContext = createContext<EntitySummaryContextValue | null>(null);

export function EntitySummaryProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<EntityRef[]>([]);

  const open = useCallback((ref: EntityRef) => {
    setStack((prev) => [...prev, ref]);
  }, []);

  const close = useCallback(() => {
    setStack([]);
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : []));
  }, []);

  const current = stack.length > 0 ? stack[stack.length - 1] : null;
  const isOpen = stack.length > 0;

  return (
    <EntitySummaryContext.Provider value={{ stack, current, open, close, goBack, isOpen }}>
      {children}
    </EntitySummaryContext.Provider>
  );
}

export function useEntitySummary() {
  const ctx = useContext(EntitySummaryContext);
  if (!ctx) throw new Error("useEntitySummary must be used within EntitySummaryProvider");
  return ctx;
}
