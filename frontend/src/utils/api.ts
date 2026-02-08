const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export type SignupPayload = {
  username: string
  email: string
  password: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type User = {
  id: number
  username: string
  email: string
  is_admin: boolean
  created_at: string
}

export type UserSummary = {
  user_id: number
  username: string
  role: string
  is_banned: boolean
  joined_at: string
}

export type Group = {
  id: number
  name: string
  description: string | null
  created_by: number
  created_at: string
  is_member?: boolean
}

export type Message = {
  id: number
  group_id: number
  user_id: number
  sender_username: string
  content: string
  created_at: string
}

export async function signup(payload: SignupPayload) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Signup failed')
  }

  return response.json()
}

export async function login(payload: LoginPayload) {
  const form = new URLSearchParams()
  form.append('username', payload.username)
  form.append('password', payload.password)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Login failed')
  }

  return response.json()
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getMe(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Unauthorized')
  }

  return response.json()
}

export async function listGroups(token: string): Promise<Group[]> {
  const response = await fetch(`${API_URL}/groups`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Failed to load groups')
  }

  return response.json()
}

export async function createGroup(token: string, payload: { name: string; description?: string }) {
  const response = await fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create group')
  }

  return response.json()
}

export async function updateGroup(
  token: string,
  groupId: number,
  payload: { name: string; description?: string },
) {
  const response = await fetch(`${API_URL}/groups/${groupId}`, {
    method: 'PUT',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update group')
  }

  return response.json()
}

export async function deleteGroup(token: string, groupId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete group')
  }

  return response.json()
}

export async function listMessages(token: string, groupId: number): Promise<Message[]> {
  const response = await fetch(`${API_URL}/groups/${groupId}/messages`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await response.text()
    try {
      const parsed = JSON.parse(message)
      throw new Error(parsed.detail || 'Failed to load messages')
    } catch {
      throw new Error(message || 'Failed to load messages')
    }
  }

  return response.json()
}

export async function sendMessage(
  token: string,
  groupId: number,
  content: string,
): Promise<Message> {
  const response = await fetch(`${API_URL}/groups/${groupId}/messages`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to send message')
  }

  return response.json()
}

export async function listAllGroups(token: string): Promise<Group[]> {
  const response = await fetch(`${API_URL}/groups/all`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Failed to load groups')
  }

  return response.json()
}

export async function joinGroup(token: string, groupId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}/join`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to join group')
  }

  return response.json()
}

export async function listGroupMembers(token: string, groupId: number): Promise<UserSummary[]> {
  const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await response.text()
    try {
      const parsed = JSON.parse(message)
      throw new Error(parsed.detail || 'Failed to load members')
    } catch {
      throw new Error(message || 'Failed to load members')
    }
  }

  return response.json()
}

export async function banGroupMember(token: string, groupId: number, userId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}/members/${userId}/ban`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to ban member')
  }

  return response.json()
}

export async function unbanGroupMember(token: string, groupId: number, userId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}/members/${userId}/unban`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to unban member')
  }

  return response.json()
}