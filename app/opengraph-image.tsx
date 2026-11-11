import { ImageResponse } from "next/og";

export const alt = "Archicareer — Good Work Deserves to Be Seen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f4f0e8", color: "#171717", fontFamily: "Arial, sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 25, fontWeight: 700, letterSpacing: 3 }}>
                <div style={{ width: 42, height: 42, background: "#356de3", clipPath: "polygon(0 0,100% 0,50% 35%,0 65%)" }} />
                ARCHICAREER
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
                <div style={{ color: "#c84b3c", fontSize: 20, fontWeight: 700, letterSpacing: 5 }}>ARCHITECTURE · DESIGN · CONSTRUCTION</div>
                <div style={{ fontSize: 72, lineHeight: 1.04, fontWeight: 700, letterSpacing: -3 }}>Good Work Deserves to Be Seen.</div>
                <div style={{ fontSize: 27, color: "#5e5b55" }}>Discover portfolios, connect with professionals, and find your next opportunity.</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #171717", paddingTop: 20, fontSize: 18, letterSpacing: 2 }}>
                <span>BUILT ENVIRONMENT PROFESSIONAL NETWORK</span><span>ARCHICAREER.COM.NG</span>
            </div>
        </div>,
        { ...size },
    );
}
