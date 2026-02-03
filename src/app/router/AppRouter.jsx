import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../layout/Layout';

import Login from '../../features/auth/Login';
import ClinicProfile from '../../features/profile/ClinicProfile';

import Dashboard from '../../features/dashboard/Dashboard';

import Clients from '../../features/clients/Clients';
import ClientDetails from '../../features/clients/ClientDetails';

import PetForm from '../../features/pets/PetForm';
import PetDetails from '../../features/pets/PetDetails';

import MedicalHistoryList from '../../features/pets/medicalHistory/MedicalHistoryList';
import MedicalHistoryForm from '../../features/pets/medicalHistory/MedicalHistoryForm';

import AppointmentsList from "../../features/appointments/AppointmentsList";
import AppointmentsCalendar from "../../features/appointments/AppointmentsCalendar";
import AppointmentForm from "../../features/appointments/AppointmentForm";



export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/profile" element={<ClinicProfile />} />

          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetails />} />

          <Route path="/clients/:id/pets/new" element={<PetForm />} />
          <Route path="/clients/:id/pets/:petId" element={<PetDetails />} />
          <Route path="/clients/:id/pets/:petId/edit" element={<PetForm />} />

          <Route path="/clients/:id/pets/:petId/history" element={<MedicalHistoryList />} />
          <Route path="/clients/:id/pets/:petId/history/new" element={<MedicalHistoryForm />} />
          <Route path="/clients/:id/pets/:petId/history/:entryId/edit" element={<MedicalHistoryForm />} />

          <Route path="/clients/:id/appointments" element={<AppointmentsList />} />
          <Route path="/calendar" element={<AppointmentsCalendar />} />
          <Route path="/appointments" element={<Navigate to="/calendar" replace />} />
          <Route path="/appointments/new" element={<AppointmentForm />} />
          <Route path="/appointments/:appointmentId/edit" element={<AppointmentForm />} />

        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
