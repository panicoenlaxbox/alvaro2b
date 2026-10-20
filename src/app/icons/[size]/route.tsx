import { ImageResponse } from "next/og";

const SIZES: Record<string, { size: number; maskable: boolean }> = {
  "180": { size: 180, maskable: true },
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "512-maskable": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: RouteContext<"/icons/[size]">) {
  const config = SIZES[(await params).size];
  if (!config) return new Response("Not found", { status: 404 });

  const { size, maskable } = config;
  const board = Math.round(size * (maskable ? 0.5 : 0.6));
  const pip = Math.round(board * 0.11);
  const offset = Math.round(board * 0.25);
  const edge = Math.max(2, Math.round(board * 0.05));
  const pips = [
    [-offset, -offset],
    [offset, -offset],
    [0, 0],
    [-offset, offset],
    [offset, offset],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e1b2e",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        <div
          style={{
            width: board,
            height: board,
            position: "relative",
            display: "flex",
            background: "#ef6f4c",
            border: `${edge}px solid #0f0d18`,
            boxShadow: `${Math.round(board * 0.08)}px ${Math.round(board * 0.08)}px 0 #0f0d18`,
            borderRadius: Math.round(board * 0.22),
          }}
        >
          {pips.map(([x, y], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: board / 2 - edge + x - pip,
                top: board / 2 - edge + y - pip,
                width: pip * 2,
                height: pip * 2,
                borderRadius: pip,
                background: "#f6f1e7",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
