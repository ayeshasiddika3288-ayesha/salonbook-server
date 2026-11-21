// Centralised list of browser origins allowed to talk to the API.
// CORS and Better Auth must agree on this list, otherwise the browser gets
// a CORS error while Better Auth answers "Invalid origin".

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://salonbook-client-six.vercel.app",
];

export const normalizeOrigin = (value) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().replace(/\/+$/, "");

  return trimmed || null;
};

export const getAllowedOrigins = () => {
  const fromEnv = (process.env.CLIENT_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  return [...new Set([...fromEnv, ...DEFAULT_ORIGINS])];
};
