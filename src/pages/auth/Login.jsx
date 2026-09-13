import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ChefHat, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { login } from '../../services/api';
import toast from 'react-hot-toast';

const Login = ({ role: roleProp }) => {
    const role = roleProp.toLowerCase(); // Normalize role to lowercase
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
            setError(err.response?.data?.message || 'Invalid credentials');
            toast.error('Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-desktop-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-teal/10 rounded-full blur-[120px]" />
            </div>

            <div className="absolute top-10 text-center w-full z-10">
                <h2 className="text-3xl font-display font-bold text-foreground-pale">Herbs & Spices 🌿</h2>
            </div>

            <Card className="w-full max-w-md p-8 relative z-10 bg-elevated/80 backdrop-blur-xl border border-border mt-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg ${role === 'kitchen' ? 'bg-linear-to-br from-primary to-danger' : 'bg-linear-to-br from-primary to-muted'
                        }`}>
                        {role === 'kitchen' ? <ChefHat size={32} /> : <LayoutDashboard size={32} />}
                    </div>
                    <h1 className="text-2xl font-display font-bold text-foreground-pale tracking-tight">{roleProp} Access</h1>
                    <p className="text-muted mt-2 text-sm">Sign in to manage {role === 'Kitchen' ? 'orders' : 'business'}</p>
                </motion.div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Email / PIN</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-muted group-focus-within:text-gold transition-colors" size={18} />
                            <input
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all outline-none text-foreground placeholder:text-muted/50"
                                placeholder="name@akxton.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-muted group-focus-within:text-gold transition-colors" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all outline-none text-foreground placeholder:text-muted/50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-4"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
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
                            className="w-full text-xs text-primary/80 hover:text-primary py-2 px-3 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <span>⚡ Auto-fill Demo Credentials ({role === 'kitchen' ? 'chef@akxton.com / chef123' : role === 'waiter' ? 'waiter@akxton.com / waiter123' : 'admin@akxton.com / admin123'})</span>
                        </button>
                    </div>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-xs text-muted/60 uppercase tracking-widest font-medium">Powered by Akxton OS</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
