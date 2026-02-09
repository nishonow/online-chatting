const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export type SignupPayload = {
  username: string
  full_name?: string
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
  full_name: string | null
  email: string
  is_admin: boolean
  created_at: string
}

export type DirectUser = {
  id: number
  username: string
  full_name: string | null
}

export type UserSummary = {
  user_id: number
  username: string
  full_name: string | null
  role: string
  is_banned: boolean
  joined_at: string
}


export type DirectMessage = {
  id: number
  thread_id: number
  user_id: number
  sender_username: string
  sender_name: string
  content: string
  created_at: string
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
  sender_name: string
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
    const message = await readErrorMessage(response, 'Signup failed')
    throw new Error(message)
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
    const message = await readErrorMessage(response, 'Login failed')
    throw new Error(message)
  }

  return response.json()
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  const text = await response.text()
  if (!text) {
    return fallback
  }

  try {
    const parsed = JSON.parse(text)
    if (parsed?.detail) {
      if (typeof parsed.detail === 'string') {
        return parsed.detail
      }
      if (Array.isArray(parsed.detail)) {
        const messages = parsed.detail
          .map((item) => (typeof item?.msg === 'string' ? item.msg : null))
          .filter(Boolean)
        if (messages.length > 0) {
          return messages.join('; ')
        }
      }
      return JSON.stringify(parsed.detail)
    }
    if (parsed?.message) {
      if (typeof parsed.message === 'string') {
        return parsed.message
      }
      return JSON.stringify(parsed.message)
    }
  } catch {
    // Ignore parsing errors and return raw text.
  }

  return text
}

export async function getMe(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Unauthorized')
    throw new Error(message)
  }

  return response.json()
}

export async function listGroups(token: string): Promise<Group[]> {
  const response = await fetch(`${API_URL}/groups`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load groups')
    throw new Error(message)
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
    const message = await readErrorMessage(response, 'Failed to create group')
    throw new Error(message)
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
    const message = await readErrorMessage(response, 'Failed to update group')
    throw new Error(message)
  }

  return response.json()
}

export async function deleteGroup(token: string, groupId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to delete group')
    throw new Error(message)
  }

  return response.json()
}

export async function listMessages(token: string, groupId: number): Promise<Message[]> {
  const response = await fetch(`${API_URL}/groups/${groupId}/messages`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load messages')
    throw new Error(message)
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
    const message = await readErrorMessage(response, 'Failed to send message')
    throw new Error(message)
  }

  return response.json()
}

export async function listAllGroups(token: string): Promise<Group[]> {
  const response = await fetch(`${API_URL}/groups/all`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load groups')
    throw new Error(message)
  }

  return response.json()
}

export async function joinGroup(token: string, groupId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}/join`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to join group')
    throw new Error(message)
  }

  return response.json()
}

export async function getUserSummary(token: string, userId: number): Promise<DirectUser> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load user')
    throw new Error(message)
  }

  return response.json()
}

export async function getUserByUsername(token: string, username: string): Promise<DirectUser> {
  const response = await fetch(`${API_URL}/users/by-username/${username}`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load user')
    throw new Error(message)
  }

  return response.json()
}

export async function updateMe(
  token: string,
  payload: {
    full_name?: string | null
    username?: string | null
    email?: string | null
    password?: string | null
  },
): Promise<User> {
  const response = await fetch(`${API_URL}/users/me`, {
    method: 'PUT',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to update profile')
    throw new Error(message)
  }

  return response.json()
}

export async function listGroupMembers(token: string, groupId: number): Promise<UserSummary[]> {
  const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load members')
    throw new Error(message)
  }

  return response.json()
}

export async function listDirectUsers(token: string): Promise<DirectUser[]> {
  const response = await fetch(`${API_URL}/dm/users`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load direct message users')
    throw new Error(message)
  }

  return response.json()
}

export async function listDirectMessages(
  token: string,
  username: string,
): Promise<DirectMessage[]> {
  const response = await fetch(`${API_URL}/dm/with/${username}/messages`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load messages')
    throw new Error(message)
  }

  return response.json()
}

export async function sendDirectMessage(
  token: string,
  username: string,
  content: string,
): Promise<DirectMessage> {
  const response = await fetch(`${API_URL}/dm/with/${username}/messages`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to send message')
    throw new Error(message)
  }

  return response.json()
}
export async function banGroupMember(token: string, groupId: number, userId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}/members/${userId}/ban`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to ban member')
    throw new Error(message)
  }

  return response.json()
}

export async function unbanGroupMember(token: string, groupId: number, userId: number) {
  const response = await fetch(`${API_URL}/groups/${groupId}/members/${userId}/unban`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to unban member')
    throw new Error(message)
  }

  return response.json()
}