import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface Bike {
    id: string;
    name: string;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [bikes, setBikes] = useState<Bike[]>([]);

    // Add Bike State
    const [bikeName, setBikeName] = useState('');
    const [bikeNo, setBikeNo] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState('AVAILABLE'); // AVAILABLE | BOOKED | MAINTENANCE

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            toast.error('Unauthorized access');
            navigate('/admin/login');
            return;
        }
        fetchBikes();
    }, [navigate]);

    const fetchBikes = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/get-all-bikes?include=false`);
            if (res.ok) {
                const data = await res.json();
                setBikes(data);
            }
        } catch (error) {
            console.error("Failed to fetch bikes");
        }
    }

    const handleAddBike = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/bikes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ name: bikeName, bikeNo, imageUrl, status })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create bike');

            toast.success('Bike added successfully');
            setBikeName('');
            setBikeNo('');
            setImageUrl('');
            fetchBikes(); // Refresh list
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Button variant="outline" onClick={() => {
                    localStorage.removeItem('adminToken');
                    navigate('/admin/login');
                }}>Logout</Button>
            </div>

            <Tabs defaultValue="add-bike" className="w-full max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="add-bike">Add New Bike</TabsTrigger>
                    <TabsTrigger value="add-price">Manage Prices</TabsTrigger>
                    <TabsTrigger value="view-bookings">View Bookings</TabsTrigger>
                </TabsList>

                <TabsContent value="add-bike">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Bike</CardTitle>
                            <CardDescription>Enter details to list a new bike in the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddBike} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bike Name</Label>
                                        <Input required placeholder="e.g. Royal Enfield Classic 350" value={bikeName} onChange={e => setBikeName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bike Number (Reg No)</Label>
                                        <Input required placeholder="e.g. TN-01-AB-1234" value={bikeNo} onChange={e => setBikeNo(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Image URL (CDN / Supabase)</Label>
                                    <Input required placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Initial Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AVAILABLE">Available</SelectItem>
                                            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                            <SelectItem value="BOOKED">Booked</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? 'Adding...' : 'Add Bike'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="add-price">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        {bikes.map(bike => (
                            <BikePriceCard key={bike.id} bike={bike} fetchBikes={fetchBikes} />
                        ))}
                    </div>
                    {bikes.length === 0 && <div className="text-center p-10 text-muted-foreground">No bikes found. Add a bike first.</div>}
                </TabsContent>

                <TabsContent value="view-bookings">
                    <BookingsTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

function BookingsTable() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/bookings`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (error) {
            console.error("Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status: 'COMPLETED' })
            });

            if (res.ok) {
                toast.success("Booking completed successfully");
                fetchBookings();
            } else {
                const data = await res.json();
                throw new Error(data.message || "Failed to update booking");
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this booking?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (res.ok) {
                toast.success("Booking deleted successfully");
                fetchBookings();
            } else {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete booking");
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="text-center py-10">Loading bookings...</div>;

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Track all bike rentals and customer details.</CardDescription>
            </CardHeader>
            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-bold">Customer</TableHead>
                            <TableHead className="font-bold">Vehicle</TableHead>
                            <TableHead className="font-bold">Date</TableHead>
                            <TableHead className="font-bold">Time Period</TableHead>
                            <TableHead className="font-bold">Total</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">{booking.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{booking.user.email}</span>
                                        <span className="text-xs text-muted-foreground">{booking.user.phone || 'N/A'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{booking.bike.name}</span>
                                        <span className="text-xs text-muted-foreground">{booking.bike.bikeNo}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    <div className="flex flex-col">
                                        <span>{new Date(booking.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                        {booking.startDate !== booking.endDate && (
                                            <>
                                                <span className="text-muted-foreground">to</span>
                                                <span>{new Date(booking.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-primary">{booking.startTime}</span>
                                        <span className="text-muted-foreground text-[10px] text-center">to</span>
                                        <span className="text-primary">{booking.endTime}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-foreground">
                                    ₹{booking.totalPrice}
                                </TableCell>
                                <TableCell>
                                    <div className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                                        booking.status === 'BOOKED' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                            booking.status === 'CANCELLED' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                booking.status === 'COMPLETED' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                    "bg-muted text-muted-foreground"
                                    )}>
                                        {booking.status}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {booking.status === 'BOOKED' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-xs font-bold border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                                                onClick={() => handleAccept(booking.id)}
                                            >
                                                Accept
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(booking.id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {bookings.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                                    No bookings found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

function BikePriceCard({ bike, fetchBikes }: { bike: Bike, fetchBikes: () => void }) {
    const [prices, setPrices] = useState({
        HOUR: '',
        DAY: '',
        WEEK: '',
        MONTH: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (type: string, value: string) => {
        setPrices(prev => ({ ...prev, [type]: value }));
    };

    const handleDeleteBike = async () => {
        if (!window.confirm(`Are you sure you want to delete ${bike.name}? This will remove all prices and bookings.`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/bikes/${bike.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (res.ok) {
                toast.success("Bike deleted successfully");
                fetchBikes();
            } else {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete bike");
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const updates = Object.entries(prices).filter(([_, val]) => val !== '');

        if (updates.length === 0) {
            toast.error("Please enter at least one price");
            setLoading(false);
            return;
        }

        try {
            // Process all updates sequentially or parallel
            const promises = updates.map(([type, price]) => {
                return fetch(`${API_BASE_URL}/admin/bikes/${bike.id}/price`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({
                        type,
                        price: parseInt(price),
                        validFrom: new Date().toISOString()
                    })
                }).then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || `Failed to update ${type} price`);
                    return data;
                });
            });

            await Promise.all(promises);
            toast.success(`Prices updated for ${bike.name}`);
            setPrices({ HOUR: '', DAY: '', WEEK: '', MONTH: '' });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{bike.name}</CardTitle>
                    <CardDescription>Set pricing tiers for this vehicle.</CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1"
                    onClick={handleDeleteBike}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                </Button>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Hourly (₹)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 50"
                                value={prices.HOUR}
                                onChange={e => handleChange('HOUR', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Daily (₹)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 300"
                                value={prices.DAY}
                                onChange={e => handleChange('DAY', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Weekly (₹)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 1500"
                                value={prices.WEEK}
                                onChange={e => handleChange('WEEK', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Monthly (₹)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 5000"
                                value={prices.MONTH}
                                onChange={e => handleChange('MONTH', e.target.value)}
                            />
                        </div>
                    </div>
                    <Button type="submit" size="sm" className="w-full" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Prices'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
