import { 
  users, type User, type InsertUser, 
  borrowers, type Borrower, type InsertBorrower,
  loans, type Loan, type InsertLoan,
  payments, type Payment, type InsertPayment
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Borrowers
  getBorrower(id: number): Promise<Borrower | undefined>;
  getBorrowers(): Promise<Borrower[]>;
  createBorrower(borrower: InsertBorrower): Promise<Borrower>;
  updateBorrower(id: number, borrower: Partial<InsertBorrower>): Promise<Borrower | undefined>;
  deleteBorrower(id: number): Promise<boolean>;
  
  // Loans
  getLoan(id: number): Promise<Loan | undefined>;
  getLoans(): Promise<Loan[]>;
  getLoansByBorrowerId(borrowerId: number): Promise<Loan[]>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined>;
  deleteLoan(id: number): Promise<boolean>;
  
  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPayments(): Promise<Payment[]>;
  getPaymentsByLoanId(loanId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private borrowers: Map<number, Borrower>;
  private loans: Map<number, Loan>;
  private payments: Map<number, Payment>;
  
  private userCurrentId: number;
  private borrowerCurrentId: number;
  private loanCurrentId: number;
  private paymentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.borrowers = new Map();
    this.loans = new Map();
    this.payments = new Map();
    
    this.userCurrentId = 1;
    this.borrowerCurrentId = 1;
    this.loanCurrentId = 1;
    this.paymentCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Borrower methods
  async getBorrower(id: number): Promise<Borrower | undefined> {
    return this.borrowers.get(id);
  }
  
  async getBorrowers(): Promise<Borrower[]> {
    return Array.from(this.borrowers.values());
  }
  
  async createBorrower(insertBorrower: InsertBorrower): Promise<Borrower> {
    const id = this.borrowerCurrentId++;
    const createdAt = new Date();
    const borrower: Borrower = { ...insertBorrower, id, createdAt };
    this.borrowers.set(id, borrower);
    return borrower;
  }
  
  async updateBorrower(id: number, borrower: Partial<InsertBorrower>): Promise<Borrower | undefined> {
    const existingBorrower = this.borrowers.get(id);
    
    if (!existingBorrower) {
      return undefined;
    }
    
    const updatedBorrower: Borrower = {
      ...existingBorrower,
      ...borrower
    };
    
    this.borrowers.set(id, updatedBorrower);
    return updatedBorrower;
  }
  
  async deleteBorrower(id: number): Promise<boolean> {
    return this.borrowers.delete(id);
  }
  
  // Loan methods
  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }
  
  async getLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values());
  }
  
  async getLoansByBorrowerId(borrowerId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.borrowerId === borrowerId
    );
  }
  
  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const id = this.loanCurrentId++;
    const createdAt = new Date();
    const loan: Loan = { ...insertLoan, id, createdAt };
    this.loans.set(id, loan);
    return loan;
  }
  
  async updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined> {
    const existingLoan = this.loans.get(id);
    
    if (!existingLoan) {
      return undefined;
    }
    
    const updatedLoan: Loan = {
      ...existingLoan,
      ...loan
    };
    
    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }
  
  async deleteLoan(id: number): Promise<boolean> {
    return this.loans.delete(id);
  }
  
  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }
  
  async getPaymentsByLoanId(loanId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.loanId === loanId
    );
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const createdAt = new Date();
    const payment: Payment = { ...insertPayment, id, createdAt };
    this.payments.set(id, payment);
    
    // Update loan status after payment
    const loan = await this.getLoan(payment.loanId);
    if (loan) {
      const payments = await this.getPaymentsByLoanId(loan.id);
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      let newStatus = loan.status;
      if (totalPaid >= Number(loan.principal)) {
        newStatus = 'paid';
      }
      
      await this.updateLoan(loan.id, { status: newStatus });
    }
    
    return payment;
  }
  
  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const existingPayment = this.payments.get(id);
    
    if (!existingPayment) {
      return undefined;
    }
    
    const updatedPayment: Payment = {
      ...existingPayment,
      ...payment
    };
    
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async deletePayment(id: number): Promise<boolean> {
    return this.payments.delete(id);
  }
}

export const storage = new MemStorage();
