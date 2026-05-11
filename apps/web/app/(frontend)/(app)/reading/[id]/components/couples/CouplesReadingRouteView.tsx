"use client";

import { useMemo, type ReactElement } from "react";
import { toCouplesViewModel } from "@/app/lib/couples-viewmodel";
import CouplesReadingView from "./CouplesReadingView";

interface CouplesReadingRouteViewProps {
  reading: any;
  narrative?: any;
  paramId?: string;
}

export default function CouplesReadingRouteView({
  reading,
  narrative,
  paramId,
}: CouplesReadingRouteViewProps): ReactElement {
  const vm = useMemo(
    () => toCouplesViewModel({ ...reading, narrative }),
    [reading, narrative],
  );

  return <CouplesReadingView vm={vm} paramId={paramId} />;
}
