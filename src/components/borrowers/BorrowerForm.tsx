import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useLoan } from "@/context/LoanContext";
import { BorrowerType } from "@/types";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema
const borrowerFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type BorrowerFormValues = z.infer<typeof borrowerFormSchema>;

interface BorrowerFormProps {
  borrower?: BorrowerType;
  isEditing?: boolean;
}

export default function BorrowerForm({ borrower, isEditing = false }: BorrowerFormProps) {
  const [, navigate] = useLocation();
  const { addBorrower, updateBorrower } = useLoan();

  // Set up form with default values
  const form = useForm<BorrowerFormValues>({
    resolver: zodResolver(borrowerFormSchema),
    defaultValues: {
      name: borrower?.name || "",
      email: borrower?.email || "",
      phone: borrower?.phone || "",
    },
  });

  const onSubmit = (data: BorrowerFormValues) => {
    if (isEditing && borrower) {
      updateBorrower(borrower.id, data);
      navigate(`/borrowers/${borrower.id}`);
    } else {
      addBorrower(data);
      navigate("/borrowers");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Mutuário" : "Novo Mutuário"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do mutuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    O email é opcional, mas pode ser útil para contato.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                  </FormControl>
                  <FormDescription>
                    O telefone é opcional, mas pode ser útil para contato.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => navigate("/borrowers")}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Criar"} Mutuário
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
