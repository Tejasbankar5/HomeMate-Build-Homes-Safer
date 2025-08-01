import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ServiceProviderRegister from './auth/ServiceProviderRegister.jsx';
import ServiceProviderLogin from './auth/ServiceProviderLogin.jsx';
import './auth/register.css';
import { Toaster } from "react-hot-toast";
import OtpVerificationForm from './auth/OtpAdhaarPage.jsx';
import Dashboard from './DashBoard/Dashboard';
import ServiceProviderProfileCreation from './auth/ProfileCreation.jsx';
const root = document.getElementById("root");
import PortfolioVerificationForm from './auth/Portfolio.jsx';
import ProfilePage from './DashBoard/ProfileView.jsx';
import EarningsDashboard from './DashBoard/Earnings.jsx';
import CalendarPage from './DashBoard/Calender.jsx';
import AcceptRequestPage from './DashBoard/AcceptRequest.jsx';
import SettingsPage from './DashBoard/SettingsPage.jsx';
import ChatSystem from './DashBoard/ChatSystem.jsx';
import AcceptedContracts from './DashBoard/AcceptedContracts.jsx';
import Chat from './Chat/chat.jsx';

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color: '#fff',
              fontSize: '16px',
              padding: '12px 18px'
            },
            duration: 2500,
          }}
        />
        
        <Routes>
          <Route path="/" element={<ServiceProviderRegister />} />
          <Route path="/login" element={<ServiceProviderLogin />} />
          <Route path="/AuthPhase1" element={<OtpVerificationForm />} />
          <Route path="/AuthPhase2" element={<PortfolioVerificationForm/>}/>
          <Route path="/dashboard/*" element={<Dashboard/>}/>
          <Route path="/portfolio" element={<PortfolioVerificationForm/>}/>
          <Route path='profile' element={<ServiceProviderProfileCreation/>}/>
          <Route path='viewprofile' element={<ProfilePage/>}/>
          <Route path='earnings' element={<EarningsDashboard/>}/>
          <Route path='calender' element={<CalendarPage/>}/>
          <Route path='accept-request' element={<AcceptRequestPage/>}/>
          <Route path='settings' element={<SettingsPage/>}/>
          {/* <Route path='chat' element={<ChatSystem/>}/> */}
          <Route path='accepted-Contracts' element={<AcceptedContracts/>}/>
          <Route path='chat' element={<Chat/>}></Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error("Root div not found.");
}