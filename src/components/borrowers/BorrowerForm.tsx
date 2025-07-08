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
import { Textarea } from "@/components/ui/textarea";

// Form schema
const borrowerFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  rg: z.string().optional().or(z.literal("")),
  profession: z.string().optional().or(z.literal("")),
  income: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
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
      cpf: borrower?.cpf || "",
      phone: borrower?.phone || "",
      address: borrower?.address || "",
      city: borrower?.city || "",
      state: borrower?.state || "",
      zipCode: borrower?.zipCode || "",
      rg: borrower?.rg || "",
      profession: borrower?.profession || "",
      income: borrower?.income?.toString() || "",
      notes: borrower?.notes || "",
    },
  });

  const onSubmit = (data: BorrowerFormValues) => {
    // Convert income from string to number if provided
    const processedData: Omit<BorrowerType, "id"> = {
      name: data.name,
      cpf: data.cpf || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      rg: data.rg || undefined,
      profession: data.profession || undefined,
      income: data.income ? parseFloat(data.income) : undefined,
      notes: data.notes || undefined,
    };

    if (isEditing && borrower) {
      updateBorrower(borrower.id, processedData);
      navigate(`/borrowers/${borrower.id}`);
    } else {
      addBorrower(processedData);
      navigate("/borrowers");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
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
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CPF */}
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormDescription>
                    O CPF é opcional, mas recomendado para identificação.
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
                    O telefone é opcional, mas útil para contato.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* RG */}
            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000-0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ZIP Code */}
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Income */}
            <FormField
              control={form.control}
              name="income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renda Mensal</FormLabel>
                  <FormControl>
                    <Input placeholder="R$ 0,00" type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Renda mensal aproximada (opcional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre o cliente..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
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
                {isEditing ? "Atualizar" : "Criar"} Cliente
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
