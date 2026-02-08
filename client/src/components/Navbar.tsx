import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-16 items-center w-full px-6 overflow-visible">
                <Link to="/" className="mr-6 flex items-center shrink-0">
                    <img src="/logo.png" alt="Rollin'Wheels Logo" className="h-20 w-auto object-contain" />
                </Link>
                <div className="mr-4 flex">
                    <Link
                        to="/"
                        className="text-xs sm:text-sm font-black transition-colors hover:text-primary text-foreground/80 uppercase tracking-tighter"
                    >
                        Explore Bikes
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                    </div>
                    <nav className="flex items-center space-x-1 sm:space-x-2">
                        {token ? (
                            <Button onClick={handleLogout} variant="secondary" size="sm">
                                Logout
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    asChild
                                    className={cn(
                                        "h-8 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm rounded-md transition-colors font-bold",
                                        location.pathname === '/login'
                                            ? "bg-primary text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                            : "bg-black text-white border border-primary/30 hover:border-primary/60"
                                    )}
                                >
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    asChild
                                    className={cn(
                                        "h-8 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm rounded-md transition-colors font-bold",
                                        location.pathname === '/signup'
                                            ? "bg-primary text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                            : "bg-black text-white border border-primary/30 hover:border-primary/60"
                                    )}
                                >
                                    <Link to="/signup">Sign Up</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </nav>
    );
}
