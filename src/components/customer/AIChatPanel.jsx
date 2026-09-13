import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';

const AIChatPanel = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am Chef Akxi. How can I help you with the menu today? Ask me about calories, ingredients, or flavor profiles!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userText = input.trim();
        const newMsg = { role: 'user', text: userText };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsLoading(true);
        
        try {
            const res = await api.post('/ai/chat', { message: userText });
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: res.data.reply
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: error.response?.data?.reply || "I'm experiencing a kitchen delay, please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-[#1C2B1A] border-t border-[#344530] rounded-t-[2.5rem] z-[70] max-h-[85vh] flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-[#344530] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#8B5E3C] to-[#3D1A0A] rounded-full flex items-center justify-center text-white">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-['Playfair_Display'] font-bold text-[#F0E8D5] text-lg">Chef Akxi</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-[#3A8C72] rounded-full animate-pulse" />
                                        <span className="text-[10px] text-[#5A7A56] font-bold uppercase tracking-widest">AI Concierge</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-[#5A7A56] hover:text-[#F0E8D5] transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-['DM_Sans'] leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-[#8B5E3C] text-[#FAF6EE] rounded-tr-none' 
                                            : 'bg-[#243023] text-[#F0E8D5] border border-[#344530] rounded-tl-none whitespace-pre-wrap'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#243023] border border-[#344530] rounded-2xl rounded-tl-none p-4 flex gap-1.5 items-center">
                                        <div className="w-1.5 h-1.5 bg-[#8B5E3C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-[#8B5E3C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-[#8B5E3C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-6 border-t border-[#344530] bg-[#243023]/50">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about ingredients, spice levels..."
                                    className="w-full bg-[#1C2B1A] border border-[#344530] rounded-xl py-4 pl-5 pr-14 text-[#F0E8D5] font-['DM_Sans'] focus:border-[#C8973F]/60 outline-none transition-all"
                                />
                                <button type="submit" disabled={isLoading} className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 text-white rounded-lg flex items-center justify-center transition-colors ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#8B5E3C]'}`}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIChatPanel;
