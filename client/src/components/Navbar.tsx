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
            <div className="container flex h-14 items-center max-w-screen-2xl mx-auto px-4">
                <Link to="/" className="mr-4 flex items-center space-x-2 shrink-0">
                    <span className="font-bold text-base sm:text-lg tracking-tight">RollingWheels</span>
                </Link>
                <div className="mr-4 flex">
                    <Link
                        to="/"
                        className="text-xs sm:text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Bikes
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
                                        "h-8 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm rounded-md transition-colors",
                                        location.pathname === '/login'
                                            ? "bg-white text-black border shadow-sm"
                                            : "bg-black text-white border-transparent"
                                    )}
                                >
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    asChild
                                    className={cn(
                                        "h-8 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm rounded-md transition-colors",
                                        location.pathname === '/signup'
                                            ? "bg-white text-black border shadow-sm"
                                            : "bg-black text-white border-transparent"
                                    )}
                                >
                                    <Link to="/signup">Sign Up</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    asChild
                                    className={cn(
                                        "h-8 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm rounded-md transition-colors",
                                        location.pathname === '/admin/login'
                                            ? "bg-white text-black border shadow-sm"
                                            : "bg-black text-white border-transparent"
                                    )}
                                >
                                    <Link to="/admin/login">Admin</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </nav>
    );
}
