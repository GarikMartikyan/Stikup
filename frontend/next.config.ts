import type {NextConfig} from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3131";

const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.31.95', '192.168.31.179', 'localhost', '127.0.0.1', '*.trycloudflare.com'],
    experimental: {
        optimizePackageImports: ['lucide-react'],
        preloadEntriesOnStart: false,
        turbopackFileSystemCacheForDev: false,
        turbopackFileSystemCacheForBuild: false,
    },
    async rewrites() {
        return [
            { source: "/auth/:path*", destination: `${backendUrl}/auth/:path*` },
            { source: "/api/:path*",  destination: `${backendUrl}/:path*`      },
        ];
    },
    async headers() {
        return [
            {
                // Allow Telegram Desktop/Web to iframe-embed only the Mini App
                // entry route and its sub-routes.
                source: "/app",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors 'self' https://*.telegram.org",
                    },
                ],
            },
            {
                source: "/app/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors 'self' https://*.telegram.org",
                    },
                ],
            },
            {
                // All other routes: deny third-party framing entirely.
                source: "/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors 'none'",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
