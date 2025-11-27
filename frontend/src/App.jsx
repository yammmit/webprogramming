import { Routes, Route } from 'react-router-dom'

import { useState } from 'react'

import './App.css'

import AuthLanding from "./pages/auth/AuthLanding";
import Splash from "./pages/auth/Splash";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Dashboard from './pages/main/Dashboard';
import TaskDetail from './pages/main/TaskDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/auth" element={<AuthLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/main/dashboard" element={<Dashboard />} />
      <Route path="/main/tasks/:taskId" element={<TaskDetail />} />
    </Routes>
  )
}

export default App
