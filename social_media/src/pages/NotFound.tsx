import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative mb-8">
                <h1 className="text-9xl font-extrabold tracking-widest text-primary/20">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-20 h-20 text-primary animate-bounce" />
                </div>
            </div>

            <div className="space-y-4 max-w-md">
                <h2 className="text-3xl font-bold tracking-tight">
                    Oops! Page Not Found
                </h2>
                <p className="text-muted-foreground text-lg">
                    Mayber you mistyped the address or the page has been moved
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Button asChild variant="default" size="lg" className="gap-2">
                    <Link to="/">
                        <Home size={18} /> Go to Homepage
                    </Link>
                </Button>

                <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft size={18} /> Return to Previous Page
                </Button>
            </div>

            <div className="mt-16 text-sm text-muted-foreground/50 italic">
                "Not all who wander are lost"
            </div>
        </div>
    );
}