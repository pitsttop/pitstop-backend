import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const createPart = (partData: Prisma.PartCreateInput) =>
  prisma.part.create({ data: partData });
export const listParts = () => prisma.part.findMany();
export const findPartById = (id: string) =>
  prisma.part.findUnique({ where: { id } });
export const updatePart = (id: string, partData: Prisma.PartUpdateInput) =>
  prisma.part.update({ where: { id }, data: partData });
export const deletePart = (id: string) => prisma.part.delete({ where: { id } });
