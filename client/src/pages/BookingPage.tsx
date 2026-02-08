import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, addWeeks, addMonths, addDays } from "date-fns";
import { CalendarIcon, ClockIcon, InfoIcon } from "lucide-react";
import Timekeeper from 'react-timekeeper';
import { getDirectImageUrl } from '@/lib/image-utils';

interface BikePrice {
    type: string;
    price: number;
}

interface Bike {
    id: string;
    name: string;
    imageUrl: string;
    status: string;
    price: BikePrice[];
    bookings?: any[];
}

export function BookingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bike, setBike] = useState<Bike | null>(null);
    const [loading, setLoading] = useState(true);

    // Common
    const [selectedPriceType, setSelectedPriceType] = useState('HOUR');
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());

    // Hour specific
    const [startTime, setStartTime] = useState(() => format(new Date(), "hh:mm a"));
    const [endTime, setEndTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        return format(now, "hh:mm a");
    });

    // Day specific
    const [endDate, setEndDate] = useState<Date | undefined>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });

    // Week/Month specific
    const [duration, setDuration] = useState('1');

    const [submitting, setSubmitting] = useState(false);



    useEffect(() => {
        if (selectedPriceType !== 'HOUR') {
            setEndTime(startTime);
        } else {
            // For hourly: set endTime to startTime + 1 hour by default
            const parts = startTime.split(' ');
            if (parts.length === 2) {
                const [time, modifier] = parts;
                let [hours, minutes] = time.split(':').map(Number);
                const mod = modifier.toUpperCase();
                if (hours === 12) hours = 0;
                if (mod === 'PM') hours += 12;
                hours = (hours + 1) % 24;
                const newMod = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours % 12 === 0 ? 12 : hours % 12;
                setEndTime(`${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${newMod}`);
            }
        }

        // If DAY is selected, force endDate to be startDate + 1
        if (selectedPriceType === 'DAY' && startDate) {
            setEndDate(addDays(startDate, 1));
        }
    }, [startTime, selectedPriceType, startDate]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/bikes/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Bike not found');
                return res.json();
            })
            .then(data => {
                setBike(data);
                // Set default price type if available
                if (data.price && data.price.length > 0) {
                    setSelectedPriceType(data.price[0].type);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error("Failed to load bike details");
                setLoading(false);
            });
    }, [id]);

    const calculation = useMemo(() => {
        if (!bike) return { total: 0, units: 0, rate: 0 };

        const priceObj = bike.price.find(p => p.type === selectedPriceType);
        const rate = priceObj ? priceObj.price : 0;
        let units = 0;

        if (selectedPriceType === 'HOUR') {
            const get24Hours = (time12h: string) => {
                const parts = time12h.split(' ');
                const [time, modifier] = parts;
                let [hours, minutes] = time.split(':').map(Number);
                const mod = modifier ? modifier.toUpperCase() : 'AM';
                if (hours === 12) hours = 0;
                if (mod === 'PM') hours += 12;
                return hours + minutes / 60;
            };
            const startDecimal = get24Hours(startTime);
            let endDecimal = get24Hours(endTime);

            // Handle midnight crossing (e.g., 11 PM to 1 AM)
            if (endDecimal <= startDecimal) {
                endDecimal += 24;
            }

            const diff = endDecimal - startDecimal;
            units = Math.max(1, Math.ceil(diff)); // Minimum 1 hour
        } else if (selectedPriceType === 'DAY') {
            if (startDate && endDate) {
                units = Math.max(0, differenceInDays(endDate, startDate));
                if (units === 0 && endDate > startDate) units = 1; // Minimum 1 day if distinct
            }
        } else if (selectedPriceType === 'WEEK' || selectedPriceType === 'MONTH') {
            units = parseInt(duration) || 0;
        }

        return {
            total: units * rate,
            units,
            rate
        };
    }, [bike, selectedPriceType, startTime, endTime, startDate, endDate, duration]);

    const [isConflict, setIsConflict] = useState(false);

    const toTimestamp = (date: Date, time12h: string) => {
        const parts = time12h.split(' ');
        if (parts.length !== 2) return 0;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        const mod = modifier.toUpperCase();
        if (hours === 12) hours = 0;
        if (mod === 'PM') hours += 12;

        const dt = new Date(date);
        dt.setHours(hours, minutes, 0, 0);
        return dt.getTime();
    };

    const dateRange = useMemo(() => {
        if (!startDate) return null;
        let s = startDate;
        let e = startDate;

        // Determine literal end date based on type
        if (selectedPriceType === 'DAY' && endDate) {
            e = endDate;
        } else if (selectedPriceType === 'WEEK' && duration) {
            e = addWeeks(startDate, parseInt(duration));
        } else if (selectedPriceType === 'MONTH' && duration) {
            e = addMonths(startDate, parseInt(duration));
        }

        // Handle midnight crossing ONLY for hourly rentals (e.g., 11 PM to 2 AM)
        const startPM = startTime.toUpperCase().includes('PM');
        const endAM = endTime.toUpperCase().includes('AM');

        if (selectedPriceType === 'HOUR' && startPM && endAM) {
            const adjustedEnd = new Date(e);
            adjustedEnd.setDate(adjustedEnd.getDate() + 1);
            e = adjustedEnd;
        }

        return { start: s, end: e };
    }, [startDate, endDate, selectedPriceType, duration, startTime, endTime]);

    useEffect(() => {
        if (!bike?.bookings || !dateRange) {
            setIsConflict(false);
            return;
        }

        const inputStart = toTimestamp(dateRange.start, startTime);
        let inputEnd = toTimestamp(dateRange.end, endTime);

        // For hourly bookings with midnight crossing, adjust end timestamp
        if (selectedPriceType === 'HOUR' && inputEnd <= inputStart) {
            inputEnd += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
        }

        if (inputStart >= inputEnd) {
            // Invalid time range
            setIsConflict(true);
            return;
        }

        const hasConflict = bike.bookings.some((b: any) => {
            if (b.status === 'CANCELLED') return false;
            const bStart = toTimestamp(new Date(b.startDate), b.startTime);
            const bEnd = toTimestamp(new Date(b.endDate), b.endTime);
            return (inputStart < bEnd && inputEnd > bStart);
        });

        setIsConflict(hasConflict);
    }, [dateRange, startTime, endTime, bike]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate) return;
        if (calculation.total <= 0) {
            toast.error("Invalid duration or time range");
            return;
        }
        setSubmitting(true);

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to continue");
            navigate('/login');
            return;
        }

        try {
            if (!dateRange) throw new Error("Invalid date selection");

            const res = await fetch(`${API_BASE_URL}/users/book-bike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bikeId: bike?.id,
                    startDate: format(dateRange.start, "yyyy-MM-dd"),
                    endDate: format(dateRange.end, "yyyy-MM-dd"),
                    startTime: startTime,
                    endTime: endTime,
                    priceType: selectedPriceType,
                    totalPrice: calculation.total
                })
            });

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error("This bike is already booked for the selected time period.");
                }
                throw new Error(data.message || 'Booking failed');
            }

            toast.success('Booking confirmed successfully!');
            navigate('/');

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleWhatsAppBooking = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!bike || !dateRange || !startDate) return;

        if (calculation.total <= 0) {
            toast.error("Invalid duration or time range");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to continue");
            navigate('/login');
            return;
        }

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userName = user?.name || 'Guest User';

        setSubmitting(true);

        try {
            // First, save the booking to our database to reserve the slot
            const res = await fetch(`${API_BASE_URL}/users/book-bike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bikeId: bike.id,
                    startDate: format(dateRange.start, "yyyy-MM-dd"),
                    endDate: format(dateRange.end, "yyyy-MM-dd"),
                    startTime: startTime,
                    endTime: endTime,
                    priceType: selectedPriceType,
                    totalPrice: calculation.total
                })
            });

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error("This bike is already booked for the selected time period.");
                }
                throw new Error(data.message || 'Failed to reserve booking in system');
            }

            // If DB save is successful, proceed to open WhatsApp
            const message = `*New Booking Request!* 🚲\n\n` +
                `👤 *User:* ${userName}\n` +
                `🏍️ *Bike:* ${bike.name}\n` +
                `📅 *Plan:* ${selectedPriceType}\n` +
                `⏰ *From:* ${format(dateRange.start, "dd MMM yyyy")} (${startTime})\n` +
                `⌛ *To:* ${format(dateRange.end, "dd MMM yyyy")} (${endTime})\n` +
                `💰 *Total Price:* ₹${calculation.total}\n\n` +
                `I have already reserved this slot in the app. Please confirm, thank you!`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/919492223471?text=${encodedMessage}`;

            toast.success('Slot reserved! Opening WhatsApp for confirmation...');
            window.open(whatsappUrl, '_blank');
            navigate('/');

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col space-y-3">
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </div>
        </div>
    );

    if (!bike) return <div className="container py-10 text-center text-destructive font-bold">Bike not found</div>;

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Visual Section */}
                <div className="lg:col-span-7">
                    <div className="aspect-[16/10] relative rounded-2xl overflow-hidden border-2 shadow-2xl bg-muted group">
                        <img
                            src={getDirectImageUrl(bike.imageUrl) || "https://placehold.co/800x500?text=Bike"}
                            alt={bike.name}
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                                const img = e.currentTarget;
                                if (bike.imageUrl && bike.imageUrl.includes('drive.google.com') && !img.src.includes('thumbnail')) {
                                    const match = bike.imageUrl.match(/(?:d\/|id=|open\?id=|file\/d\/)([a-zA-Z0-9_-]{25,})/);
                                    if (match) {
                                        img.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
                                        return;
                                    }
                                }
                                img.src = "https://placehold.co/800x500?text=Image+Unavailable";
                            }}
                        />
                        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-4 py-2 rounded-full border shadow-lg">
                            <span className="text-sm font-bold text-primary uppercase tracking-widest">{bike.status}</span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">{bike.name}</h1>
                            <p className="text-muted-foreground text-lg italic">Premium experience for your journeys.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {bike.price?.map((p, i) => (
                                <div key={i} className={`p-4 rounded-xl border-2 transition-all text-center ${selectedPriceType === p.type ? "border-primary bg-primary/5 shadow-inner" : "border-border bg-card"}`}>
                                    <span className="block text-xs font-bold text-muted-foreground uppercase mb-1">{p.type}</span>
                                    <span className="text-xl font-extrabold text-foreground">₹{p.price}</span>
                                </div>
                            ))}
                        </div>

                        {bike.bookings && bike.bookings.length > 0 && (
                            <div className="mt-8 border-t pt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-xl flex items-center gap-2 text-foreground">
                                        <InfoIcon className="w-5 h-5 text-primary" />
                                        Vehicle Availability
                                    </h3>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse border border-primary/20">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        Live
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4 italic">Showing current and future reservations. Expired slots are hidden automatically.</p>

                                <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                    {bike.bookings.map((b, i) => (
                                        <div key={i} className="bg-muted/30 p-4 rounded-2xl text-sm border border-border/40 backdrop-blur-sm hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-0.5">Slot reserved for</span>
                                                    <span className="font-extrabold text-foreground text-sm">
                                                        {format(new Date(b.startDate), "dd MMM")}
                                                        {b.startDate !== b.endDate && ` — ${format(new Date(b.endDate), "dd MMM")}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-muted-foreground flex items-center gap-2 font-medium">
                                                <ClockIcon className="w-4 h-4 text-primary opacity-50" />
                                                <span>{b.startTime} to {b.endTime}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Form Section */}
                <div className="lg:col-span-5">
                    <div className="border rounded-2xl p-8 bg-card shadow-xl h-fit border-border ring-1 ring-border/50">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                            <ClockIcon className="w-6 h-6 text-primary" />
                            Booking Details
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Plan Selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-muted-foreground">Select Rental Plan</Label>
                                <Select value={selectedPriceType} onValueChange={setSelectedPriceType}>
                                    <SelectTrigger className="h-12 text-lg font-medium bg-muted/30">
                                        <SelectValue placeholder="Choose a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bike.price?.map(p => (
                                            <SelectItem key={p.type} value={p.type} className="py-3">{p.type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <hr className="border-border/50" />

                            {/* Start Date */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-muted-foreground">
                                    {selectedPriceType === 'HOUR' ? 'Booking Date' : 'Start Date'}
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 justify-start text-left font-medium bg-background text-lg"
                                        >
                                            <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                                            {startDate ? format(startDate, "PPP") : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="rounded-xl" />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Time Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-muted-foreground">From</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full h-12 justify-start text-left font-medium text-lg">
                                                <ClockIcon className="mr-3 h-5 w-5 text-primary opacity-70" />
                                                {startTime}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="start">
                                            <Timekeeper time={startTime} onChange={(d) => setStartTime(d.formatted12)} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-muted-foreground">
                                        Until {selectedPriceType !== 'HOUR' && '(Auto 24h)'}
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full h-12 justify-start text-left font-medium text-lg ${selectedPriceType !== 'HOUR' ? 'opacity-70 bg-muted cursor-not-allowed' : ''}`}
                                                disabled={selectedPriceType !== 'HOUR'}
                                            >
                                                <ClockIcon className="mr-3 h-5 w-5 text-primary opacity-70" />
                                                {endTime}
                                            </Button>
                                        </PopoverTrigger>
                                        {selectedPriceType === 'HOUR' && (
                                            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="end">
                                                <Timekeeper time={endTime} onChange={(d) => setEndTime(d.formatted12)} />
                                            </PopoverContent>
                                        )}
                                    </Popover>
                                </div>
                            </div>

                            {/* Conditional Inputs */}
                            {selectedPriceType === 'DAY' && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-muted-foreground text-primary">End Date (Fixed 24h)</Label>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 justify-start text-left font-medium text-lg bg-muted cursor-not-allowed opacity-80"
                                        disabled
                                    >
                                        <CalendarIcon className="mr-3 h-5 w-5 text-primary opacity-70" />
                                        {endDate ? format(endDate, "PPP") : "Calculated end date"}
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground italic">Day plan is locked to exactly 24 hours.</p>
                                </div>
                            )}

                            {(selectedPriceType === 'WEEK' || selectedPriceType === 'MONTH') && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-muted-foreground">Number of {selectedPriceType.toLowerCase()}s</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        className="h-12 text-lg font-bold"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Live Calculation Display */}
                            <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20 space-y-3 animate-in fade-in zoom-in duration-300">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold uppercase text-primary/70 tracking-tighter">Calculation</span>
                                        <div className="text-sm font-medium text-foreground">
                                            {calculation.units} {selectedPriceType.toLowerCase()}(s) × ₹{calculation.rate}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold uppercase text-primary/70 block">Total Amount</span>
                                        <span className="text-3xl font-black text-primary">₹{calculation.total}</span>
                                    </div>
                                </div>
                            </div>

                            {isConflict && (
                                <div className="p-4 bg-destructive/15 text-destructive text-sm rounded-xl border border-destructive/20 font-bold flex items-center gap-3">
                                    <InfoIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>Bike already booked for this time range.</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full h-14 text-lg font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all"
                                    disabled={submitting || isConflict || !startDate || calculation.total <= 0}
                                >
                                    {submitting ? 'PROCESSING...' : 'CONFIRM BOOKING'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleWhatsAppBooking}
                                    className="w-full h-14 text-lg font-black border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white shadow-lg shadow-green-500/10 active:scale-[0.98] transition-all gap-2"
                                    disabled={isConflict || !startDate || calculation.total <= 0}
                                >
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    BOOK VIA WHATSAPP
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
