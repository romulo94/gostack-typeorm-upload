import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

export default class CreateTransactionService {
  public async execute({
    category,
    type,
    title,
    value,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Insufficient balance', 400);
    }

    let findCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!findCategory) {
      findCategory = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(findCategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      category: findCategory,
      type,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}
