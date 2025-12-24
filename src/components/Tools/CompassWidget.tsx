'use client';

import { useEffect, useState } from 'react';
import SunCalc from 'suncalc';
import { Compass as CompassIcon, Sun, Moon } from 'lucide-react';

export default function CompassWidget({ lat, lng }: { lat?: number; lng?: number }) {
    const [heading, setHeading] = useState(0);
    const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date } | null>(null);

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            // webkitCompassHeading for iOS, alpha for Android (roughly)
            // Note: Android alpha is not exactly compass heading without compensation, but simpler for MVP.
            const alpha = event.alpha;
            const webkitHeading = (event as any).webkitCompassHeading;

            if (webkitHeading) {
                setHeading(webkitHeading);
            } else if (alpha !== null) {
                setHeading(360 - alpha);
            }
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    useEffect(() => {
        if (lat && lng) {
            const times = SunCalc.getTimes(new Date(), lat, lng);
            setSunTimes(times);
        }
    }, [lat, lng]);

    const now = new Date();
    const isDay = sunTimes ? (now > sunTimes.sunrise && now < sunTimes.sunset) : true;

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
            <div className="bg-white/90 dark:bg-black/80 backdrop-blur p-2 rounded-full shadow-md flex items-center justify-center pointer-events-auto"
                title="Brújula (Norte)">
                <CompassIcon
                    size={32}
                    className="text-primary transition-transform duration-200"
                    style={{ transform: `rotate(${-heading}deg)` }}
                />
            </div>

            {sunTimes && (
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1 rounded-full shadow-md text-xs font-medium flex items-center gap-2 pointer-events-auto">
                    {isDay ? <Sun size={14} className="text-accent" /> : <Moon size={14} className="text-blue-400" />}
                    <span>
                        {isDay
                            ? `🌞 ${sunTimes.sunset.getHours()}:${sunTimes.sunset.getMinutes().toString().padStart(2, '0')}`
                            : `🌅 ${sunTimes.sunrise.getHours()}:${sunTimes.sunrise.getMinutes().toString().padStart(2, '0')}`
                        }
                    </span>
                </div>
            )}
        </div>
    );
}
