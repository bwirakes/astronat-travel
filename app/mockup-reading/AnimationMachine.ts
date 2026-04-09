import { create } from "zustand";

export type ViewState = 
  | "intro"
  | "planet-sun"
  | "planet-mercury"
  | "planet-jupiter"
  | "planet-pluto"
  | "final-chart"
  | "map-intro"
  | "acg-pluto-dsc"
  | "acg-sun-ic"
  | "report";

const VIEW_ORDER: ViewState[] = [
  "intro",
  "planet-sun",
  "planet-mercury",
  "planet-jupiter",
  "planet-pluto",
  "final-chart",
  "map-intro",
  "acg-pluto-dsc",
  "acg-sun-ic",
  "report"
];

interface AnimationState {
  activeView: ViewState;
  activeIndex: number;
  setActiveView: (view: ViewState) => void;
  wheelOpacity: number;
  mapOpacity: number;
}

export const useAnimationMachine = create<AnimationState>((set) => ({
  activeView: "intro",
  activeIndex: 0,
  wheelOpacity: 1,
  mapOpacity: 0,
  setActiveView: (view) => set(() => {
    const index = VIEW_ORDER.indexOf(view);
    let wheelOpacity = 1;
    let mapOpacity = 0;

    if (index <= 5) { // intro through final-chart
      wheelOpacity = 1;
      mapOpacity = 0;
    } else if (index >= 6 && index <= 8) { // map through acg
      wheelOpacity = 0;
      mapOpacity = 1;
    } else if (index === 9) { // report
      wheelOpacity = 0;
      mapOpacity = 0;
    }

    return { activeView: view, activeIndex: index, wheelOpacity, mapOpacity };
  }),
}));
