
import React, { useState } from 'react';
import './YouthApplicationForm.css';

const YouthApplicationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    talentArea: '',
    portfolioLink: '',
    bio: ''
  });

  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Simulate a form submission and approval flow
    setStatusMessage('Application submitted successfully! You will receive an email once your application is reviewed.');
    // In real application, send formData to backend API or Firebase
  };

  return (
    <div className="form-container">
      <h2>Join the Foremade Youth Creator Program</h2>
      <form onSubmit={handleSubmit}>
        <label>Full Name:</label>
        <input type="text" name="fullName" required onChange={handleChange} />

        <label>Age:</label>
        <input type="number" name="age" required onChange={handleChange} />

        <label>Email:</label>
        <input type="email" name="email" required onChange={handleChange} />

        <label>Phone Number:</label>
        <input type="tel" name="phone" required onChange={handleChange} />

        <label>City:</label>
        <input type="text" name="city" required onChange={handleChange} />

        <label>Country:</label>
        <input type="text" name="country" required onChange={handleChange} />

        <label>Area of Creativity / Business:</label>
        <input type="text" name="talentArea" required onChange={handleChange} />

        <label>Portfolio Link (Instagram, Website, etc):</label>
        <input type="url" name="portfolioLink" onChange={handleChange} />

        <label>Short Bio / Description:</label>
        <textarea name="bio" rows="4" onChange={handleChange}></textarea>

        <button type="submit">Submit Application</button>
      </form>
      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </div>
  );
};

export default YouthApplicationForm;
