import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { useAnimationMachine, ViewState } from "../../../mock-reading-design/AnimationMachine";

export function useScrollSection<T extends HTMLElement = HTMLElement>(viewStateId: ViewState, margin: string = "-40% 0px -40% 0px") {
  const ref = useRef<T>(null);
  const isInView = useInView(ref, { margin: margin as any });
  const setActiveView = useAnimationMachine((s) => s.setActiveView);

  useEffect(() => {
    if (isInView) {
      setActiveView(viewStateId);
    }
  }, [isInView, setActiveView, viewStateId]);

  return { ref, isInView };
}
