import type {NextConfig} from "next";
import createNextIntlPlugin from "next-intl/plugin";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3131";

const nextConfig: NextConfig = {
    allowedDevOrigins: ['*.*', '*.*.*', '*.*.*.*', '*.*.*.*.*', '*.*.*.*.*.*'],
    async rewrites() {
        return [
            { source: "/auth/:path*", destination: `${backendUrl}/auth/:path*` },
            { source: "/api/:path*",  destination: `${backendUrl}/:path*`      },
        ];
    },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
