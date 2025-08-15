import React, { createContext, useContext, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const CurrencyContext = createContext(null);

function CurrencyProvider({ children, baseCurrency = "NGN", currencyCode = "NGN", locale = "en-NG", fxRateFromBase = 1 }) {
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode, currencyDisplay: "symbol", maximumFractionDigits: 2 }),
    [currencyCode, locale]
  );
  const value = useMemo(
    () => ({
      baseCurrency,
      currencyCode,
      locale,
      fxRateFromBase,
      convertFromBase: (amountInBase) => amountInBase * fxRateFromBase,
      formatFromBase: (amountInBase) => formatter.format(amountInBase * fxRateFromBase),
      formatTarget: (amountInTarget) => formatter.format(amountInTarget),
    }),
    [baseCurrency, currencyCode, locale, fxRateFromBase, formatter]
  );
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

const PRICING = {
  MIN_FREE_DELIVERY_AMOUNT_BASE: 50000,
  SHIPPING_WITHIN_600KM_BASE: {
    upTo5kg: 3000,
    upTo10kg: 12000,
    upTo20kg: 20000,
    bandBaseOver20kg: 20000,
  },
};

function calcShippingWithin600kmBase(weightKg) {
  const { upTo5kg, upTo10kg, upTo20kg, bandBaseOver20kg } = PRICING.SHIPPING_WITHIN_600KM_BASE;
  if (weightKg <= 0) return 0;
  if (weightKg <= 5) return upTo5kg;
  if (weightKg <= 10) return upTo10kg;
  if (weightKg <= 20) return upTo20kg;
  const extraKg = weightKg - 20;
  const blocks = Math.ceil(extraKg / 5);
  const surcharge = blocks * 0.2 * bandBaseOver20kg;
  return upTo20kg + surcharge;
}

const sampleItem = {
  id: "SKU-ABC-123",
  name: "Industrial Sewing Machine",
  priceBase: 42000,
  weightKg: 18.4,
  image: "https://via.placeholder.com/480x320.png?text=Your+Product+Image",
};

function PayNowButton({ item, onCheckout }) {
  return <button onClick={() => onCheckout(item)} style={{ padding: "12px 18px", borderRadius: 8, border: "none", background: "#ff6a00", color: "white", fontWeight: 700, cursor: "pointer" }}>Pay now</button>;
}

function CheckoutPage({ item, onKeepShopping, onPlaceOrder }) {
  const { formatFromBase, convertFromBase, formatTarget } = useCurrency();
  const [address, setAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [showDeliveryCalc, setShowDeliveryCalc] = useState(false);
  const subtotalBase = item.priceBase;
  const qualifiesForFreeDelivery = subtotalBase >= PRICING.MIN_FREE_DELIVERY_AMOUNT_BASE;
  const amountLeftForFreeBase = Math.max(0, PRICING.MIN_FREE_DELIVERY_AMOUNT_BASE - subtotalBase);
  const shippingQuoteBase = useMemo(() => {
    if (!showDeliveryCalc) return null;
    const km = Number(distanceKm);
    if (!Number.isFinite(km) || km <= 0) return { error: "Enter a valid distance in kilometres." };
    if (km > 600) return { quoteLater: true, message: "Standard rates apply only within 600 km. We’ll confirm delivery charges after address verification." };
    return { shippingBase: calcShippingWithin600kmBase(item.weightKg) };
  }, [showDeliveryCalc, distanceKm, item.weightKg]);
  const totalTarget = useMemo(() => {
    const sub = convertFromBase(subtotalBase);
    const ship = qualifiesForFreeDelivery || !(showDeliveryCalc && shippingQuoteBase && shippingQuoteBase.shippingBase != null) ? 0 : convertFromBase(shippingQuoteBase.shippingBase);
    return sub + ship;
  }, [convertFromBase, showDeliveryCalc, shippingQuoteBase, subtotalBase, qualifiesForFreeDelivery]);
  return (
    <div style={{ maxWidth: 880, margin: "24px auto", padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
      <h2 style={{ marginTop: 0 }}>Checkout</h2>
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "center", border: "1px solid #eee", padding: 16, borderRadius: 12 }}>
        <img src={item.image} alt={item.name} style={{ width: "100%", borderRadius: 8 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.name}</div>
          <div>Weight: {item.weightKg} kg</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{formatFromBase(item.priceBase)}</div>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: qualifiesForFreeDelivery ? "#f0fff4" : "#fff8f0", border: `1px solid ${qualifiesForFreeDelivery ? "#22c55e55" : "#ff6a0055"}` }}>
        {qualifiesForFreeDelivery ? <div>🎉 Your order qualifies for <strong>FREE delivery</strong> (minimum {formatFromBase(PRICING.MIN_FREE_DELIVERY_AMOUNT_BASE)}).</div> : <div>Add <strong>{formatFromBase(amountLeftForFreeBase)}</strong> more to get <strong>FREE delivery</strong>, or enter your delivery location to see delivery charges now.<div style={{ marginTop: 8 }}><button onClick={onKeepShopping} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer" }}>Keep shopping</button></div></div>}
      </div>
      {!qualifiesForFreeDelivery && <div style={{ marginTop: 16, border: "1px dashed #ddd", padding: 16, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Delivery address</h3>
        <label style={{ display: "block", marginBottom: 8 }}>Address (street / city)<input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter delivery address" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginTop: 6 }} /></label>
        <label style={{ display: "block", marginBottom: 8 }}>Approx. distance to warehouse (km) — rates apply within 600km<input type="number" inputMode="decimal" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="e.g. 120" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginTop: 6 }} /></label>
        <button onClick={() => setShowDeliveryCalc(true)} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#0b63ce", color: "white", fontWeight: 700, cursor: "pointer", marginTop: 8 }}>Get delivery charges</button>
        {showDeliveryCalc && <div style={{ marginTop: 12 }}>{!shippingQuoteBase ? null : shippingQuoteBase.error ? <div style={{ color: "#b91c1c" }}>{shippingQuoteBase.error}</div> : shippingQuoteBase.quoteLater ? <div style={{ color: "#92400e" }}>{shippingQuoteBase.message}</div> : <div style={{ padding: 12, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div>Delivery (within 600km): <strong>{formatFromBase(shippingQuoteBase.shippingBase)}</strong></div><small style={{ opacity: 0.8 }}>0–5kg ₦3,000 • 5.1–10kg ₦12,000 • 10.1–20kg ₦20,000 • Over 20kg +20%/5kg block (shown in your selected currency)</small></div>}</div>}
      </div>}
      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Order summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
          <div>Subtotal</div>
          <div>{formatFromBase(subtotalBase)}</div>
          <div>Delivery</div>
          <div>{qualifiesForFreeDelivery ? "FREE" : showDeliveryCalc && shippingQuoteBase && shippingQuoteBase.shippingBase != null ? formatFromBase(shippingQuoteBase.shippingBase) : "— enter address to calculate"}</div>
          <div style={{ borderTop: "1px dashed #ddd", marginTop: 6 }} />
          <div style={{ borderTop: "1px dashed #ddd", marginTop: 6 }} />
          <div style={{ fontWeight: 800 }}>Total due</div>
          <div style={{ fontWeight: 800 }}>{formatTarget(totalTarget)}</div>
        </div>
        <button onClick={() => onPlaceOrder({ itemId: item.id, address, distanceKm: Number(distanceKm) || null })} style={{ marginTop: 12, width: "100%", padding: "12px 18px", borderRadius: 10, border: "none", background: "#16a34a", color: "white", fontWeight: 800, cursor: "pointer", opacity: qualifiesForFreeDelivery || (showDeliveryCalc && shippingQuoteBase && (shippingQuoteBase.shippingBase != null || shippingQuoteBase.quoteLater)) ? 1 : 0.6 }} disabled={!qualifiesForFreeDelivery && !(showDeliveryCalc && shippingQuoteBase && (shippingQuoteBase.shippingBase != null || shippingQuoteBase.quoteLater))}>Place order</button>
      </div>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState("product");
  const [item, setItem] = useState(sampleItem);
  return (
    <CurrencyProvider baseCurrency="NGN" currencyCode="EUR" locale="it-IT" fxRateFromBase={0.0011}>
      <div style={{ padding: 24 }}>
        {route === "product" && <div style={{ maxWidth: 680, margin: "0 auto", border: "1px solid #eee", padding: 16, borderRadius: 12 }}>
          <h2>{item.name}</h2>
          <img src={item.image} alt={item.name} style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} />
          <div>Weight: {item.weightKg} kg</div>
          <PriceFromBase amountBase={item.priceBase} size={18} />
          <PayNowButton item={item} onCheckout={(it) => { setItem(it); setRoute("checkout"); }} />
        </div>}
        {route === "checkout" && <CheckoutPage item={item} onKeepShopping={() => setRoute("product")} onPlaceOrder={(payload) => { alert(`Order placed!\n\n${JSON.stringify(payload, null, 2)}`); }} />}
      </div>
    </CurrencyProvider>
  );
}

function PriceFromBase({ amountBase, size = 16 }) {
  const { formatFromBase } = useCurrency();
  return <div style={{ fontSize: size, fontWeight: 800, margin: "8px 0 16px" }}>{formatFromBase(amountBase)}</div>;
}

export default App;
