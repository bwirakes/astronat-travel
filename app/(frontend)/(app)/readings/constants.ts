// Shared constants for the /readings route. Lives outside ReadingsClient.tsx
// (a "use client" module) so the server component in page.tsx can import
// PAGE_SIZE without going through the client-module boundary. When a server
// component imports a const from a "use client" file, the value is stripped
// at build time — page.tsx was getting `PAGE_SIZE === undefined` in prod,
// which made the .range(NaN, NaN) call silently return zero rows while
// count: 'exact' still came back correctly. Hence "1-0 OF 63" on the UI.
export const PAGE_SIZE = 10;
