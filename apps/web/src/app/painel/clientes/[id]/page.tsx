import { CustomerDetails } from "../../../../components/CustomerDetails";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CustomerDetails id={id} />; }
