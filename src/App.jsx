import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import Payment from './pages/customer/Payment';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InventoryPage from './pages/admin/Inventory';
import Analytics from './pages/admin/Analytics';
import Forecast from './pages/admin/Forecast';
import AdminOrders from './pages/admin/AdminOrders';
import AdminTables from './pages/admin/AdminTables';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import WaiterOrders from './pages/waiter/WaiterOrders';
import OrderStatus from './pages/customer/OrderStatus';
import TableSelection from './pages/customer/TableSelection';
import Login from './pages/auth/Login';

// Modern Premium Landing Page with Staggered Reveals
const Landing = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 text-center space-y-10 p-6 max-w-3xl relative">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-7xl md:text-9xl font-display font-bold tracking-tighter text-foreground uppercase">
            AKXTON
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide max-w-xl mx-auto"
        >
          Elevating the art of dining through seamless digital integration.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 items-center pt-12"
        >
          <div className="w-full max-w-md p-1 border border-border rounded-2xl bg-secondary backdrop-blur-md">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1">
              <a href="/table" className="flex items-center justify-center px-4 py-3 bg-background hover:bg-background/80 text-foreground rounded-xl transition-all duration-300 mobile-hover shadow-sm">
                <span className="text-sm font-medium">Guest</span>
              </a>
              <a href="/waiter/login" className="flex items-center justify-center px-4 py-3 hover:bg-background/50 text-muted-foreground hover:text-foreground rounded-xl transition-all duration-300">
                <span className="text-sm font-medium">Staff</span>
              </a>
              <a href="/kitchen/login" className="flex items-center justify-center px-4 py-3 hover:bg-background/50 text-muted-foreground hover:text-foreground rounded-xl transition-all duration-300">
                <span className="text-sm font-medium">Kitchen</span>
              </a>
              <a href="/admin/login" className="flex items-center justify-center px-4 py-3 hover:bg-background/50 text-muted-foreground hover:text-foreground rounded-xl transition-all duration-300">
                <span className="text-sm font-medium">Admin</span>
              </a>
            </div>
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            System Operational • v2.4.0
          </div>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-12 p-6 w-full max-w-md bg-background/40 border border-border rounded-2xl backdrop-blur-sm"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Demo Credentials</h3>
            <div className="space-y-3 text-left text-xs">
              <div className="p-2 bg-surface/50 rounded-lg">
                <p className="font-medium text-foreground">Admin:</p>
                <p className="text-muted">admin@akxton.com / admin123</p>
              </div>
              <div className="p-2 bg-surface/50 rounded-lg">
                <p className="font-medium text-foreground">Chef:</p>
                <p className="text-muted">chef@akxton.com / chef123</p>
              </div>
              <div className="p-2 bg-surface/50 rounded-lg">
                <p className="font-medium text-foreground">Waiter:</p>
                <p className="text-muted">waiter@akxton.com / waiter123</p>
              </div>
              <div className="p-2 bg-surface/50 rounded-lg">
                <p className="font-medium text-foreground">Customer:</p>
                <p className="text-muted">Just select table 1-10</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />

        <Route path="/admin/login" element={<Login role="Admin" />} />
        <Route path="/waiter/login" element={<Login role="Waiter" />} />
        <Route path="/kitchen/login" element={<Login role="Kitchen" />} />

        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="menu" element={<InventoryPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="forecast" element={<Forecast />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="tables" element={<AdminTables />} />
        </Route>

        <Route path="/waiter" element={<DashboardLayout role="waiter" />}>
          <Route path="dashboard" element={<WaiterDashboard />} />
          <Route path="orders" element={<WaiterOrders />} />
        </Route>

        <Route path="/kitchen" element={<DashboardLayout role="kitchen" />}>
          <Route path="dashboard" element={<KitchenDashboard />} />
        </Route>

        <Route path="/tables" element={<Navigate to="/table" replace />} />
        <Route path="/table" element={<TableSelection />} />
        <Route path="/table/:tableId/*" element={<CustomerLayout />}>
          <Route index element={<Navigate to="menu" replace />} />
          <Route path="menu" element={<Menu />} />
          <Route path="cart" element={<Cart />} />
          <Route path="payment" element={<Payment />} />
          <Route path="status" element={<OrderStatus />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-display text-2xl">
            404 • Lost in Space
          </div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
