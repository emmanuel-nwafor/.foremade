import React from "react";
import { TrendingUp, Rocket, Lightbulb, AlertCircle, BadgeDollarSign, HelpCircle, CheckCircle2 } from 'lucide-react';
import SellerSidebar from './SellerSidebar';

const mainStyle = {
  fontFamily: "Segoe UI, sans-serif",
  background: "#fff",
  color: "#181818",
  minHeight: "100vh",
  width: "100%",
};
const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
  maxWidth: 600,
  width: "100%",
  padding: 32,
  margin: "0 16px",
};
const sectionStyle = {
  marginBottom: 32,
  borderBottom: "1px solid #f0f0f0",
  paddingBottom: 24,
};
const lastSectionStyle = {
  marginBottom: 0,
  borderBottom: "none",
  paddingBottom: 0,
};
const h1Style = {
  color: "#003366",
  fontSize: 32,
  fontWeight: 800,
  marginBottom: 8,
  letterSpacing: "-1px",
};
const h2Style = {
  color: "#003366",
  fontSize: 22,
  fontWeight: 700,
  margin: "0 0 12px 0",
  display: "flex",
  alignItems: "center",
  gap: 10,
};
const iconStyle = {
  color: "#003366",
  marginRight: 8,
  verticalAlign: "middle",
};
const highlightStyle = {
  color: "#181818",
  fontWeight: "bold",
};
const noteStyle = {
  backgroundColor: "#f9f9f9",
  padding: 15,
  borderLeft: "4px solid #ffcc00",
  marginTop: 15,
  color: "#181818",
  borderRadius: 6,
  fontSize: 15,
};
const linkStyle = {
  color: "#003366",
  textDecoration: "none",
  fontWeight: "bold",
  borderBottom: "1px solid #003366",
  transition: "background 0.2s, color 0.2s",
  padding: "1px 2px",
  borderRadius: 2,
};
const linkHoverStyle = {
  textDecoration: "underline",
  background: "#f0f6fa",
};
const buttonStyle = {
  background: "#003366",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 22px",
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 18,
  marginBottom: 0,
  transition: "background 0.2s",
  textDecoration: "none",
  display: "inline-block",
};

function ProductBumpInfo() {
  const [hovered, setHovered] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const handleHover = (id) => setHovered(id);
  const handleLeave = () => setHovered("");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Container */}
      <div className="relative">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#112d4e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static top-0 left-0 h-full z-40 md:z-0 w-64 bg-[#112d4e] shadow-lg md:shadow-none transition-transform duration-300 ease-in-out`}>
          <SellerSidebar />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 flex justify-center items-start py-10 bg-gray-50">
        <div style={cardStyle}>
          <h1 style={h1Style}><TrendingUp size={32} style={{display: 'inline', marginRight: 12, verticalAlign: 'middle'}} /> Product Bumps</h1>
          <p style={{ marginBottom: 24, fontSize: 18, color: "#181818" }}>Get more eyes on your listings. Sell faster.</p>

          <div style={sectionStyle}>
            <h2 style={h2Style}><TrendingUp style={iconStyle} size={22}/>What is a Product Bump?</h2>
            <p style={{ fontSize: 16 }}>
              A <strong>Product Bump</strong> is a paid tool that promotes your listing on FOREMADE. It increases visibility by pushing your item higher in search results and buyer feeds for <strong>3 or 7 days</strong>—or until it sells.
            </p>
            <p style={{ fontSize: 16 }}>
              You can choose to bump your listing <strong>locally</strong> or make it visible to <strong>international buyers</strong> across all active FOREMADE regions.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}><Rocket style={iconStyle} size={22}/>Why Use a Product Bump?</h2>
            <ul style={{ paddingLeft: 20, fontSize: 16, margin: 0 }}>
              <li><strong>More Visibility:</strong> Appear higher in search results and feeds.</li>
              <li><strong>Targeted Reach:</strong> Get shown to the right buyers based on browsing history.</li>
              <li><strong>Performance Tracking:</strong> Monitor views and interactions via your dashboard.</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}><AlertCircle style={iconStyle} size={22}/>Before You Bump</h2>
            <ul style={{ paddingLeft: 20, fontSize: 16, margin: 0 }}>
              <li>
                Ensure your listing meets our {" "}
                <a
                  href="/help/listing-guidelines"
                  style={hovered === "guidelines" ? { ...linkStyle, ...linkHoverStyle } : linkStyle}
                  onMouseEnter={() => handleHover("guidelines")}
                  onMouseLeave={handleLeave}
                >
                  Listing Guidelines
                </a>.
              </li>
              <li>Update your images, title, price, and description before activating a bump.</li>
              <li>
                You can <span style={highlightStyle}>lower</span> the price while a bump is active—but you can't raise it until the bump ends.
              </li>
            </ul>
            <div style={noteStyle}>
              <AlertCircle size={16} style={{display: 'inline', marginRight: 6, verticalAlign: 'middle'}} /> Lowering the price doesn't reduce the cost of the bump. No refunds are given for price changes after activation.
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}><Lightbulb style={iconStyle} size={22}/>How to Apply a Bump</h2>
            <ol style={{ paddingLeft: 20, fontSize: 16, margin: 0 }}>
              <li>
                Log in to your {" "}
                <a
                  href="/dashboard"
                  style={hovered === "dashboard1" ? { ...linkStyle, ...linkHoverStyle } : linkStyle}
                  onMouseEnter={() => handleHover("dashboard1")}
                  onMouseLeave={handleLeave}
                >
                  Seller Dashboard
                </a>.
              </li>
              <li>Select the item you want to promote.</li>
              <li>Choose <strong>3 or 7-day duration</strong>.</li>
              <li>Choose <strong>Local</strong> or <strong>International</strong> visibility.</li>
              <li>Pay and activate!</li>
            </ol>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}><BadgeDollarSign style={iconStyle} size={22}/>Bump Pricing</h2>
            <p style={{ fontSize: 16 }}>Pricing depends on:</p>
            <ul style={{ paddingLeft: 20, fontSize: 16, margin: 0 }}>
              <li>Item price</li>
              <li>Bump duration (3 or 7 days)</li>
              <li>Target location: Local or International</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              <a
                href="/pricing"
                style={hovered === "pricing" ? { ...buttonStyle, background: "#002244", color: "#fff" } : buttonStyle}
                onMouseEnter={() => handleHover("pricing")}
                onMouseLeave={handleLeave}
              >
                View Bump Pricing
              </a>
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}><HelpCircle style={iconStyle} size={22}/>Frequently Asked Questions</h2>
            <div style={{ fontSize: 16 }}>
              <p style={{ marginBottom: 10 }}>
                <strong>What if I cancel the sale?</strong>
                <br />- If you cancel it, the bump ends and is not refunded. You'll need to buy a new bump.
                <br />- If the buyer cancels, contact {" "}
                <a
                  href="/contact"
                  style={hovered === "contact" ? { ...linkStyle, ...linkHoverStyle } : linkStyle}
                  onMouseEnter={() => handleHover("contact")}
                  onMouseLeave={handleLeave}
                >
                  FOREMADE Support
                </a> for help.
              </p>
              <p style={{ marginBottom: 10 }}>
                <strong>Can I bump any item?</strong>
                <br />Yes! Even items under verification can be bumped.
              </p>
              <p style={{ marginBottom: 10 }}>
                <strong>Can I bump multiple listings?</strong>
                <br />Yes, as many as you want—but only one bump per item at a time.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Can bumps be transferred?</strong>
                <br />No. Bumps are tied to specific listings.
              </p>
            </div>
          </div>

          <div style={lastSectionStyle}>
            <h2 style={h2Style}><CheckCircle2 style={iconStyle} size={22}/>Start Selling Smarter</h2>
            <p style={{ fontSize: 16 }}>
              <a
                href="/dashboard"
                style={hovered === "dashboard2" ? { ...buttonStyle, background: "#002244", color: "#fff" } : buttonStyle}
                onMouseEnter={() => handleHover("dashboard2")}
                onMouseLeave={handleLeave}
              >
                Go to your dashboard
              </a>{" "}
              to bump a product and increase your sales today!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductBumpInfo;