import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className = "", ...props }) => (
    <div className={twMerge("bg-surface border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/20", className)} {...props}>
        {children}
    </div>
);
