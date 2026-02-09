import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GroupChatContainer from './containers/GroupChatContainer'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GroupChatContainer />}>
          <Route path="/" element={null} />
          <Route path="/group/:groupId" element={null} />
          <Route path="/dm/:username" element={null} />
        </Route>
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
