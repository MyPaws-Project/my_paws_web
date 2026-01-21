import AppRouter from './app/router/AppRouter';
import { auth } from './services/firebase/firebase';

export default function App() {
  console.log('Firebase auth init:', auth?.app?.name);
  return <AppRouter />;
}

