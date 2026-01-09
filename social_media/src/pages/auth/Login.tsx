import { LoginFormField } from "@/components/form/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useShowToast } from "@/hooks/useToast";
import { ChevronLeft, Loader2 } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useShowToast();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await login(data.email, data.password);
            toast({ title: "Login successful!", description: "You have successfully logged in.", variant: "success" });
            navigate("/");
        } catch (err: unknown) {
            console.error("Login error:", err);
            toast({
                title: "Login error",
                description: "Could not log in with provided credentials",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
            <Link
                to="/"
                className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center text-sm font-medium transition-colors hover:text-primary"
            >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to home
            </Link>

            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Login
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email to access your account
                    </p>
                </div>

                <div className="grid gap-6 p-4 border rounded-xl bg-card shadow-sm">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid gap-2">
                                <LoginFormField
                                    name="email"
                                    label="Email"
                                    type="email"
                                    control={form.control}
                                    placeholder="name@example.com"
                                />
                                <LoginFormField
                                    name="password"
                                    label="Password"
                                    type="password"
                                    control={form.control}
                                    placeholder="••••••••"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Login
                            </Button>
                        </form>
                    </Form>
                </div>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/register" className="underline underline-offset-4 hover:text-primary">
                        Register now
                    </Link>
                </p>
            </div>
        </div>
    );
}