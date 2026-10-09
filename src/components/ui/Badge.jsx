import clsx from 'clsx';

export const Badge = ({ status }) => {
    const styles = {
        pending: "bg-amber-50 text-amber-700 border border-amber-200",
        preparing: "bg-[#5A724A]/10 text-[#5A724A] border border-[#5A724A]/25",
        ready: "bg-[#BCE2A3]/30 text-[#425934] border border-[#BCE2A3]",
        served: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        paid: "bg-[#BCE2A3]/40 text-[#2C3B24] border border-[#AEDB91]",
        cancelled: "bg-red-50 text-red-600 border border-red-200",
    };

    return (
        <span className={clsx("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status?.toLowerCase()] || styles.pending)}>
            {status}
        </span>
    );
};
