import { AdminResource } from "../../../components/AdminResource";
export default function BranchesPage() { return <AdminResource title="Filiais" endpoint="/branches" fields={[{ name: "code", label: "Código" }, { name: "name", label: "Nome" }, { name: "city", label: "Cidade" }, { name: "state", label: "UF" }]} />; }
