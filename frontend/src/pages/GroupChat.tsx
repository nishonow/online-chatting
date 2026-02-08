import { useParams } from 'react-router-dom'
import GroupChatContainer from '../containers/GroupChatContainer'

function GroupChat() {
  const { groupId } = useParams()
  const parsedId = groupId ? Number(groupId) : null

  return <GroupChatContainer initialGroupId={Number.isFinite(parsedId) ? parsedId : null} />
}

export default GroupChat
