import { CustomerPage } from "@/features/customer/CustomerPage";
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = ["dashboard"] } = await params;
  return <CustomerPage slug={slug} />;
}
