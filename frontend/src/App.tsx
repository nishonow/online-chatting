import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GroupChat from './pages/GroupChat'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DirectChat from './pages/DirectChat'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GroupChat />} />
        <Route path="/group/:groupId" element={<GroupChat />} />
        <Route path="/dm/:username" element={<DirectChat />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
