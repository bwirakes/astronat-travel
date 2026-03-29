import HomeClient from "./HomeClient";
import { getSunSign } from "../lib/planet-data";

export default async function HomePage() {
    // MOCK DATA since Supabase is not yet set up for MVP
    const profile = {
        first_name: "Brandon",
        birth_date: "1995-08-15"
    };

    const birthDate = new Date(profile.birth_date);
    const sunSignData = getSunSign(birthDate.getMonth() + 1, birthDate.getDate());

    const mockSearches = [
        { id: 1, destination: "Tokyo, Japan", score: 85, travel_date: "2026-05-12" },
        { id: 2, destination: "London, UK", score: 60, travel_date: "2026-07-22" },
        { id: 3, destination: "Berlin, Germany", score: 40, travel_date: "2026-08-05" }
    ];

    return (
        <HomeClient 
            profile={profile} 
            sunSignData={sunSignData} 
            recentSearches={mockSearches} 
        />
    );
}
