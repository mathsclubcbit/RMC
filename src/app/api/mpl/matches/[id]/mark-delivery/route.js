// Deprecated: delivery-scoped operations moved to /api/mpl/deliveries/[id]/mark
// This stub exists for backward compatibility only.
export async function POST(request, { params }) {
    const { id } = await params;
    const url = new URL(request.url);
    const base = `${url.origin}/api/mpl/deliveries/${id}/mark`;
    return fetch(base, { method: 'POST', headers: request.headers, body: request.body });
}
