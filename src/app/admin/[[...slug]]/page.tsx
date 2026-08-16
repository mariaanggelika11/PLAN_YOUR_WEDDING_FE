import { AdminPage } from "@/features/admin/AdminPage";
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = ["dashboard"] } = await params;
  return <AdminPage slug={slug} />;
}
