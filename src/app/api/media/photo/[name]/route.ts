import { NextResponse } from "next/server";
import { APPS_LIVE } from "@/lib/flags";
import { readPhoto } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* A photo from a visit or a repair. The address is the permission (see
   keepImage in lib/media): it only appears on a page its viewer may see.
   An address never changes what it points at, so the browser keeps it. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!APPS_LIVE) return none();
  const got = await readPhoto((await params).name);
  if (!got) return none();
  return new NextResponse(got.body, {
    headers: {
      "content-type": got.type,
      "cache-control": "private, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}

const none = () => NextResponse.json({ error: "Not found." }, { status: 404 });
