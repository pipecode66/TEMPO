/** @type {import('next').NextConfig} */
const backendProxyUrl = process.env.TEMPO_BACKEND_PROXY_URL?.replace(/\/$/, "")

const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (!backendProxyUrl) {
      return []
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendProxyUrl}/api/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${backendProxyUrl}/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
