import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { StandaloneGuard } from "@/components/site/StandaloneGuard";

/* The marketing chrome. It lives here rather than in the root layout so the
   signed-in owner app can render without a public nav bar on top of it. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <StandaloneGuard />
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
