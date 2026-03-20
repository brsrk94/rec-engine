/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['canvas'],
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

export default nextConfig
