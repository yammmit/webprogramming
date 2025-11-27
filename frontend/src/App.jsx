import { Routes, Route } from 'react-router-dom'

import { useState } from 'react'

import './App.css'

import AuthLanding from "./pages/auth/AuthLanding";
import Splash from "./pages/auth/Splash";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/auth" element={<AuthLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
    </Routes>
  )
}

export default App
