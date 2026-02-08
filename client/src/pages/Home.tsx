import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
}

export function Home() {
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE_URL}/bikes`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setBikes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleBook = (bikeId: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        navigate(`/book/${bikeId}`);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Available Bikes</h1>
                    <p className="text-muted-foreground">Choose your ride and start your journey.</p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : bikes.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border-dashed border-2">
                    <p className="text-muted-foreground text-lg">No bikes available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bikes.map((bike) => (
                        <Card key={bike.id} className="overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-muted-foreground/20 group">
                            <div className="aspect-video w-full relative bg-muted overflow-hidden">
                                <img
                                    src={getDirectImageUrl(bike.imageUrl) || "https://placehold.co/600x400?text=Bike"}
                                    alt={bike.name}
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (bike.imageUrl && bike.imageUrl.includes('drive.google.com') && !img.src.includes('thumbnail')) {
                                            // Fallback to thumbnail service if direct view fails
                                            const match = bike.imageUrl.match(/(?:d\/|id=|open\?id=|file\/d\/)([a-zA-Z0-9_-]{25,})/);
                                            if (match) {
                                                img.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
                                                return;
                                            }
                                        }
                                        img.src = "https://placehold.co/600x400?text=Image+Unavailable";
                                    }}
                                />
                                <div className={cn(
                                    "absolute top-2 right-2 px-3 py-1 rounded-full text-[10px] font-black shadow-lg uppercase tracking-widest border backdrop-blur-md",
                                    bike.status === 'AVAILABLE'
                                        ? "bg-primary/90 text-black border-primary/50"
                                        : "bg-background/90 text-muted-foreground border-border"
                                )}>
                                    {bike.status}
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="line-clamp-1 text-xl">{bike.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    Premium bike for your daily commute or weekend adventure.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Starting from</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                        {bike.price && bike.price.length > 0 ? (
                                            bike.price.map((p, idx) => (
                                                <div key={idx} className="bg-secondary/50 px-3 py-1.5 rounded-md text-secondary-foreground border border-secondary font-mono font-medium">
                                                    ₹{p.price}<span className="text-xs opacity-70">/{p.type.substring(0, 3)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span>Price not set</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full font-semibold shadow-md active:scale-95 transition-transform"
                                    onClick={() => handleBook(bike.id)}
                                    disabled={bike.status !== 'AVAILABLE'}
                                    variant={bike.status === 'AVAILABLE' ? 'default' : 'secondary'}
                                >
                                    {bike.status === 'AVAILABLE' ? 'Book Now' : 'Unavailable'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
