import express, { Request, Response } from 'express';
import * as uuid from 'uuid';

const app = express();

const customers: Customer[] = [];

function verifyExistsAccountCPF(request: any, response: Response, next: () => any) {
  const { cpf } = request.headers;

  const foundCustomer = customers.find(customer => customer.cpf === cpf);

  if (foundCustomer === undefined) {
    return response.status(404).json({ error: 'Customer not found' });
  }

  request.customer = foundCustomer;

  return next();
}

function getBalance(statement: Statement[]): number {
  return statement.reduce((accumulator: number, operation) => {
    return operation.type === 'deposit' ? accumulator + operation.amount : accumulator - operation.amount;
  }, 0);
}

app.use(express.json());

app.post('/deposit', verifyExistsAccountCPF, (request: any, response: Response): Response => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation: Statement = {
    description,
    amount,
    createdAt: new Date(),
    type: 'deposit'
  };

  customer.statement.push(statementOperation);

  return response.status(200).json({ operation: statementOperation });
});

app.post('/withdraw', verifyExistsAccountCPF, (request: any, response: Response): Response => {
  const { description, amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);
  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient balance' });
  }

  const statementOperation: Statement = {
    description,
    amount,
    createdAt: new Date(),
    type: 'withdraw'
  };

  customer.statement.push(statementOperation);

  return response.status(200).json({ operation: statementOperation });
});

app.get('/statement', verifyExistsAccountCPF, (request: any, response: Response): Response => {
  const { customer } = request;

  return response.status(200).json({ statement: customer.statement });
});

app.get('/statement/date', verifyExistsAccountCPF, (request: any, response: any) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');

  const { statement } = customer as Customer;

  const foundStatements = statement.filter(
    statementCurrent => statementCurrent.createdAt.toDateString() === new Date(dateFormat).toDateString()
  );

  return response.status(200).json({ statement: foundStatements });
});

app.get('/balance', verifyExistsAccountCPF, (request: any, response: any) => {
  const { customer } = request;
  const { statement } = customer as Customer;
  const balance = getBalance(statement);

  return response.status(200).json({ balance });
});

app.post('/account', (request: Request, response: Response): Response => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);

  if (customerAlreadyExists) {
    return response.status(409).json({ error: 'Customer already exists' });
  }

  const id = uuid.v4();
  customers.push({ id, cpf, name, statement: [] });
  return response.status(201).json({ account: { id } });
});

app.put('/account', verifyExistsAccountCPF, (request: any, response: any) => {
  const { customer } = request;
  const { name } = request.body;

  if (!name || name === '') {
    return response.status(400).json({
      error: 'Invalid name'
    });
  }

  customer.name = name;

  return response.status(200).json();
});

app.get('/account', verifyExistsAccountCPF, (request: any, response: any) => {
  const { customer } = request;

  return response.status(200).json({ customer });
});

app.delete('/account', verifyExistsAccountCPF, (request: any, response: any) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(204).json({});
});

app.listen(2222);

type Statement = {
  description: string;
  amount: number;
  createdAt: Date;
  type: 'deposit' | 'withdraw';
};

export type Customer = {
  id: string;
  name: string;
  cpf: string;
  statement: Statement[];
};
