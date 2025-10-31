import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const createService = (serviceData: Prisma.ServiceCreateInput) =>
  prisma.service.create({ data: serviceData });
export const listServices = () => prisma.service.findMany();
export const findServiceById = (id: string) =>
  prisma.service.findUnique({ where: { id } });
export const updateService = (
  id: string,
  serviceData: Prisma.ServiceUpdateInput,
) => prisma.service.update({ where: { id }, data: serviceData });
export const deleteService = (id: string) =>
  prisma.service.delete({ where: { id } });
