import React, { useState } from 'react';

const ProSellerRegistrationForm = () => {
  const [formData, setFormData] = useState({
    businessType: '',
    businessName: '',
    representativeName: '',
    email: '',
    phone: '',
    businessAddress: '',
    cacRegNumber: '',
    tin: '',
    validId: null,
    bankDetails: '',
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Replace with API call or Firestore submission
    alert('Registration submitted! (Check console for details)');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>FOremade Pro Seller Registration Form</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="businessType" style={{ display: 'block', marginBottom: '5px' }}>
            Business Type
          </label>
          <select
            id="businessType"
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          >
            <option value="" disabled>Select one</option>
            <option value="soleTrader">Sole Trader</option>
            <option value="registeredCompany">Registered Company</option>
            <option value="ngoCharity">NGO/Charity</option>
            <option value="manufacturer">Manufacturer</option>
          </select>
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="businessName" style={{ display: 'block', marginBottom: '5px' }}>
            Business Name
          </label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="representativeName" style={{ display: 'block', marginBottom: '5px' }}>
            Representative Name
          </label>
          <input
            type="text"
            id="representativeName"
            name="representativeName"
            value={formData.representativeName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '10px' }}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="phone" style={{ display: 'block', marginBottom: '5px' }}>
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="businessAddress" style={{ display: 'block', marginBottom: '5px' }}>
            Business Address
          </label>
          <input
            type="text"
            id="businessAddress"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="cacRegNumber" style={{ display: 'block', marginBottom: '5px' }}>
            CAC Reg. Number (if any)
          </label>
          <input
            type="text"
            id="cacRegNumber"
            name="cacRegNumber"
            value={formData.cacRegNumber}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="tin" style={{ display: 'block', marginBottom: '5px' }}>
            Tax Identification Number (TIN)
          </label>
          <input
            type="text"
            id="tin"
            name="tin"
            value={formData.tin}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="validId" style={{ display: 'block', marginBottom: '5px' }}>
            Upload Valid ID
          </label>
          <input
            type="file"
            id="validId"
            name="validId"
            accept="image/*,application/pdf"
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label htmlFor="bankDetails" style={{ display: 'block', marginBottom: '5px' }}>
            Bank Account Details
          </label>
          <input
            type="text"
            id="bankDetails"
            name="bankDetails"
            value={formData.bankDetails}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#yellow-500',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#e6b800')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#yellow-500')}
        >
          Submit Registration
        </button>
      </form>
    </div>
  );
};

export default ProSellerRegistrationForm;