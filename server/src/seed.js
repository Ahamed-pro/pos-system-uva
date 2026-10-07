import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  const sofa = await prisma.product.create({
    data: {
      sku: "SOF-001",
      modelNo: "LUX-SOFA-2026",
      name: "Luxury 3 Seater Sofa",
      price: 145000,
      variants: {
        create: [
          {
            sku: "SOF-001-BLK-FAB-3S",
            color: "Black",
            material: "Fabric",
            size: "3 Seater",
            price: 145000,
            stocks: {
              create: [
                { location: "SHOWROOM", quantity: 4 },
                { location: "WAREHOUSE", quantity: 10 },
              ],
            },
          },
          {
            sku: "SOF-001-BRN-LTH-3S",
            color: "Brown",
            material: "Leather",
            size: "3 Seater",
            price: 189000,
            stocks: {
              create: [
                { location: "SHOWROOM", quantity: 2 },
                { location: "WAREHOUSE", quantity: 6 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      sku: "DIN-001",
      modelNo: "OAK-DIN-6P",
      name: "Oak Dining Table Set",
      price: 98000,
      variants: {
        create: [
          {
            sku: "DIN-001-OAK-6P",
            color: "Natural Oak",
            material: "Solid Wood",
            size: "6 Persons",
            price: 98000,
            stocks: {
              create: [
                { location: "SHOWROOM", quantity: 3 },
                { location: "WAREHOUSE", quantity: 8 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Demo data created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());