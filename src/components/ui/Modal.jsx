import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#222222]/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="bg-white border border-[#EBEBEB] rounded-3xl w-full max-w-lg shadow-[0_20px_60px_rgba(34,34,34,0.15)] pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#EBEBEB] flex justify-between items-center bg-[#F8F8F8]">
                                <h3 className="text-lg font-bold text-[#222222]">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-[#818181] hover:text-[#222222] hover:border-[#818181] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
