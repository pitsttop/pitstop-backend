import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPart = (partData: any) =>
  prisma.part.create({ data: partData });
export const listParts = () => prisma.part.findMany();
export const findPartById = (id: string) =>
  prisma.part.findUnique({ where: { id } });
export const updatePart = (id: string, partData: any) =>
  prisma.part.update({ where: { id }, data: partData });
export const deletePart = (id: string) => prisma.part.delete({ where: { id } });
