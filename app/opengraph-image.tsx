import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'HorecaVergunning.com — horecavergunningen geregeld tegen een vast tarief';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f172a',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <span style={{ color: '#ffffff', fontSize: 30, fontWeight: 700 }}>
            Horeca<span style={{ color: '#f59e0b' }}>Vergunning</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ color: '#ffffff', fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>
            Uw horecavergunning
            <br />
            <span style={{ color: '#f59e0b' }}>geregeld tegen een vast tarief.</span>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 28 }}>
            Exploitatievergunning · Alcoholvergunning · Terras · Bibob — Amsterdam
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['Vaste prijs per vergunning', 'Reactie binnen 1 werkdag', 'U betaalt na goedkeuring'].map(
            (chip) => (
              <div
                key={chip}
                style={{
                  color: '#e2e8f0',
                  fontSize: 22,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 999,
                  padding: '10px 20px',
                }}
              >
                {chip}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
