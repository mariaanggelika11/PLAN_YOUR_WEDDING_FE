import { VendorPage } from "@/features/vendor/VendorPages";
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = ["dashboard"] } = await params;
  return <VendorPage slug={slug} />;
}
