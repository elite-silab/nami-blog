export function GET() {
  return Response.json(
    { status: "ok", service: "nami-blog" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
