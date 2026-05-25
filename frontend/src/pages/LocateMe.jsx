import React, { useEffect } from 'react';

const LocateMe = () => {
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_API_KEY';

  useEffect(() => {
    // Initialize on mount
    const locateBtn = document.getElementById('locateBtn');
    if (locateBtn) {
      locateBtn.onclick = getLocation;
    }
  }, []);

  const getLocation = async () => {
    const btn = document.getElementById('locateBtn');
    const status = document.getElementById('status');
    const pulse = document.getElementById('pulseRing');

    if (!navigator.geolocation) {
      status.textContent = 'ERROR: Geolocation not supported by this browser.';
      status.className = 'error';
      return;
    }

    btn.disabled = true;
    pulse.classList.add('show');
    status.className = '';
    status.textContent = 'Acquiring GPS signal...';

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 30000, // Increased to 30 seconds for better accuracy
      maximumAge: 0
    });
  };

  const onSuccess = async (pos) => {
    const { latitude, longitude, accuracy, altitude } = pos.coords;

    document.getElementById('lat').textContent = latitude.toFixed(8);
    document.getElementById('lng').textContent = longitude.toFixed(8);
    document.getElementById('acc').textContent = `±${Math.round(accuracy)} meters`;
    document.getElementById('alt').textContent = altitude ? `${Math.round(altitude)} m` : 'N/A';
    document.getElementById('mapLink').href = `https://www.google.com/maps?q=${latitude},${longitude}&z=18`;
    document.getElementById('timestamp').textContent = `Captured: ${new Date().toLocaleString()}`;

    // Accuracy bar: 100% = ≤5m, 0% = ≥200m
    const pct = Math.max(0, Math.min(100, ((200 - accuracy) / 195) * 100));
    setTimeout(() => {
      document.getElementById('accBar').style.width = pct + '%';
    }, 100);

    document.getElementById('results').classList.add('show');
    document.getElementById('status').textContent = 'Location acquired.';
    document.getElementById('pulseRing').classList.remove('show');
    document.getElementById('locateBtn').disabled = false;

    // Embed Google Maps iframe
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=18&output=embed`;
    document.getElementById('mapFrame').src = mapsUrl;
    document.getElementById('mapLinkFull').href = `https://www.google.com/maps?q=${latitude},${longitude}&z=18`;
    document.getElementById('mapCard').classList.add('show');

    // Reverse geocode via Google
    document.getElementById('address').textContent = 'Resolving address...';
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      const addr = data.results?.[0]?.formatted_address || 'Address not found';
      document.getElementById('address').textContent = addr;
    } catch (err) {
      console.error('Geocoding error:', err);
      document.getElementById('address').textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
  };

  const onError = (err) => {
    const status = document.getElementById('status');
    const messages = {
      1: 'PERMISSION DENIED — Please allow location access.',
      2: 'POSITION UNAVAILABLE — Could not determine location.',
      3: 'TIMEOUT — GPS took too long. Try again.'
    };
    status.textContent = messages[err.code] || 'Unknown error.';
    status.className = 'error';
    document.getElementById('pulseRing').classList.remove('show');
    document.getElementById('locateBtn').disabled = false;
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0f;
          --surface: #111118;
          --border: #1e1e2e;
          --accent: #00ffe0;
          --accent2: #7b61ff;
          --text: #e8e8f0;
          --muted: #55556a;
          --mono: 'Space Mono', monospace;
          --sans: 'Syne', sans-serif;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-x: hidden;
        }

        /* Animated grid background */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .glow-orb {
          position: fixed;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,255,224,0.06) 0%, transparent 70%);
          top: -100px; left: -100px;
          pointer-events: none;
          z-index: 0;
          animation: orbFloat 8s ease-in-out infinite;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 80px); }
        }

        .locateme-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 700px;
        }

        header {
          margin-bottom: 3rem;
          text-align: left;
        }

        .logo {
          font-size: 0.7rem;
          font-family: var(--mono);
          color: var(--accent);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        h1 {
          font-size: clamp(2.5rem, 6vw, 3.8rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        h1 span {
          color: var(--accent);
          position: relative;
        }

        .subtitle {
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 0.75rem;
          letter-spacing: 0.05em;
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .card.active::after { opacity: 1; }

        button#locateBtn {
          width: 100%;
          padding: 1rem 2rem;
          background: transparent;
          border: 1.5px solid var(--accent);
          color: var(--accent);
          font-family: var(--mono);
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: color 0.3s, background 0.3s;
        }

        button#locateBtn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
          z-index: -1;
        }

        button#locateBtn:hover { color: var(--bg); }
        button#locateBtn:hover::before { transform: scaleX(1); }
        button#locateBtn:disabled { opacity: 0.4; cursor: not-allowed; }
        button#locateBtn:disabled:hover { color: var(--accent); }
        button#locateBtn:disabled:hover::before { transform: scaleX(0); }

        .pulse-ring {
          display: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid var(--accent);
          animation: pulse 1s ease-out infinite;
          margin: 0 auto 1.5rem;
        }

        .pulse-ring.show { display: block; }

        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        #status {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--muted);
          text-align: center;
          min-height: 1.5rem;
          margin-top: 1rem;
          letter-spacing: 0.05em;
        }

        #status.error { color: #ff6b6b; }

        .results { display: none; }
        .results.show { display: block; }

        .result-row {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--border);
        }

        .result-row:last-child { border-bottom: none; }

        .result-label {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          min-width: 90px;
          padding-top: 0.1rem;
        }

        .result-value {
          font-family: var(--mono);
          font-size: 0.85rem;
          color: var(--text);
          word-break: break-all;
          flex: 1;
        }

        .result-value.highlight {
          color: var(--accent);
          font-weight: 700;
        }

        .accuracy-bar-wrap {
          flex: 1;
        }

        .accuracy-bar {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          margin-top: 0.4rem;
          overflow: hidden;
        }

        .accuracy-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          border-radius: 2px;
          width: 0;
          transition: width 1s ease;
        }

        .map-link {
          display: inline-block;
          margin-top: 1.5rem;
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--accent2);
          text-decoration: none;
          letter-spacing: 0.1em;
          border-bottom: 1px solid var(--accent2);
          padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }

        .map-link:hover { color: var(--accent); border-color: var(--accent); }

        .timestamp {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          margin-top: 1.5rem;
          text-align: right;
        }

        footer {
          margin-top: 2rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-align: center;
        }

        /* Map card */
        .map-card {
          display: none;
          padding: 0;
          overflow: hidden;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .map-card.show { display: block; }

        .map-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 1.2rem;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }

        .map-card-header span {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .map-card-header a {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--accent2);
          text-decoration: none;
          letter-spacing: 0.08em;
          border-bottom: 1px solid var(--accent2);
          padding-bottom: 1px;
          transition: color 0.2s, border-color 0.2s;
        }

        .map-card-header a:hover { color: var(--accent); border-color: var(--accent); }

        #mapFrame {
          width: 100%;
          height: 340px;
          border: none;
          display: block;
        }

        .map-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--accent);
          margin-right: 6px;
          animation: blink 1.4s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>

      <div className="glow-orb"></div>

      <div className="locateme-container">
        <header>
          <div className="logo">// geo · locate</div>
          <h1>Find Your<br/><span>Exact Location</span></h1>
          <p className="subtitle">HIGH_ACCURACY · GPS · REVERSE_GEOCODE</p>
        </header>

        <div className="card" id="mainCard">
          <div className="pulse-ring" id="pulseRing"></div>
          <button id="locateBtn">⌖ Extract My Location</button>
          <div id="status"></div>
        </div>

        <div className="card active results" id="results">
          <div className="result-row">
            <span className="result-label">Address</span>
            <span className="result-value highlight" id="address">—</span>
          </div>
          <div className="result-row">
            <span className="result-label">Latitude</span>
            <span className="result-value" id="lat">—</span>
          </div>
          <div className="result-row">
            <span className="result-label">Longitude</span>
            <span className="result-value" id="lng">—</span>
          </div>
          <div className="result-row">
            <span className="result-label">Accuracy</span>
            <div className="accuracy-bar-wrap">
              <span className="result-value" id="acc">—</span>
              <div className="accuracy-bar"><div className="accuracy-fill" id="accBar"></div></div>
            </div>
          </div>
          <div className="result-row">
            <span className="result-label">Altitude</span>
            <span className="result-value" id="alt">—</span>
          </div>

          <a className="map-link" id="mapLink" href="#" target="_blank">↗ Open in Google Maps</a>
          <div className="timestamp" id="timestamp"></div>
        </div>

        {/* Embedded map */}
        <div className="card active map-card" id="mapCard">
          <div className="map-card-header">
            <span><span className="map-dot"></span>Live Map Preview</span>
            <a id="mapLinkFull" href="#" target="_blank">↗ Open Full Map</a>
          </div>
          <iframe id="mapFrame" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
        </div>

        <footer>USES DEVICE GPS · DATA STAYS ON YOUR DEVICE</footer>
      </div>
    </>
  );
};

export default LocateMe;
