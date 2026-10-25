import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ChefHat, LayoutDashboard, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { login } from '../../services/api';
import toast from 'react-hot-toast';

const Login = ({ role: roleProp }) => {
    const role = roleProp.toLowerCase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setError('Email is required');
            return;
        }

        if (!password) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await login(email, password);
            
            if (!response || !response.token) {
                setError('Invalid response from server');
                return;
            }

            // Store user info
            localStorage.setItem('user', JSON.stringify(response));
            localStorage.setItem('token', response.token);
            toast.success(`Welcome, ${response.name}!`);

            // Redirect based on role
            if (response.role === 'kitchen') {
                navigate('/kitchen/dashboard');
            } else if (response.role === 'waiter') {
                navigate('/waiter/dashboard');
            } else if (response.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/table');
            }
        } catch (err) {
            console.error('Login error:', err);
            if (!err.response) {
                setError('Cannot connect to server. The backend may be restarting or offline.');
                toast.error('Network error: Server unreachable');
            } else {
                setError(err.response?.data?.message || 'Invalid credentials');
                toast.error(err.response?.data?.message || 'Login failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6F0] flex items-center justify-center p-4 relative overflow-hidden text-[#222222]">
            {/* Background Organic Shapes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-[#BCE2A3]/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[420px] h-[420px] bg-[#5A724A]/12 rounded-full blur-[110px]" />
            </div>

            <div className="absolute top-10 text-center w-full z-10">
                <a href="/" className="inline-flex items-center gap-2">
                    <span className="text-xl">🌿</span>
                    <h2 className="text-2xl font-extrabold text-[#222222] tracking-tight">Herb &amp; Spice</h2>
                </a>
            </div>

            <Card className="w-full max-w-md p-8 sm:p-10 relative z-10 bg-white border border-[#EBEBEB] mt-12 rounded-3xl shadow-[0_16px_40px_rgba(90,114,74,0.08)]">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-8"
                >
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#BCE2A3]/35 text-[#425934] border border-[#BCE2A3] shadow-xs">
                        {role === 'kitchen' ? <ChefHat size={30} /> : role === 'admin' ? <Shield size={28} /> : <User size={28} />}
                    </div>
                    <h1 className="text-2xl font-extrabold text-[#222222] tracking-tight">{roleProp} Portal</h1>
                    <p className="text-[#818181] mt-1 text-xs">Sign in to authenticate with your staff credentials</p>
                </motion.div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#818181] ml-1">Email / Username</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-[#818181] group-focus-within:text-[#5A724A] transition-colors" size={17} />
                            <input
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl focus:border-[#5A724A] focus:bg-white focus:ring-2 focus:ring-[#5A724A]/10 transition-all outline-none text-[#222222] placeholder:text-[#818181]/50 text-sm font-medium"
                                placeholder="name@akxton.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#818181] ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-[#818181] group-focus-within:text-[#5A724A] transition-colors" size={17} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl focus:border-[#5A724A] focus:bg-white focus:ring-2 focus:ring-[#5A724A]/10 transition-all outline-none text-[#222222] placeholder:text-[#818181]/50 text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        variant="primary"
                        className="w-full mt-4 py-3.5 text-sm font-bold rounded-full shadow-[0_4px_16px_rgba(90,114,74,0.3)]"
                    >
                        {isLoading ? 'Verifying...' : 'Sign In'}
                    </Button>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (role === 'kitchen') {
                                    setEmail('chef@akxton.com');
                                    setPassword('chef123');
                                } else if (role === 'waiter') {
                                    setEmail('waiter@akxton.com');
                                    setPassword('waiter123');
                                } else {
                                    setEmail('admin@akxton.com');
                                    setPassword('admin123');
                                }
                            }}
                            className="w-full text-[11px] font-bold text-[#425934] bg-[#BCE2A3]/25 hover:bg-[#BCE2A3]/40 py-2.5 px-3 rounded-full border border-[#BCE2A3] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <span>⚡ Fill Demo Credentials ({role === 'kitchen' ? 'chef' : role === 'waiter' ? 'waiter' : 'admin'})</span>
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t border-[#EBEBEB] pt-4">
                    <p className="text-[10px] text-[#818181] uppercase tracking-widest font-semibold">Herb &amp; Spice Security Layer</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
