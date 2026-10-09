import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';

const AIChatPanel = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! Welcome to Herb & Spice 🌿 I am your culinary concierge. Ask me about ingredients, spice levels, allergens, or food pairings!' }
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
                text: error.response?.data?.reply || "I am experiencing a slight delay in the herb garden, please try again."
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
                        className="fixed inset-0 bg-[#222222]/40 backdrop-blur-xs z-[60]"
                    />
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] rounded-t-[2.5rem] z-[70] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden max-w-xl mx-auto"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-[#EBEBEB] bg-[#F8F8F8] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#5A724A] text-white rounded-full flex items-center justify-center shadow-sm">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#222222] text-base leading-tight">Herb &amp; Spice Concierge</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-2 h-2 bg-[#5A724A] rounded-full animate-pulse" />
                                        <span className="text-[10px] text-[#5A724A] font-bold uppercase tracking-wider">AI Sommelier</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-[#818181] hover:text-[#222222] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[320px] bg-white custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-[#5A724A] text-white rounded-tr-none shadow-xs' 
                                            : 'bg-[#F4F6F0] text-[#222222] border border-[#EBEBEB] rounded-tl-none whitespace-pre-wrap'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#F4F6F0] border border-[#EBEBEB] rounded-3xl rounded-tl-none p-4 flex gap-1.5 items-center">
                                        <div className="w-2 h-2 bg-[#5A724A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-[#5A724A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-[#5A724A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#F8F8F8] border-t border-[#EBEBEB]">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything about our spices or dishes..."
                                    className="w-full bg-white border border-[#EBEBEB] rounded-full py-3.5 pl-5 pr-14 text-[#222222] placeholder:text-[#818181] focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 outline-none transition-all text-sm shadow-xs"
                                />
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !input.trim()}
                                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                        isLoading || !input.trim() 
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                            : 'bg-[#5A724A] text-white hover:bg-[#485D3B] shadow-sm'
                                    }`}
                                >
                                    <Send size={15} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIChatPanel;
