import { pgTable, text, serial, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const borrowers = pgTable("borrowers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  borrowerId: serial("borrower_id").references(() => borrowers.id),
  principal: numeric("principal").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().$type<'active' | 'paid' | 'overdue' | 'defaulted'>(),
  frequency: text("frequency").notNull().$type<'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>(),
  nextPaymentDate: timestamp("next_payment_date"),
  installments: serial("installments"),
  installmentAmount: numeric("installment_amount"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  loanId: serial("loan_id").references(() => loans.id),
  date: timestamp("date").notNull(),
  amount: numeric("amount").notNull(),
  principal: numeric("principal").notNull(),
  interest: numeric("interest").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBorrowerSchema = createInsertSchema(borrowers).pick({
  name: true,
  email: true,
  phone: true,
});

export const insertLoanSchema = createInsertSchema(loans).pick({
  borrowerId: true,
  principal: true,
  interestRate: true,
  issueDate: true,
  dueDate: true,
  status: true,
  frequency: true,
  nextPaymentDate: true,
  installments: true,
  installmentAmount: true,
  notes: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  loanId: true,
  date: true,
  amount: true,
  principal: true,
  interest: true,
  notes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBorrower = z.infer<typeof insertBorrowerSchema>;
export type Borrower = typeof borrowers.$inferSelect;

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
