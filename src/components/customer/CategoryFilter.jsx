import { motion } from 'framer-motion';
import clsx from 'clsx';

const CategoryFilter = ({ categories, activeCategory, onSelect }) => {
    return (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-2 px-1 snap-x">
            {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                    <button
                        key={cat}
                        onClick={() => onSelect(cat)}
                        className="relative group transition-all snap-center h-10 shrink-0 outline-none"
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activePill"
                                className="absolute inset-0 bg-[#5A724A] rounded-full shadow-[0_4px_14px_rgba(90,114,74,0.3)]"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        <span
                            className={clsx(
                                "relative px-5 py-2 text-xs font-semibold tracking-wide rounded-full block h-full flex items-center transition-colors duration-200",
                                isActive
                                    ? "text-white"
                                    : "text-[#818181] hover:text-[#222222] bg-white border border-[#EBEBEB] hover:border-[#BCE2A3]"
                            )}
                        >
                            {cat}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default CategoryFilter;
