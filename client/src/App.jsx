import { useEffect, useMemo, useState } from "react";

const API = "/api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "pos", label: "POS Billing", icon: "▣" },
  { id: "products", label: "Products", icon: "▤" },
  { id: "customers", label: "Customers", icon: "◉" },
  { id: "installments", label: "Installments", icon: "◫" },
  { id: "deliveries", label: "Deliveries", icon: "➜" },
  { id: "reports", label: "Daily Report", icon: "▥" },
];

const emptyProduct = {
  id: "",
  name: "",
  sku: "",
  modelNo: "",
  color: "",
  material: "",
  size: "",
  price: "",
  showroomQty: 0,
  warehouseQty: 0,
  image: "",
};

const emptyCustomer = {
  id: "",
  name: "",
  phone: "",
  address: "",
  isRegular: false,
  offerType: "PERCENTAGE",
  offerValue: 0,
};

const emptyInstallment = {
  id: "",
  invoice: "",
  customer: "",
  amount: "",
  dueDate: "",
  status: "PENDING",
};

const emptyDelivery = {
  id: "",
  invoice: "",
  customer: "",
  address: "",
  driver: "",
  date: "",
  status: "PENDING",
};

function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

const money = (value) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");

  const [query, setQuery] = useState("");
  const [apiProducts, setApiProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualDiscount, setManualDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastSale, setLastSale] = useState(null);

  const [products, setProducts] = useLocalState("uva_pos_products", [
    {
      id: 1,
      name: "Luxury 3 Seater Sofa",
      sku: "SOF-001-BLK",
      modelNo: "LUX-SOFA-2026",
      color: "Black",
      material: "Fabric",
      size: "3 Seater",
      price: 145000,
      showroomQty: 4,
      warehouseQty: 10,
      image: "",
    },
    {
      id: 2,
      name: "Oak Dining Table Set",
      sku: "DIN-001-OAK",
      modelNo: "OAK-DIN-6P",
      color: "Natural Oak",
      material: "Solid Wood",
      size: "6 Persons",
      price: 98000,
      showroomQty: 3,
      warehouseQty: 8,
      image: "",
    },
    {
      id: 3,
      name: "Queen Size Bed Frame",
      sku: "BED-001-WAL",
      modelNo: "WAL-QUEEN-01",
      color: "Walnut",
      material: "Mahogany Wood",
      size: "Queen",
      price: 125000,
      showroomQty: 2,
      warehouseQty: 7,
      image: "",
    },
  ]);

  const [customers, setCustomers] = useLocalState("uva_pos_customers", [
    {
      id: 1,
      name: "Nimal Perera",
      phone: "0771234567",
      address: "Kandy",
      isRegular: true,
      offerType: "PERCENTAGE",
      offerValue: 5,
    },
    {
      id: 2,
      name: "Kumari Silva",
      phone: "0719876543",
      address: "Colombo",
      isRegular: false,
      offerType: "PERCENTAGE",
      offerValue: 0,
    },
  ]);

  const [installments, setInstallments] = useLocalState(
    "uva_pos_installments",
    [
      {
        id: 1,
        invoice: "INV-1001",
        customer: "Nimal Perera",
        amount: 25000,
        dueDate: "2026-10-10",
        status: "PENDING",
      },
      {
        id: 2,
        invoice: "INV-1002",
        customer: "Kumari Silva",
        amount: 18000,
        dueDate: "2026-09-28",
        status: "LATE",
      },
    ]
  );

  const [deliveries, setDeliveries] = useLocalState("uva_pos_deliveries", [
    {
      id: 1,
      invoice: "INV-1001",
      customer: "Nimal Perera",
      address: "No 12, Temple Road, Kandy",
      driver: "Sunil",
      date: "2026-10-04",
      status: "SCHEDULED",
    },
    {
      id: 2,
      invoice: "INV-1002",
      customer: "Kumari Silva",
      address: "No 45, Lake Road, Colombo",
      driver: "Kasun",
      date: "2026-10-03",
      status: "DISPATCHED",
    },
  ]);

  const [sales, setSales] = useLocalState("uva_pos_sales", []);

  const [productModal, setProductModal] = useState(false);
  const [productForm, setProductForm] = useState(emptyProduct);

  const [customerModal, setCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);

  const [installmentModal, setInstallmentModal] = useState(false);
  const [installmentForm, setInstallmentForm] = useState(emptyInstallment);

  const [deliveryModal, setDeliveryModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState(emptyDelivery);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__uvaToastTimer);
    window.__uvaToastTimer = window.setTimeout(() => setToast(""), 2600);
  };

  const searchApiProducts = async () => {
    if (!query.trim()) {
      setApiProducts([]);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API}/products/search?q=${encodeURIComponent(query)}`
      );

      if (!res.ok) {
        setApiProducts([]);
        return;
      }

      const data = await res.json();
      setApiProducts(Array.isArray(data) ? data : []);
    } catch {
      setApiProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(searchApiProducts, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const posProducts = useMemo(() => {
    const localProducts = products.map((product) => ({
      variantId: `local-${product.id}`,
      localId: product.id,
      productName: product.name,
      sku: product.sku,
      modelNo: product.modelNo,
      color: product.color,
      material: product.material,
      size: product.size,
      price: Number(product.price),
      showroomQty: Number(product.showroomQty),
      warehouseQty: Number(product.warehouseQty),
      image: product.image || "",
      location: "SHOWROOM",
      source: "local",
    }));

    const normalizedApi = apiProducts.map((product) => ({
      ...product,
      image: "",
      location: "SHOWROOM",
      source: "api",
    }));

    if (!query.trim()) return localProducts;

    const q = query.toLowerCase();

    const localFiltered = localProducts.filter((product) =>
      [product.productName, product.sku, product.modelNo]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );

    return [...localFiltered, ...normalizedApi];
  }, [products, apiProducts, query]);

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => String(customer.id) === String(selectedCustomerId)
      ),
    [customers, selectedCustomerId]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      ),
    [cart]
  );

  const regularDiscount = useMemo(() => {
    if (!selectedCustomer?.isRegular) return 0;

    const offer = Number(selectedCustomer.offerValue || 0);

    if (selectedCustomer.offerType === "FIXED") {
      return Math.min(offer, subtotal);
    }

    return Math.min(subtotal * (offer / 100), subtotal);
  }, [selectedCustomer, subtotal]);

  const finalTotal = Math.max(
    subtotal - regularDiscount - Number(manualDiscount || 0) + Number(deliveryFee || 0),
    0
  );

  const paid = Math.max(Number(paidAmount || 0), 0);
  const remainingToPay = Math.max(finalTotal - paid, 0);
  const changeToReturn = Math.max(paid - finalTotal, 0);

  const addToCart = (product) => {
    setError("");
    setSuccess("");

    const location = product.location || "SHOWROOM";
    const available =
      location === "SHOWROOM" ? product.showroomQty : product.warehouseQty;

    if (available <= 0) {
      setError(`No stock available in ${location.toLowerCase()}.`);
      return;
    }

    setCart((previous) => {
      const index = previous.findIndex(
        (item) =>
          item.variantId === product.variantId && item.location === location
      );

      if (index >= 0) {
        const item = previous[index];

        if (item.quantity >= available) {
          setError(`Only ${available} unit(s) available.`);
          return previous;
        }

        return previous.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          ...product,
          location,
          quantity: 1,
        },
      ];
    });

    showToast(`${product.productName} added to bill`);
  };

  const updateCartItem = (index, patch) => {
    setCart((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  };

  const changeCartLocation = (index, location) => {
    const item = cart[index];

    if (!item) return;

    const available =
      location === "SHOWROOM" ? item.showroomQty : item.warehouseQty;

    if (available <= 0) {
      showToast(`No stock available in ${location.toLowerCase()}`);
      return;
    }

    updateCartItem(index, {
      location,
      quantity: Math.min(Number(item.quantity), Number(available)),
    });
  };

  const changeCartQuantity = (index, quantity) => {
    const item = cart[index];

    if (!item) return;

    const available =
      item.location === "SHOWROOM" ? item.showroomQty : item.warehouseQty;

    const safeQuantity = Math.max(
      1,
      Math.min(Number(quantity || 1), Number(available))
    );

    updateCartItem(index, { quantity: safeQuantity });
  };

  const removeCartItem = (index) => {
    setCart((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    showToast("Item removed from bill");
  };

  const saveSale = () => {
    setError("");
    setSuccess("");

    if (!cart.length) {
      setError("Please add at least one product to the bill.");
      return;
    }

    const invoiceNo = `UVA-${Date.now().toString().slice(-7)}`;

    const createdSale = {
      id: Date.now(),
      invoiceNo,
      customerName: selectedCustomer?.name || "Walk-in Customer",
      customerId: selectedCustomer?.id || null,
      total: finalTotal,
      subtotal,
      regularDiscount,
      manualDiscount: Number(manualDiscount || 0),
      deliveryFee: Number(deliveryFee || 0),
      paidAmount: paid,
      balance: remainingToPay,
      change: changeToReturn,
      createdAt: new Date().toISOString(),
      items: cart,
    };

    setSales((previous) => [createdSale, ...previous]);

    setProducts((previous) =>
      previous.map((product) => {
        const relevantCartItems = cart.filter(
          (item) =>
            String(item.variantId) === `local-${product.id}` ||
            String(item.localId) === String(product.id)
        );

        if (!relevantCartItems.length) return product;

        let showroomQty = Number(product.showroomQty);
        let warehouseQty = Number(product.warehouseQty);

        relevantCartItems.forEach((item) => {
          if (item.location === "SHOWROOM") {
            showroomQty = Math.max(0, showroomQty - Number(item.quantity));
          } else {
            warehouseQty = Math.max(0, warehouseQty - Number(item.quantity));
          }
        });

        return { ...product, showroomQty, warehouseQty };
      })
    );

    setLastSale(createdSale);
    setSuccess(`Sale completed successfully: ${invoiceNo}`);
    showToast("Sale completed successfully");

    setCart([]);
    setSelectedCustomerId("");
    setManualDiscount(0);
    setDeliveryFee(0);
    setPaidAmount(0);
  };

  const printReceipt = () => {
    if (!lastSale) {
      showToast("Complete a sale first.");
      return;
    }

    window.print();
  };

  const openNewProduct = () => {
    setProductForm(emptyProduct);
    setProductModal(true);
  };

  const saveProduct = () => {
    if (!productForm.name.trim() || !productForm.sku.trim()) {
      showToast("Product name and SKU are required.");
      return;
    }

    if (Number(productForm.price) < 0 || productForm.price === "") {
      showToast("Enter a valid product price.");
      return;
    }

    const cleanProduct = {
      ...productForm,
      price: Number(productForm.price),
      showroomQty: Number(productForm.showroomQty || 0),
      warehouseQty: Number(productForm.warehouseQty || 0),
    };

    if (cleanProduct.id) {
      setProducts((previous) =>
        previous.map((product) =>
          product.id === cleanProduct.id ? cleanProduct : product
        )
      );
      showToast("Product updated successfully");
    } else {
      setProducts((previous) => [
        { ...cleanProduct, id: Date.now() },
        ...previous,
      ]);
      showToast("Product added successfully");
    }

    setProductForm(emptyProduct);
    setProductModal(false);
  };

  const deleteProduct = (id) => {
    if (!window.confirm("Delete this product?")) return;

    setProducts((previous) => previous.filter((product) => product.id !== id));
    showToast("Product deleted");
  };

  const handleProductImage = (file) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Select an image below 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProductForm((current) => ({
        ...current,
        image: String(reader.result || ""),
      }));
    };

    reader.readAsDataURL(file);
  };

  const openNewCustomer = () => {
    setCustomerForm(emptyCustomer);
    setCustomerModal(true);
  };

  const saveCustomer = () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      showToast("Customer name and phone are required.");
      return;
    }

    const cleanCustomer = {
      ...customerForm,
      isRegular: Boolean(customerForm.isRegular),
      offerValue: Number(customerForm.offerValue || 0),
    };

    if (cleanCustomer.id) {
      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === cleanCustomer.id ? cleanCustomer : customer
        )
      );
      showToast("Customer updated successfully");
    } else {
      setCustomers((previous) => [
        { ...cleanCustomer, id: Date.now() },
        ...previous,
      ]);
      showToast("Customer added successfully");
    }

    setCustomerForm(emptyCustomer);
    setCustomerModal(false);
  };

  const deleteCustomer = (id) => {
    if (!window.confirm("Delete this customer?")) return;

    setCustomers((previous) =>
      previous.filter((customer) => customer.id !== id)
    );

    if (String(selectedCustomerId) === String(id)) {
      setSelectedCustomerId("");
    }

    showToast("Customer deleted");
  };

  const openNewInstallment = () => {
    setInstallmentForm(emptyInstallment);
    setInstallmentModal(true);
  };

  const saveInstallment = () => {
    if (!installmentForm.invoice.trim() || !installmentForm.customer.trim()) {
      showToast("Invoice and customer are required.");
      return;
    }

    if (!Number(installmentForm.amount)) {
      showToast("Enter a valid installment amount.");
      return;
    }

    const cleanInstallment = {
      ...installmentForm,
      amount: Number(installmentForm.amount),
    };

    if (cleanInstallment.id) {
      setInstallments((previous) =>
        previous.map((installment) =>
          installment.id === cleanInstallment.id
            ? cleanInstallment
            : installment
        )
      );
      showToast("Installment updated");
    } else {
      setInstallments((previous) => [
        { ...cleanInstallment, id: Date.now() },
        ...previous,
      ]);
      showToast("Installment added");
    }

    setInstallmentForm(emptyInstallment);
    setInstallmentModal(false);
  };

  const markInstallmentPaid = (id) => {
    setInstallments((previous) =>
      previous.map((installment) =>
        installment.id === id
          ? { ...installment, status: "PAID" }
          : installment
      )
    );

    showToast("Installment marked as paid");
  };

  const deleteInstallment = (id) => {
    if (!window.confirm("Delete this installment?")) return;

    setInstallments((previous) =>
      previous.filter((installment) => installment.id !== id)
    );

    showToast("Installment deleted");
  };

  const openNewDelivery = () => {
    setDeliveryForm(emptyDelivery);
    setDeliveryModal(true);
  };

  const saveDelivery = () => {
    if (!deliveryForm.invoice.trim() || !deliveryForm.address.trim()) {
      showToast("Invoice number and address are required.");
      return;
    }

    if (deliveryForm.id) {
      setDeliveries((previous) =>
        previous.map((delivery) =>
          delivery.id === deliveryForm.id ? deliveryForm : delivery
        )
      );
      showToast("Delivery updated");
    } else {
      setDeliveries((previous) => [
        { ...deliveryForm, id: Date.now() },
        ...previous,
      ]);
      showToast("Delivery added");
    }

    setDeliveryForm(emptyDelivery);
    setDeliveryModal(false);
  };

  const updateDeliveryStatus = (id, status) => {
    setDeliveries((previous) =>
      previous.map((delivery) =>
        delivery.id === id ? { ...delivery, status } : delivery
      )
    );

    showToast(`Delivery changed to ${status.toLowerCase()}`);
  };

  const deleteDelivery = (id) => {
    if (!window.confirm("Delete this delivery?")) return;

    setDeliveries((previous) =>
      previous.filter((delivery) => delivery.id !== id)
    );

    showToast("Delivery deleted");
  };

  const totalSales = useMemo(
    () => sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    [sales]
  );

  const activeDeliveries = deliveries.filter(
    (delivery) => delivery.status !== "DELIVERED" && delivery.status !== "CANCELLED"
  ).length;

  const pendingInstallments = installments.filter(
    (installment) => installment.status !== "PAID"
  ).length;

  const goTo = (nextPage) => {
    setPage(nextPage);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
         
          <img src="/logo.png" className="brand-logo" alt="Uva Furnitures" />
          <div>
            <strong>Uva Furnitures</strong>
            <span>Style Your Space</span>
          </div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => goTo(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user">
            <div className="avatar">A</div>
            <div>
              <strong>Admin User</strong>
              <span>Uva Showroom</span>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="main">
        <header className="topbar">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            ☰
          </button>

          <div>
            <h1>{NAV_ITEMS.find((item) => item.id === page)?.label}</h1>
            <p className="topbar-subtitle">Uva Furnitures Management System</p>
          </div>

          <div className="topbar-actions">
            <span className="date-pill">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {page === "dashboard" && (
          <Dashboard
            totalSales={totalSales}
            saleCount={sales.length}
            activeDeliveries={activeDeliveries}
            pendingInstallments={pendingInstallments}
            sales={sales}
            goTo={goTo}
          />
        )}

        {page === "pos" && (
          <div className="pos-layout">
            <section className="panel product-panel">
              <div className="panel-head">
                <div>
                  <h2>Furniture Catalogue</h2>
                  <p className="muted">Search by product name, SKU, or model number</p>
                </div>

                <input
                  className="search-input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search SKU / Model No / Product..."
                />
              </div>

              {loading && <p className="muted">Searching products...</p>}
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}

              <div className="product-grid">
                {posProducts.map((product) => (
                  <button
                    key={`${product.variantId}-${product.sku}`}
                    className="product-card"
                    onClick={() => addToCart(product)}
                  >
                    <div className="product-thumb">
                      {product.image ? (
                        <img src={product.image} alt={product.productName} />
                      ) : (
                        <span>🛋️</span>
                      )}
                    </div>

                    <strong>{product.productName}</strong>
                    <span className="muted">{product.modelNo}</span>
                    <span className="sku-text">SKU: {product.sku}</span>

                    <span className="variant-text">
                      {[product.color, product.material, product.size]
                        .filter(Boolean)
                        .join(" • ") || "Standard"}
                    </span>

                    <strong className="product-price">{money(product.price)}</strong>

                    <div className="stock-badges">
                      <span className={product.showroomQty > 0 ? "stock-ok" : "stock-low"}>
                        Showroom: {product.showroomQty}
                      </span>
                      <span className={product.warehouseQty > 0 ? "stock-ok" : "stock-low"}>
                        Warehouse: {product.warehouseQty}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {!loading && !posProducts.length && (
                <div className="empty-state">
                  <span>⌕</span>
                  <p>No products found.</p>
                </div>
              )}
            </section>

            <section className="panel bill-panel">
              <div className="bill-title">
                <div>
                  <h2>Current Bill</h2>
                  <p className="muted">{cart.length} item(s) in cart</p>
                </div>

                {cart.length > 0 && (
                  <button className="btn text-btn" onClick={() => setCart([])}>
                    Clear cart
                  </button>
                )}
              </div>

              {!cart.length && (
                <div className="empty-cart">
                  <span>🧾</span>
                  <p>Your bill is empty</p>
                  <small>Select furniture items from the catalogue.</small>
                </div>
              )}

              <div className="cart-list">
                {cart.map((item, index) => {
                  const available =
                    item.location === "SHOWROOM"
                      ? item.showroomQty
                      : item.warehouseQty;

                  return (
                    <div className="cart-item" key={`${item.variantId}-${index}`}>
                      <div className="cart-image">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} />
                        ) : (
                          "🪑"
                        )}
                      </div>

                      <div className="cart-info">
                        <strong>{item.productName}</strong>
                        <span>{item.sku}</span>
                        <span>{money(item.price)} each</span>
                      </div>

                      <div className="cart-controls">
                        <select
                          value={item.location}
                          onChange={(event) =>
                            changeCartLocation(index, event.target.value)
                          }
                        >
                          <option value="SHOWROOM">Showroom</option>
                          <option value="WAREHOUSE">Warehouse</option>
                        </select>

                        <input
                          type="number"
                          min="1"
                          max={available}
                          value={item.quantity}
                          onChange={(event) =>
                            changeCartQuantity(index, event.target.value)
                          }
                        />

                        <button
                          className="remove-btn"
                          title="Remove item"
                          onClick={() => removeCartItem(index)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="billing-section">
                <label className="field">
                  <span>Customer</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(event) => setSelectedCustomerId(event.target.value)}
                  >
                    <option value="">Walk-in customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.isRegular ? " — Regular Customer" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedCustomer?.isRegular && (
                  <div className="offer-notice">
                    <span>★</span>
                    <div>
                      <strong>Regular Customer Offer Applied</strong>
                      <p>
                        {selectedCustomer.offerType === "PERCENTAGE"
                          ? `${selectedCustomer.offerValue}% discount`
                          : `${money(selectedCustomer.offerValue)} discount`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="summary-box">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>

                  {regularDiscount > 0 && (
                    <div className="summary-row discount-row">
                      <span>Regular customer offer</span>
                      <strong>- {money(regularDiscount)}</strong>
                    </div>
                  )}

                  <label className="summary-input">
                    <span>Additional discount</span>
                    <input
                      type="number"
                      min="0"
                      value={manualDiscount}
                      onChange={(event) => setManualDiscount(event.target.value)}
                    />
                  </label>

                  <label className="summary-input">
                    <span>Delivery fee</span>
                    <input
                      type="number"
                      min="0"
                      value={deliveryFee}
                      onChange={(event) => setDeliveryFee(event.target.value)}
                    />
                  </label>

                  <div className="summary-row total-row">
                    <span>Total Bill</span>
                    <strong>{money(finalTotal)}</strong>
                  </div>

                  <label className="summary-input paid-input">
                    <span>Customer Paid Amount</span>
                    <input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(event) => setPaidAmount(event.target.value)}
                      placeholder="Enter paid amount"
                    />
                  </label>

                  <div className="payment-grid">
                    <div className="payment-card remaining-card">
                      <span>Customer needs to pay</span>
                      <strong>{money(remainingToPay)}</strong>
                    </div>

                    <div className="payment-card change-card">
                      <span>Return balance to customer</span>
                      <strong>{money(changeToReturn)}</strong>
                    </div>
                  </div>

                  {paid > 0 && remainingToPay > 0 && (
                    <p className="payment-alert unpaid-alert">
                      Customer still needs to pay {money(remainingToPay)}.
                    </p>
                  )}

                  {changeToReturn > 0 && (
                    <p className="payment-alert change-alert">
                      Give {money(changeToReturn)} as change to the customer.
                    </p>
                  )}
                </div>

                <button className="complete-sale-btn" onClick={saveSale}>
                  Complete Sale
                </button>

                {lastSale && (
                  <button className="print-btn" onClick={printReceipt}>
                    Print 80mm Receipt
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {page === "products" && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Product Inventory</h2>
                <p className="muted">Manage furniture, models, stock, and photos</p>
              </div>

              <button className="btn primary-btn" onClick={openNewProduct}>
                + Add Product
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Variant</th>
                    <th>Showroom</th>
                    <th>Warehouse</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="table-product">
                          <div className="table-image">
                            {product.image ? (
                              <img src={product.image} alt={product.name} />
                            ) : (
                              "🛋️"
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <span>{product.modelNo}</span>
                          </div>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>
                        {[product.color, product.material, product.size]
                          .filter(Boolean)
                          .join(" • ") || "Standard"}
                      </td>
                      <td>{product.showroomQty}</td>
                      <td>{product.warehouseQty}</td>
                      <td>{money(product.price)}</td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn small-btn"
                            onClick={() => {
                              setProductForm(product);
                              setProductModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn small-btn danger-btn"
                            onClick={() => deleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === "customers" && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Customer Management</h2>
                <p className="muted">
                  Add regular customers and set their special offers
                </p>
              </div>

              <button className="btn primary-btn" onClick={openNewCustomer}>
                + Add Customer
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Customer Type</th>
                    <th>Regular Customer Offer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.name}</strong>
                      </td>
                      <td>{customer.phone}</td>
                      <td>{customer.address}</td>
                      <td>
                        {customer.isRegular ? (
                          <span className="badge regular-badge">Regular</span>
                        ) : (
                          <span className="badge normal-badge">Normal</span>
                        )}
                      </td>
                      <td>
                        {customer.isRegular
                          ? customer.offerType === "PERCENTAGE"
                            ? `${customer.offerValue}% discount`
                            : `${money(customer.offerValue)} discount`
                          : "No offer"}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn small-btn"
                            onClick={() => {
                              setCustomerForm(customer);
                              setCustomerModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn small-btn danger-btn"
                            onClick={() => deleteCustomer(customer.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === "installments" && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Installment Payments</h2>
                <p className="muted">Track customer payment schedules</p>
              </div>

              <button className="btn primary-btn" onClick={openNewInstallment}>
                + Add Installment
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((installment) => (
                    <tr key={installment.id}>
                      <td>{installment.invoice}</td>
                      <td>{installment.customer}</td>
                      <td>{money(installment.amount)}</td>
                      <td>{installment.dueDate}</td>
                      <td>
                        <StatusBadge status={installment.status} />
                      </td>
                      <td>
                        <div className="actions">
                          {installment.status !== "PAID" && (
                            <button
                              className="btn small-btn paid-btn"
                              onClick={() => markInstallmentPaid(installment.id)}
                            >
                              Mark Paid
                            </button>
                          )}

                          <button
                            className="btn small-btn"
                            onClick={() => {
                              setInstallmentForm(installment);
                              setInstallmentModal(true);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="btn small-btn danger-btn"
                            onClick={() => deleteInstallment(installment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === "deliveries" && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Delivery Management</h2>
                <p className="muted">Schedule and track furniture deliveries</p>
              </div>

              <button className="btn primary-btn" onClick={openNewDelivery}>
                + Add Delivery
              </button>
            </div>

            <div className="delivery-grid">
              {deliveries.map((delivery) => (
                <article className="delivery-card" key={delivery.id}>
                  <div className="delivery-card-head">
                    <div>
                      <span className="delivery-invoice">{delivery.invoice}</span>
                      <h3>{delivery.customer || "Walk-in Customer"}</h3>
                    </div>
                    <StatusBadge status={delivery.status} />
                  </div>

                  <p className="delivery-address">{delivery.address}</p>

                  <div className="delivery-info">
                    <span>Driver: {delivery.driver || "Not assigned"}</span>
                    <span>Date: {delivery.date || "Not scheduled"}</span>
                  </div>

                  <select
                    value={delivery.status}
                    onChange={(event) =>
                      updateDeliveryStatus(delivery.id, event.target.value)
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <div className="actions">
                    <button
                      className="btn small-btn"
                      onClick={() => {
                        setDeliveryForm(delivery);
                        setDeliveryModal(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn small-btn danger-btn"
                      onClick={() => deleteDelivery(delivery.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {!deliveries.length && (
              <div className="empty-state">
                <span>➜</span>
                <p>No deliveries available.</p>
              </div>
            )}
          </section>
        )}

        {page === "reports" && (
          <section className="reports-page">
            <div className="stats-grid">
              <StatCard title="Total Sales" value={money(totalSales)} icon="LKR" />
              <StatCard title="Completed Bills" value={sales.length} icon="INV" />
              <StatCard
                title="Pending Installments"
                value={pendingInstallments}
                icon="DUE"
              />
              <StatCard title="Active Deliveries" value={activeDeliveries} icon="DEL" />
            </div>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Daily Sales Report</h2>
                  <p className="muted">Completed bills in this browser demo</p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Remaining</th>
                      <th>Change</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.invoiceNo}</td>
                        <td>{sale.customerName}</td>
                        <td>{money(sale.total)}</td>
                        <td>{money(sale.paidAmount)}</td>
                        <td>{money(sale.balance)}</td>
                        <td>{money(sale.change)}</td>
                        <td>{new Date(sale.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!sales.length && (
                <div className="empty-state">
                  <span>▥</span>
                  <p>No sales completed yet.</p>
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      {productModal && (
        <Modal
          title={productForm.id ? "Edit Product" : "Add Product"}
          onClose={() => setProductModal(false)}
        >
          <div className="form-grid">
            <Field label="Product name">
              <input
                value={productForm.name}
                onChange={(event) =>
                  setProductForm({ ...productForm, name: event.target.value })
                }
                placeholder="Example: Luxury 3 Seater Sofa"
              />
            </Field>

            <Field label="SKU">
              <input
                value={productForm.sku}
                onChange={(event) =>
                  setProductForm({ ...productForm, sku: event.target.value })
                }
                placeholder="Example: SOF-001-BLK"
              />
            </Field>

            <Field label="Model number">
              <input
                value={productForm.modelNo}
                onChange={(event) =>
                  setProductForm({ ...productForm, modelNo: event.target.value })
                }
                placeholder="Example: LUX-SOFA-2026"
              />
            </Field>

            <Field label="Price (LKR)">
              <input
                type="number"
                min="0"
                value={productForm.price}
                onChange={(event) =>
                  setProductForm({ ...productForm, price: event.target.value })
                }
              />
            </Field>

            <Field label="Color">
              <input
                value={productForm.color}
                onChange={(event) =>
                  setProductForm({ ...productForm, color: event.target.value })
                }
              />
            </Field>

            <Field label="Material">
              <input
                value={productForm.material}
                onChange={(event) =>
                  setProductForm({ ...productForm, material: event.target.value })
                }
              />
            </Field>

            <Field label="Size">
              <input
                value={productForm.size}
                onChange={(event) =>
                  setProductForm({ ...productForm, size: event.target.value })
                }
              />
            </Field>

            <Field label="Showroom quantity">
              <input
                type="number"
                min="0"
                value={productForm.showroomQty}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    showroomQty: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Warehouse quantity">
              <input
                type="number"
                min="0"
                value={productForm.warehouseQty}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    warehouseQty: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Product image">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleProductImage(event.target.files?.[0])}
              />
            </Field>
          </div>

          {productForm.image && (
            <div className="image-preview">
              <img src={productForm.image} alt="Product preview" />
              <button
                className="btn small-btn danger-btn"
                onClick={() =>
                  setProductForm((current) => ({ ...current, image: "" }))
                }
              >
                Remove image
              </button>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn" onClick={() => setProductModal(false)}>
              Cancel
            </button>
            <button className="btn primary-btn" onClick={saveProduct}>
              Save Product
            </button>
          </div>
        </Modal>
      )}

      {customerModal && (
        <Modal
          title={customerForm.id ? "Edit Customer" : "Add Customer"}
          onClose={() => setCustomerModal(false)}
        >
          <div className="form-grid">
            <Field label="Customer name">
              <input
                value={customerForm.name}
                onChange={(event) =>
                  setCustomerForm({ ...customerForm, name: event.target.value })
                }
              />
            </Field>

            <Field label="Phone number">
              <input
                value={customerForm.phone}
                onChange={(event) =>
                  setCustomerForm({ ...customerForm, phone: event.target.value })
                }
              />
            </Field>

            <Field label="Address">
              <input
                value={customerForm.address}
                onChange={(event) =>
                  setCustomerForm({ ...customerForm, address: event.target.value })
                }
              />
            </Field>
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(customerForm.isRegular)}
              onChange={(event) =>
                setCustomerForm({
                  ...customerForm,
                  isRegular: event.target.checked,
                })
              }
            />
            <span>Make this a regular customer</span>
          </label>

          {customerForm.isRegular && (
            <div className="regular-offer-box">
              <Field label="Offer type">
                <select
                  value={customerForm.offerType}
                  onChange={(event) =>
                    setCustomerForm({
                      ...customerForm,
                      offerType: event.target.value,
                    })
                  }
                >
                  <option value="PERCENTAGE">Percentage Discount</option>
                  <option value="FIXED">Fixed Amount Discount</option>
                </select>
              </Field>

              <Field
                label={
                  customerForm.offerType === "PERCENTAGE"
                    ? "Discount percentage"
                    : "Discount amount (LKR)"
                }
              >
                <input
                  type="number"
                  min="0"
                  value={customerForm.offerValue}
                  onChange={(event) =>
                    setCustomerForm({
                      ...customerForm,
                      offerValue: event.target.value,
                    })
                  }
                />
              </Field>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn" onClick={() => setCustomerModal(false)}>
              Cancel
            </button>
            <button className="btn primary-btn" onClick={saveCustomer}>
              Save Customer
            </button>
          </div>
        </Modal>
      )}

      {installmentModal && (
        <Modal
          title={installmentForm.id ? "Edit Installment" : "Add Installment"}
          onClose={() => setInstallmentModal(false)}
        >
          <div className="form-grid">
            <Field label="Invoice number">
              <input
                value={installmentForm.invoice}
                onChange={(event) =>
                  setInstallmentForm({
                    ...installmentForm,
                    invoice: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Customer">
              <select
                value={installmentForm.customer}
                onChange={(event) =>
                  setInstallmentForm({
                    ...installmentForm,
                    customer: event.target.value,
                  })
                }
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Installment amount">
              <input
                type="number"
                min="0"
                value={installmentForm.amount}
                onChange={(event) =>
                  setInstallmentForm({
                    ...installmentForm,
                    amount: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={installmentForm.dueDate}
                onChange={(event) =>
                  setInstallmentForm({
                    ...installmentForm,
                    dueDate: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Status">
              <select
                value={installmentForm.status}
                onChange={(event) =>
                  setInstallmentForm({
                    ...installmentForm,
                    status: event.target.value,
                  })
                }
              >
                <option value="PENDING">Pending</option>
                <option value="LATE">Late</option>
                <option value="PAID">Paid</option>
              </select>
            </Field>
          </div>

          <div className="modal-actions">
            <button className="btn" onClick={() => setInstallmentModal(false)}>
              Cancel
            </button>
            <button className="btn primary-btn" onClick={saveInstallment}>
              Save Installment
            </button>
          </div>
        </Modal>
      )}

      {deliveryModal && (
        <Modal
          title={deliveryForm.id ? "Edit Delivery" : "Add Delivery"}
          onClose={() => setDeliveryModal(false)}
        >
          <div className="form-grid">
            <Field label="Invoice number">
              <input
                value={deliveryForm.invoice}
                onChange={(event) =>
                  setDeliveryForm({ ...deliveryForm, invoice: event.target.value })
                }
              />
            </Field>

            <Field label="Customer">
              <select
                value={deliveryForm.customer}
                onChange={(event) =>
                  setDeliveryForm({
                    ...deliveryForm,
                    customer: event.target.value,
                  })
                }
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Delivery address">
              <textarea
                rows="3"
                value={deliveryForm.address}
                onChange={(event) =>
                  setDeliveryForm({
                    ...deliveryForm,
                    address: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Driver name">
              <input
                value={deliveryForm.driver}
                onChange={(event) =>
                  setDeliveryForm({ ...deliveryForm, driver: event.target.value })
                }
              />
            </Field>

            <Field label="Delivery date">
              <input
                type="date"
                value={deliveryForm.date}
                onChange={(event) =>
                  setDeliveryForm({ ...deliveryForm, date: event.target.value })
                }
              />
            </Field>

            <Field label="Status">
              <select
                value={deliveryForm.status}
                onChange={(event) =>
                  setDeliveryForm({ ...deliveryForm, status: event.target.value })
                }
              >
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </Field>
          </div>

          <div className="modal-actions">
            <button className="btn" onClick={() => setDeliveryModal(false)}>
              Cancel
            </button>
            <button className="btn primary-btn" onClick={saveDelivery}>
              Save Delivery
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}

      {lastSale && (
        <div className="print-area">
          <div className="thermal-receipt">
            <img src="/logo.jpg" className="receipt-logo" alt="Uva Furnitures" />
            <h2>UVA FURNITURES</h2>
            <p>Style Your Space</p>
            <p>Invoice: {lastSale.invoiceNo}</p>
            <p>{new Date(lastSale.createdAt).toLocaleString()}</p>
            <p>Customer: {lastSale.customerName}</p>

            <hr />

            {lastSale.items.map((item, index) => (
              <div key={`${item.variantId}-${index}`} className="receipt-item">
                <strong>{item.productName}</strong>
                <div className="receipt-row">
                  <span>
                    {item.quantity} × {money(item.price)}
                  </span>
                  <span>{money(Number(item.price) * Number(item.quantity))}</span>
                </div>
              </div>
            ))}

            <hr />

            <div className="receipt-row">
              <span>Subtotal</span>
              <span>{money(lastSale.subtotal)}</span>
            </div>

            {lastSale.regularDiscount > 0 && (
              <div className="receipt-row">
                <span>Regular offer</span>
                <span>- {money(lastSale.regularDiscount)}</span>
              </div>
            )}

            {lastSale.manualDiscount > 0 && (
              <div className="receipt-row">
                <span>Discount</span>
                <span>- {money(lastSale.manualDiscount)}</span>
              </div>
            )}

            <div className="receipt-row">
              <span>Delivery</span>
              <span>{money(lastSale.deliveryFee)}</span>
            </div>

            <div className="receipt-row receipt-total">
              <span>TOTAL</span>
              <span>{money(lastSale.total)}</span>
            </div>

            <div className="receipt-row">
              <span>Paid</span>
              <span>{money(lastSale.paidAmount)}</span>
            </div>

            <div className="receipt-row">
              <span>Remaining</span>
              <span>{money(lastSale.balance)}</span>
            </div>

            <div className="receipt-row">
              <span>Change</span>
              <span>{money(lastSale.change)}</span>
            </div>

            <p className="receipt-footer">Thank you for choosing Uva Furnitures</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  totalSales,
  saleCount,
  activeDeliveries,
  pendingInstallments,
  sales,
  goTo,
}) {
  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <div>
          <p>UVA FURNITURES</p>
          <h2>Make every space feel like home.</h2>
          <span>Manage sales, customers, stock, deliveries, and offers in one place.</span>
        </div>

        <button className="btn light-btn" onClick={() => goTo("pos")}>
          Create New Bill
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Sales" value={money(totalSales)} icon="LKR" />
        <StatCard title="Completed Bills" value={saleCount} icon="INV" />
        <StatCard title="Pending Installments" value={pendingInstallments} icon="DUE" />
        <StatCard title="Active Deliveries" value={activeDeliveries} icon="DEL" />
      </div>

      <div className="quick-actions">
        <button className="quick-action" onClick={() => goTo("pos")}>
          <span>▣</span>
          <strong>New Sale</strong>
          <small>Create a customer bill</small>
        </button>

        <button className="quick-action" onClick={() => goTo("products")}>
          <span>▤</span>
          <strong>Manage Products</strong>
          <small>Add stock and furniture photos</small>
        </button>

        <button className="quick-action" onClick={() => goTo("customers")}>
          <span>◉</span>
          <strong>Regular Customers</strong>
          <small>Create offers and discounts</small>
        </button>

        <button className="quick-action" onClick={() => goTo("deliveries")}>
          <span>➜</span>
          <strong>Deliveries</strong>
          <small>Track delivery schedules</small>
        </button>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent Sales</h2>
            <p className="muted">Latest completed bills</p>
          </div>

          <button className="btn" onClick={() => goTo("reports")}>
            View Report
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 6).map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.invoiceNo}</td>
                  <td>{sale.customerName}</td>
                  <td>{money(sale.total)}</td>
                  <td>{money(sale.paidAmount)}</td>
                  <td>{new Date(sale.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!sales.length && (
          <div className="empty-state">
            <span>▥</span>
            <p>No completed bills yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`badge status-${String(status).toLowerCase()}`}>
      {status}
    </span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}