import { twMerge } from 'tailwind-merge';

export const Button = ({ children, variant = "primary", className, ...props }) => {
    const baseStyles = "px-6 py-3 rounded-full font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-normal";

    const variants = {
        primary: "bg-[#5A724A] text-white hover:bg-[#485D3B] shadow-[0_4px_16px_rgba(90,114,74,0.25)] hover:shadow-[0_6px_20px_rgba(90,114,74,0.32)]",
        charcoal: "bg-[#222222] text-white hover:bg-black shadow-[0_4px_16px_rgba(34,34,34,0.2)]",
        dark: "bg-[#222222] text-white hover:bg-black shadow-[0_4px_16px_rgba(34,34,34,0.2)]",
        secondary: "bg-[#BCE2A3] text-[#222222] hover:bg-[#AADB8E] font-semibold shadow-sm",
        outline: "border border-[#EBEBEB] text-[#222222] bg-white hover:border-[#5A724A] hover:bg-[#5A724A]/5 hover:text-[#5A724A]",
        ghost: "bg-transparent text-[#818181] hover:text-[#222222] hover:bg-[#EBEBEB]/60",
        danger: "bg-red-50 text-[#D94A38] hover:bg-red-100 border border-red-200 font-semibold",
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant] || variants.primary, className)}
            {...props}
        >
            {children}
        </button>
    );
};
