import clsx from 'clsx';
export const Badge = ({ status }) => {
    const styles = {
        pending: "bg-amber/10 text-amber border border-amber/20",
        preparing: "bg-primary/10 text-primary border border-primary/20",
        ready: "bg-teal/10 text-teal border border-teal/20",
        served: "bg-surface text-muted border border-border",
        cancelled: "bg-danger/10 text-danger border border-danger/20",
    };

    return (
        <span className={clsx("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm", styles[status?.toLowerCase()] || styles.pending)}>
            {status}
        </span>
    );
};
