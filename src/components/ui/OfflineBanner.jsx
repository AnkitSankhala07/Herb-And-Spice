import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-[#222222] text-white px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-md">
            <WifiOff size={14} className="text-[#BCE2A3]" />
            <span>Connection offline. Orders will sync when connection returns.</span>
        </div>
    );
};
