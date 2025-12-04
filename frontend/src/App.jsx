import { Routes, Route } from 'react-router-dom'

import { useState } from 'react'

import './App.css'

import AuthLanding from "./pages/auth/AuthLanding";
import Splash from "./pages/auth/Splash";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Dashboard from './pages/main/Dashboard';
import TaskDetail from './pages/main/TaskDetail';
import Settings from './pages/setting/Settings';
import Chores from './pages/chores/Chores';
import AssignRequest from './pages/chores/AssignRequest';
import CreateChores from './pages/chores/CreateChores';
import ReviewChore from './pages/chores/ReviewChore';
import GroupSettings from "./pages/setting/GroupSettings";
import CreateGroup from "./pages/setting/CreateGroup";
import GroupManage from "./pages/setting/GroupManage";
import GroupSpecific from './pages/setting/GroupSpecific';
import MyInvitation from './pages/setting/MyInvitation';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/auth" element={<AuthLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/main/dashboard" element={<Dashboard />} />
      <Route path="/main/tasks/:taskId" element={<TaskDetail />} />
      <Route path="/main/assigned-request/:taskId" element={<AssignRequest />} />
      <Route path="/chores/create" element={<CreateChores />} />
      <Route path="/chores/review/:taskId" element={<ReviewChore />} />
      <Route path="/main/chores/:groupId" element={<Chores />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/groups" element={<GroupSettings />} />
      <Route path="/settings/groups/create" element={<CreateGroup />} />
      <Route path="/settings/groups/manage" element={<GroupManage />} />
      <Route path="/settings/invitations" element={<MyInvitation />} />
      <Route path="/settings/groups/:groupId" element={<GroupSpecific />} />
    </Routes>
  )
}

export default App
