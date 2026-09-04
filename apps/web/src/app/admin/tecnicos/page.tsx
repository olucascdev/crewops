import { AdminResource } from "../../../components/AdminResource";
export default function TechniciansPage() { return <AdminResource title="Técnicos" endpoint="/technicians" fields={[{ name: "userId", label: "ID do usuário" }, { name: "branchId", label: "ID da filial" }, { name: "phone", label: "Telefone" }, { name: "employeeId", label: "Matrícula" }]} />; }
