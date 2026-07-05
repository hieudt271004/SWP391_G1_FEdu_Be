import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { Toaster } from './components/ui/sonner';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <ConfirmProvider>
          <AppRoutes />
          <Toaster />
        </ConfirmProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;