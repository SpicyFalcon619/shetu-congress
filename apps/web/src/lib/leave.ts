"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type LeaveDetail, unwrap } from "@/lib/api/client";

export function useLeave(id: string, personaId: string | undefined) {
  return useQuery({
    queryKey: ["leave", id, personaId],
    queryFn: () => unwrap(api.GET("/api/v1/leaves/{leave_id}", { params: { path: { leave_id: id } } })),
    enabled: Boolean(personaId),
  });
}

export function useChanges(id: string, personaId: string | undefined) {
  return useQuery({
    queryKey: ["changes", id, personaId],
    queryFn: () =>
      unwrap(api.GET("/api/v1/leaves/{leave_id}/changes", { params: { path: { leave_id: id } } })),
    enabled: Boolean(personaId),
  });
}

export function useReturn(id: string, personaId: string | undefined) {
  return useQuery({
    queryKey: ["return", id, personaId],
    queryFn: () =>
      unwrap(api.GET("/api/v1/leaves/{leave_id}/return", { params: { path: { leave_id: id } } })),
    enabled: Boolean(personaId),
  });
}

/** A mutation whose result is the updated leave; it replaces the cached copy. */
export function useLeaveAction<V>(
  id: string,
  personaId: string | undefined,
  fn: (v: V) => Promise<LeaveDetail>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(["leave", id, personaId], data);
      void qc.invalidateQueries({ queryKey: ["return", id] });
      void qc.invalidateQueries({ queryKey: ["changes", id] });
      void qc.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
