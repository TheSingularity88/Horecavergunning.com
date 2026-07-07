import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Favicon: amber rounded square with an "H" — matches the brand mark.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f59e0b',
          color: '#0f172a',
          fontSize: 22,
          fontWeight: 800,
          borderRadius: 7,
          fontFamily: 'sans-serif',
        }}
      >
        H
      </div>
    ),
    { ...size }
  );
}
