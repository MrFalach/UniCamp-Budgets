import { getUsers } from '@/lib/actions/users'
import { AdminUsersClient } from './AdminUsersClient'

export default async function AdminUsersPage() {
  const users = await getUsers()
  return <AdminUsersClient users={users} />
}
