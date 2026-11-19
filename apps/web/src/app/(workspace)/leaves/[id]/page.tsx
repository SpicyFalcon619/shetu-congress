import { Suspense } from "react";

import { LeaveView } from "@/components/leave/leave-view";

type Props = { params: Promise<{ id: string }> };

export default function LeavePage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading the leave…</p>}>
      <Leave params={params} />
    </Suspense>
  );
}

async function Leave({ params }: Props) {
  const { id } = await params;
  return <LeaveView id={id} />;
}
