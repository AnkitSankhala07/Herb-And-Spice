import { twMerge } from 'tailwind-merge';

export const Button = ({ children, variant = "primary", className, ...props }) => {
    const baseStyles = "px-5 py-3 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide text-sm";

    const variants = {
        primary: "bg-gradient-to-r from-primary to-[#A8744E] text-[#F0E8D5] hover:brightness-110 shadow-[0_4px_20px_-4px_rgba(139,94,60,0.3)]",
        secondary: "bg-surface text-foreground hover:bg-elevated border border-border",
        outline: "border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary bg-transparent",
        ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface",
        danger: "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20",
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
