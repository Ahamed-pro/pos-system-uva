import express from "express";
import cors from "cors";
import { prisma } from "./prisma.js";

const app = express();

app.use(cors());
app.use(express.json());

// Product / SKU / Model search
app.get("/api/products/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const variants = await prisma.productVariant.findMany({
      where: {
        OR: [
          { sku: { contains: q } },
          {
            product: {
              OR: [
                { sku: { contains: q } },
                { modelNo: { contains: q } },
                { name: { contains: q } },
              ],
            },
          },
        ],
      },
      include: {
        product: true,
        stocks: true,
      },
      take: 30,
    });

    const data = variants.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      productName: v.product.name,
      modelNo: v.product.modelNo,
      color: v.color,
      material: v.material,
      size: v.size,
      price: Number(v.price),
      showroomQty:
        v.stocks.find((s) => s.location === "SHOWROOM")?.quantity || 0,
      warehouseQty:
        v.stocks.find((s) => s.location === "WAREHOUSE")?.quantity || 0,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Create sale
app.post("/api/sales", async (req, res) => {
  try {
    const {
      customerName = "Walk-in Customer",
      items = [],
      paidAmount = 0,
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
      0
    );

    const balance = Math.max(total - Number(paidAmount), 0);
    const invoiceNo = `INV-${Date.now()}`;

    const sale = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const stock = await tx.stock.findUnique({
          where: {
            variantId_location: {
              variantId: item.variantId,
              location: item.location,
            },
          },
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for item ${item.variantId} at ${item.location}`
          );
        }
      }

      const created = await tx.sale.create({
        data: {
          invoiceNo,
          customerName,
          total,
          paidAmount: Number(paidAmount),
          balance,
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              location: item.location,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              lineTotal: Number(item.unitPrice) * Number(item.quantity),
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      for (const item of items) {
        await tx.stock.update({
          where: {
            variantId_location: {
              variantId: item.variantId,
              location: item.location,
            },
          },
          data: {
            quantity: {
              decrement: Number(item.quantity),
            },
          },
        });
      }

      return created;
    });

    res.json(sale);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Sale failed" });
  }
});

// Recent sales for demo
app.get("/api/sales", async (_req, res) => {
  const sales = await prisma.sale.findMany({
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json(sales);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`POS API running: http://localhost:${PORT}`);
});