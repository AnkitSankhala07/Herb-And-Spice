import { motion } from 'framer-motion';
import clsx from 'clsx';

const CategoryFilter = ({ categories, activeCategory, onSelect }) => {
    return (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1 snap-x">
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onSelect(cat)}
                    className="relative group transition-all snap-center h-10"
                >
                    {activeCategory === cat && (
                        <motion.div
                            layoutId="activePill"
                            className="absolute inset-0 bg-[#C8973F]/15 border border-[#C8973F] rounded-full"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span 
                        className={clsx(
                            "relative px-4 py-1.5 text-sm font-['DM_Sans'] transition-colors block h-full flex items-center",
                            activeCategory === cat
                                ? "text-[#C8973F] font-medium"
                                : "text-[#5A7A56] hover:text-[#F0E8D5]"
                        )}
                    >
                        {cat}
                    </span>
                    {activeCategory !== cat && (
                        <div className="absolute inset-0 border border-[#344530] rounded-full group-hover:border-[#C8973F]/40 transition-colors pointer-events-none" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;
