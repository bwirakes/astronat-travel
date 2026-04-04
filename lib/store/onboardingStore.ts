import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TravelType = 'trip' | 'relocation';

export interface OnboardingData {
  firstName: string;
  birthDate: string;
  birthTime: string;
  birthTimeKnown: boolean;
  birthCity: string;
  birthLat?: number;
  birthLon?: number;
  lifeGoals: string[];
  destination: string;
  destLat?: number;
  destLon?: number;
  travelDate: string;
  travelType: TravelType;
  
  // Actions
  setFirstName: (name: string) => void;
  setBirthDate: (date: string) => void;
  setBirthTime: (time: string) => void;
  setBirthTimeKnown: (known: boolean) => void;
  setBirthCity: (city: string) => void;
  setBirthCoords: (lat: number, lon: number) => void;
  toggleLifeGoal: (goal: string) => void;
  setDestination: (dest: string) => void;
  setDestCoords: (lat: number, lon: number) => void;
  setTravelDate: (date: string) => void;
  setTravelType: (type: TravelType) => void;
  reset: () => void;
}

const initialState = {
  firstName: '',
  birthDate: '',
  birthTime: '',
  birthTimeKnown: true,
  birthCity: '',
  lifeGoals: [],
  destination: '',
  travelDate: '',
  travelType: 'trip' as TravelType,
};

export const useOnboardingStore = create<OnboardingData>()(
  persist(
    (set) => ({
      ...initialState,
      setFirstName: (name) => set({ firstName: name }),
      setBirthDate: (date) => set({ birthDate: date }),
      setBirthTime: (time) => set({ birthTime: time }),
      setBirthTimeKnown: (known) => set({ birthTimeKnown: known }),
      setBirthCity: (city) => set({ birthCity: city }),
      setBirthCoords: (lat, lon) => set({ birthLat: lat, birthLon: lon }),
      toggleLifeGoal: (goal) => set((state) => ({
        lifeGoals: state.lifeGoals.includes(goal)
          ? state.lifeGoals.filter(g => g !== goal)
          : state.lifeGoals.length < 3 ? [...state.lifeGoals, goal] : state.lifeGoals
      })),
      setDestination: (dest) => set({ destination: dest }),
      setDestCoords: (lat, lon) => set({ destLat: lat, destLon: lon }),
      setTravelDate: (date) => set({ travelDate: date }),
      setTravelType: (type) => set({ travelType: type }),
      reset: () => set(initialState),
    }),
    {
      name: 'astronat-onboarding-storage',
    }
  )
);
