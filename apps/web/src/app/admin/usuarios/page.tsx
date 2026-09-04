import { AdminResource } from "../../../components/AdminResource";
export default function UsersPage() { return <AdminResource title="Usuários" endpoint="/users" fields={[{ name: "name", label: "Nome" }, { name: "email", label: "E-mail", type: "email" }, { name: "role", label: "Perfil" }, { name: "password", label: "Senha inicial", type: "password" }]} />; }
