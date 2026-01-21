import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../layout/Layout';
import Login from '../../features/auth/Login';
import Dashboard from '../../features/dashboard/Dashboard';
import Clients from '../../features/clients/Clients';
import ClientDetails from '../../features/clients/ClientDetails';
import PetForm from "../../features/pets/PetForm";
import PetDetails from '../../features/pets/PetDetails';




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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/clients/:id/pets/new" element={<PetForm />} />
          <Route path="/clients/:id/pets/:petId" element={<PetDetails />} />
          <Route path="/clients/:id/pets/:petId/edit" element={<PetForm />} />
          <Route path="/clients/:id/pets/:petId/edit" element={<PetForm />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
