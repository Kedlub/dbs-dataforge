import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		dangerouslyAllowSVG: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'placehold.co',
				port: '',
				pathname: '/**'
			}
		]
	},
	output: 'standalone',
	eslint: {
		ignoreDuringBuilds: true
	}
	/* config options here */
};

export default nextConfig;
