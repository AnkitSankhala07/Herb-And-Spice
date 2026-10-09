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
                setError({ type: 'not_found', message: 'This table number was not found. Please verify with our staff.' });
            } else if (data.status === 'occupied') {
                setError({
                    type: 'occupied',
                    message: `Table ${tableNumber} is currently occupied. Please wait for the current bill to settle.`,
                    bill: data.currentBill
                });
            } else if (data.status === 'cleaning') {
                setError({ type: 'cleaning', message: `Table ${tableNumber} is being prepared & sanitized. One moment please.` });
            } else {
                // Table is available — navigate to menu
                navigate(`/table/${tableNumber}/menu`);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError({ type: 'not_found', message: 'This table number was not found. Please verify with our staff.' });
            } else {
                // If backend is unreachable in offline mode, still allow guest menu exploration
                navigate(`/table/${tableNumber}/menu`);
            }
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6F0] text-[#222222] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Organic Shapes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-[#BCE2A3]/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#5A724A]/10 rounded-full blur-[100px]" />
            </div>

            <div className="absolute top-10 text-center w-full z-10">
                <div className="inline-flex items-center gap-2 mb-1">
                    <span className="text-xl">🌿</span>
                    <h2 className="text-2xl font-extrabold text-[#222222] tracking-tight">Herb &amp; Spice</h2>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm mt-12 bg-white border border-[#EBEBEB] rounded-3xl p-8 shadow-[0_12px_40px_rgba(90,114,74,0.08)] relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#BCE2A3]/40 text-[#425934] border border-[#BCE2A3] flex items-center justify-center mb-5 shadow-xs">
                        <User size={28} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-[#222222] mb-1.5">Welcome Guest</h1>
                    <p className="text-xs text-[#818181] leading-relaxed">Enter your table number to view the artisan menu and place your order.</p>
                </div>

                <form onSubmit={handleProceed} className="space-y-6">
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#818181] block mb-2 text-center">
                            Table Number
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            required
                            value={tableNumber}
                            onChange={(e) => { setTableNumber(e.target.value); setError(null); }}
                            className="w-full text-center text-4xl font-extrabold bg-[#F8F8F8] border-2 border-[#EBEBEB] rounded-2xl py-5 focus:border-[#5A724A] focus:bg-white focus:ring-4 focus:ring-[#5A724A]/10 transition-all outline-none text-[#222222] placeholder:text-[#818181]/30 shadow-inner"
                            placeholder="0"
                            autoFocus
                        />
                    </div>

                    {/* Error / Status Messages */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key={error.type}
                                initial={{ opacity: 0, y: -8, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -8, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={`p-4 rounded-2xl border flex gap-3 items-start text-xs leading-relaxed ${
                                    error.type === 'occupied' 
                                        ? 'bg-amber-50 border-amber-200 text-amber-800' 
                                        : error.type === 'cleaning'
                                            ? 'bg-[#BCE2A3]/20 border-[#BCE2A3] text-[#425934]'
                                            : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                    <div className="shrink-0 mt-0.5">
                                        {error.type === 'occupied' ? (
                                            <AlertCircle size={16} />
                                        ) : error.type === 'cleaning' ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <XCircle size={16} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold mb-0.5">
                                            {error.type === 'occupied' ? 'Table Occupied' : error.type === 'cleaning' ? 'Table Being Prepared' : 'Table Not Available'}
                                        </p>
                                        <p className="opacity-90">{error.message}</p>
                                        {error.bill > 0 && (
                                            <p className="font-mono font-bold mt-1 text-[#5A724A]">Current tab: ₹{error.bill}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        disabled={!tableNumber || isChecking}
                        className="w-full py-4 text-sm font-bold shadow-[0_6px_20px_rgba(90,114,74,0.25)] flex items-center justify-center gap-2 rounded-full"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Verifying Table...
                            </>
                        ) : (
                            <>
                                Browse Menu <ArrowRight size={18} />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#818181] font-semibold">Herb &amp; Spice Digital Guest</p>
                </div>
            </motion.div>
        </div>
    );
}
