import { useCallback } from "react";
import { toast } from "sonner";

export const useShowToast = () => {
    return useCallback(
        ({ title, description, variant }: {
            title: string;
            description?: string;
            variant?: "default" | "destructive" | "success"
        }) => {
            if (variant === "destructive") {
                toast.error(title, { description });
            } else if (variant === "success") {
                toast.success(title, { description });
            } else {
                toast(title, { description });
            }
        },
        []
    );
};