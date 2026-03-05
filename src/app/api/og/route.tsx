import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  // Fetch the logo
  const logoData = await fetch(
    new URL('/logomark.png', 'https://newsphere.xyz')
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0f0f4 0%, #e8e8f0 50%, #f0f0f4 100%)',
          position: 'relative',
        }}
      >
        {/* Iridescent blob effect */}
        <div
          style={{
            position: 'absolute',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(236,72,153,0.2) 30%, rgba(249,115,22,0.15) 50%, rgba(59,130,246,0.1) 70%, transparent 100%)',
            filter: 'blur(60px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Second blob for more depth */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(139,92,246,0.15) 40%, transparent 100%)',
            filter: 'blur(40px)',
            top: '40%',
            left: '45%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <img
            src={`data:image/png;base64,${Buffer.from(logoData).toString('base64')}`}
            width={120}
            height={120}
            style={{
              marginBottom: '24px',
              filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.8))',
            }}
          />
          
          {/* Title */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 600,
              color: '#a3a3a3',
              letterSpacing: '0.02em',
              marginBottom: '8px',
            }}
          >
            NewSphere
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: 'rgba(163,163,163,0.7)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Agentic Creative Agency
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
