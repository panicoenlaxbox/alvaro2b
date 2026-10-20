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
          background: "#b4462b",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        <div
          style={{
            width: board,
            height: board,
            position: "relative",
            display: "flex",
            background: "#faf7f2",
            borderRadius: Math.round(board * 0.22),
          }}
        >
          {pips.map(([x, y], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: board / 2 + x - pip,
                top: board / 2 + y - pip,
                width: pip * 2,
                height: pip * 2,
                borderRadius: pip,
                background: "#b4462b",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
