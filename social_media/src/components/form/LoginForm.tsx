import type { Control, FieldValues, Path } from "react-hook-form";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";

interface LoginFormFieldProps<TFormValues extends FieldValues> {
    name: Path<TFormValues>;
    control: Control<TFormValues>;
    label: string;
    type?: string;
    placeholder?: string;
}

export function LoginFormField<TFormValues extends FieldValues>({
    name,
    control,
    label,
    type = "text",
    placeholder,
}: LoginFormFieldProps<TFormValues>) {
    return (
        <FormField<TFormValues>
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <input
                            type={type}
                            {...field}
                            placeholder={placeholder}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}