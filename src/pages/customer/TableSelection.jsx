import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowRight, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

export default function TableSelection() {
    const [tableNumber, setTableNumber] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleProceed = async (e) => {
        e.preventDefault();
        if (!tableNumber || isNaN(tableNumber) || parseInt(tableNumber) <= 0) return;

        setError(null);
        setIsChecking(true);

        try {
            const { data } = await api.get(`/tables/status/${tableNumber}`);

            if (!data.exists) {
                setError({ type: 'not_found', message: 'This table does not exist. Please check your table number.' });
            } else if (data.status === 'occupied') {
                setError({
                    type: 'occupied',
                    message: `Table ${tableNumber} is currently occupied. Please wait until the bill is paid and the table is cleared.`,
                    bill: data.currentBill
                });
            } else if (data.status === 'cleaning') {
                setError({ type: 'cleaning', message: `Table ${tableNumber} is being cleaned. Please wait a moment.` });
            } else {
                // Table is available — navigate to menu
                navigate(`/table/${tableNumber}/menu`);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError({ type: 'not_found', message: 'This table does not exist. Please check your table number.' });
            } else {
                setError({ type: 'error', message: 'Unable to check table status. Please try again.' });
            }
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-desktop-bg flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-gold/5 rounded-full blur-[120px]" />
            </div>

            <div className="absolute top-10 text-center w-full z-10">
                <h2 className="text-3xl font-display font-bold text-foreground-pale tracking-tight">Herbs & Spices 🌿</h2>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm mt-12 bg-surface/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-primary-hover text-background flex items-center justify-center shadow-[0_8px_30px_rgba(139,94,60,0.4)] mb-6">
                        <User size={32} />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-foreground-pale mb-2">Welcome Guest</h1>
                    <p className="text-sm text-muted">Please enter your table number to access the digital menu.</p>
                </div>

                <form onSubmit={handleProceed} className="space-y-6">
                    <div>
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-2 text-center">Table Number</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    required
                                                    value={tableNumber}
                                                    onChange={(e) => { setTableNumber(e.target.value); setError(null); }}
                                                    className="w-full text-center text-4xl font-display font-bold bg-elevated border-2 border-border rounded-2xl py-6 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground-pale placeholder:text-muted/30"
                                                    placeholder="0"
                                                />
                                            </div>

                                            {/* Error / Status Messages */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key={error.type}
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={`p-4 rounded-2xl border flex gap-3 items-start ${
                                    error.type === 'occupied' 
                                        ? 'bg-amber/10 border-amber/30 text-amber' 
                                        : error.type === 'cleaning'
                                            ? 'bg-teal/10 border-teal/30 text-teal'
                                            : 'bg-danger/10 border-danger/30 text-danger'
                                }`}>
                                    <div className="shrink-0 mt-0.5">
                                        {error.type === 'occupied' ? (
                                            <AlertCircle size={18} />
                                        ) : error.type === 'cleaning' ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <XCircle size={18} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold mb-0.5">
                                            {error.type === 'occupied' ? 'Table Occupied' : error.type === 'cleaning' ? 'Table Being Cleaned' : 'Table Not Found'}
                                        </p>
                                        <p className="text-xs opacity-80 leading-relaxed">{error.message}</p>
                                        {error.bill > 0 && (
                                            <p className="text-xs font-mono font-bold mt-1 opacity-70">Current bill: ₹{error.bill}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        disabled={!tableNumber || isChecking}
                        className="w-full py-4 text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Checking...
                            </>
                        ) : (
                            <>
                                Proceed to Menu <ArrowRight size={18} />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted/60 font-bold">Powered by Akxton OS</p>
                </div>
            </motion.div>
        </div>
    );
};
