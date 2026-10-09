import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className = "", ...props }) => (
    <div
        className={twMerge(
            "bg-white border border-[#EBEBEB] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(90,114,74,0.06)] transition-all",
            className
        )}
        {...props}
    >
        {children}
    </div>
);
