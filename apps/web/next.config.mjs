/** @type {import('next').NextConfig} */

// The web PWA is useless without the API, so a missing public env var is a hard
// failure at build/start rather than a silent inlined `undefined`.
const REQUIRED_PUBLIC = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WS_URL"];

function assertEnv() {
  const missing = REQUIRED_PUBLIC.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `[crewops-web] Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Set them in your environment or a .env file (see .env.example).",
    );
  }
}

assertEnv();

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@crewops/shared"],
};

export default nextConfig;
