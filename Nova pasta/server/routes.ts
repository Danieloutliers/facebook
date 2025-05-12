import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBorrowerSchema, 
  insertLoanSchema, 
  insertPaymentSchema 
} from "@shared/schema";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

// Para usar __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/borrowers", async (_req: Request, res: Response) => {
    try {
      const borrowers = await storage.getBorrowers();
      res.json(borrowers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching borrowers" });
    }
  });
  
  app.get("/api/borrowers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid borrower ID" });
      }
      
      const borrower = await storage.getBorrower(id);
      if (!borrower) {
        return res.status(404).json({ message: "Borrower not found" });
      }
      
      res.json(borrower);
    } catch (error) {
      res.status(500).json({ message: "Error fetching borrower" });
    }
  });
  
  app.post("/api/borrowers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBorrowerSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid borrower data", errors: validatedData.error.format() });
      }
      
      const borrower = await storage.createBorrower(validatedData.data);
      res.status(201).json(borrower);
    } catch (error) {
      res.status(500).json({ message: "Error creating borrower" });
    }
  });
  
  app.patch("/api/borrowers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid borrower ID" });
      }
      
      const updateSchema = insertBorrowerSchema.partial();
      const validatedData = updateSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid borrower data", errors: validatedData.error.format() });
      }
      
      const updatedBorrower = await storage.updateBorrower(id, validatedData.data);
      if (!updatedBorrower) {
        return res.status(404).json({ message: "Borrower not found" });
      }
      
      res.json(updatedBorrower);
    } catch (error) {
      res.status(500).json({ message: "Error updating borrower" });
    }
  });
  
  app.delete("/api/borrowers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid borrower ID" });
      }
      
      const success = await storage.deleteBorrower(id);
      if (!success) {
        return res.status(404).json({ message: "Borrower not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting borrower" });
    }
  });
  
  // Loans routes
  app.get("/api/loans", async (_req: Request, res: Response) => {
    try {
      const loans = await storage.getLoans();
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Error fetching loans" });
    }
  });
  
  app.get("/api/loans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid loan ID" });
      }
      
      const loan = await storage.getLoan(id);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      res.json(loan);
    } catch (error) {
      res.status(500).json({ message: "Error fetching loan" });
    }
  });
  
  app.get("/api/borrowers/:id/loans", async (req: Request, res: Response) => {
    try {
      const borrowerId = parseInt(req.params.id);
      if (isNaN(borrowerId)) {
        return res.status(400).json({ message: "Invalid borrower ID" });
      }
      
      const loans = await storage.getLoansByBorrowerId(borrowerId);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Error fetching borrower loans" });
    }
  });
  
  app.post("/api/loans", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLoanSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid loan data", errors: validatedData.error.format() });
      }
      
      const loan = await storage.createLoan(validatedData.data);
      res.status(201).json(loan);
    } catch (error) {
      res.status(500).json({ message: "Error creating loan" });
    }
  });
  
  app.patch("/api/loans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid loan ID" });
      }
      
      const updateSchema = insertLoanSchema.partial();
      const validatedData = updateSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid loan data", errors: validatedData.error.format() });
      }
      
      const updatedLoan = await storage.updateLoan(id, validatedData.data);
      if (!updatedLoan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      res.json(updatedLoan);
    } catch (error) {
      res.status(500).json({ message: "Error updating loan" });
    }
  });
  
  app.delete("/api/loans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid loan ID" });
      }
      
      const success = await storage.deleteLoan(id);
      if (!success) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting loan" });
    }
  });
  
  // Payments routes
  app.get("/api/payments", async (_req: Request, res: Response) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments" });
    }
  });
  
  app.get("/api/payments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment" });
    }
  });
  
  app.get("/api/loans/:id/payments", async (req: Request, res: Response) => {
    try {
      const loanId = parseInt(req.params.id);
      if (isNaN(loanId)) {
        return res.status(400).json({ message: "Invalid loan ID" });
      }
      
      const payments = await storage.getPaymentsByLoanId(loanId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching loan payments" });
    }
  });
  
  app.post("/api/payments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPaymentSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid payment data", errors: validatedData.error.format() });
      }
      
      const payment = await storage.createPayment(validatedData.data);
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Error creating payment" });
    }
  });
  
  app.patch("/api/payments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      const updateSchema = insertPaymentSchema.partial();
      const validatedData = updateSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid payment data", errors: validatedData.error.format() });
      }
      
      const updatedPayment = await storage.updatePayment(id, validatedData.data);
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: "Error updating payment" });
    }
  });
  
  app.delete("/api/payments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      const success = await storage.deletePayment(id);
      if (!success) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting payment" });
    }
  });
  
  // Rotas para a versão HTML
  app.get("/html", (req, res) => {
    res.redirect("/html/index.html");
  });
  
  // Servir arquivos estáticos da versão HTML
  app.use("/html", express.static(path.join(__dirname, "..", "app html")));
  
  // Rota para o index.html da versão HTML
  app.get("/html/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "app html", "index.html"));
  });
  
  // Rota para download do zip da versão HTML
  app.get("/download-html", (req, res) => {
    const zipPath = path.join(__dirname, "..", "loanbuddy-html.zip");
    res.download(zipPath, "loanbuddy-html.zip", (err) => {
      if (err) {
        console.error("Erro ao enviar o arquivo zip:", err);
        res.status(500).send("Erro ao baixar o arquivo");
      }
    });
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
