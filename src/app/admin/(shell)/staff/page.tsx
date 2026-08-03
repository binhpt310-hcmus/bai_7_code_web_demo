import { getUsers } from "@/lib/repo";
import { StaffManagementClient } from "@/components/admin/StaffManagementClient";

export default async function AdminStaffPage() {
  const users = (await getUsers()).map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));
  return <StaffManagementClient initialUsers={users} />;
}
