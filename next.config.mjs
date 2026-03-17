/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['canvas'],
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

export default nextConfig
