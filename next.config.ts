import type { NextConfig } from "next";

// All menu photography is self-hosted under public/menu-images (downloaded
// once from verified sources - see seed.ts), so no remote image patterns are
// needed: it avoids depending on a third party's uptime/rate limits at runtime.
const nextConfig: NextConfig = {};

export default nextConfig;
