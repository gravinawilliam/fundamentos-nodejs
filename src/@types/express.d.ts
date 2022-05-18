import { Customer } from '../main';

declare namespace Express {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export interface Request {
    customer: Customer;
  }
}
