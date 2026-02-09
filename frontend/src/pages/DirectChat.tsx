import { useParams } from 'react-router-dom'
import GroupChatContainer from '../containers/GroupChatContainer'

function DirectChat() {
  const { username } = useParams()
  const initialUsername = username?.trim() ? username.trim() : null

  return (
    <GroupChatContainer initialGroupId={null} initialUsername={initialUsername} />
  )
}

export default DirectChat
