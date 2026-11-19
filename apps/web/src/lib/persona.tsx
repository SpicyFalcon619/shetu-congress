"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import { api, type Person, setApiPersona, unwrap } from "@/lib/api/client";

const KEY = "shetu.persona";

// The chosen persona lives in localStorage (a per-browser convenience) with an in-memory
// fallback for browsers that block storage. useSyncExternalStore keeps React in sync with it.
const listeners = new Set<() => void>();
let memory: string | null = null;

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function write(id: string | null) {
  memory = id;
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the in-memory value still works for this tab */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type PersonaState = {
  people: Person[];
  me: Person | null;
  ready: boolean;
  choose: (id: string | null) => void;
};

const PersonaContext = createContext<PersonaState | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const id = useSyncExternalStore(subscribe, read, () => null);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  setApiPersona(id);

  const { data: people = [] } = useQuery({
    queryKey: ["personas"],
    queryFn: () => unwrap(api.GET("/api/v1/personas")),
  });

  const choose = useCallback(
    (next: string | null) => {
      setApiPersona(next);
      write(next);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "personas" });
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ people, me: people.find((p) => p.id === id) ?? null, ready, choose }),
    [people, id, ready, choose],
  );
  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona(): PersonaState {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}
