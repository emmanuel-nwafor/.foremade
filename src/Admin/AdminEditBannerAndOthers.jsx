import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '/src/firebase';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import 'boxicons/css/boxicons.min.css';
import AdminEditTrendings from './AdminEditTrendings';

function CustomAlert({ alerts, removeAlert }) {
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => alerts.forEach((alert) => removeAlert(alert.id)), 5000);
    return () => clearTimeout(timer);
  }, [alerts, removeAlert]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg shadow-md transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          } flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const addAlert = (message, type = 'info') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };
  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };
  return { alerts, addAlert, removeAlert };
}

export default function AdminEditBannerAndOthers() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [slides, setSlides] = useState([]);
  const [newSlide, setNewSlide] = useState({ id: '', desktop: '', tablet: '', mobile: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState({ desktop: false, tablet: false, mobile: false });
  const [uploadProgress, setUploadProgress] = useState({ desktop: 0, tablet: 0, mobile: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedForm, setExpandedForm] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'carouselSlides'));
        const slideData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSlides(slideData);
        addAlert('Slides loaded successfully!', 'success');
      } catch (err) {
        console.error('Error fetching slides:', err);
        addAlert('Failed to load slides.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSlide((prev) => ({ ...prev, [name]: value }));
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/gif', 'video/mp4', 'video/webm', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      addAlert(`Invalid file type for ${type}. Use GIF, MP4, WebM, JPEG, or PNG.`, 'error');
      return;
    }

    // Validate file size
    const maxSize = file.type.startsWith('video') ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images/GIFs
    if (file.size > maxSize) {
      addAlert(
        `File too large for ${type}. Max size is ${file.type.startsWith('video') ? '50MB' : '10MB'}.`,
        'error'
      );
      return;
    }

    setUploading((prev) => ({ ...prev, [type]: true }));
    setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isVideo', file.type.startsWith('video').toString());

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minutes for larger files
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress((prev) => ({ ...prev, [type]: percentCompleted }));
        },
      });

      if (response.status !== 200 || !response.data.url) {
        throw new Error('Failed to upload media to Cloudinary.');
      }

      setNewSlide((prev) => ({ ...prev, [type]: response.data.url }));
      addAlert(`${type} media uploaded!`, 'success');
    } catch (err) {
      console.error('Media upload error:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      addAlert(
        err.code === 'ECONNABORTED'
          ? 'Upload timed out. Please check your network.'
          : err.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Please check your network.'
          : `Failed to upload ${type} media.`,
        'error'
      );
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
    }
  };

  const renderMediaPreview = (url) => {
    if (!url) return null;
    const isVideo = url.match(/\.(mp4|webm)$/i);
    if (isVideo) {
      return (
        <video
          src={url}
          controls
          className="mt-2 h-20 w-auto rounded shadow-sm"
          title="Video preview"
        />
      );
    }
    return <img src={url} alt="Media preview" className="mt-2 h-20 w-auto rounded shadow-sm" />;
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!newSlide.desktop || !newSlide.tablet || !newSlide.mobile) {
      addAlert('All media fields are required.', 'error');
      return;
    }

    try {
      setLoading(true);
      const slideId = isEditing ? newSlide.id : `slide-${Date.now()}`;
      await setDoc(doc(db, 'carouselSlides', slideId), {
        desktop: newSlide.desktop,
        tablet: newSlide.tablet,
        mobile: newSlide.mobile,
        createdAt: new Date().toISOString(),
      });
      addAlert(isEditing ? 'Slide updated successfully! 🎉' : 'Slide added successfully! 🎉', 'success');
      setSlides((prev) =>
        isEditing
          ? prev.map((slide) => (slide.id === slideId ? { id: slideId, ...newSlide } : slide))
          : [...prev, { id: slideId, ...newSlide }]
      );
      resetForm();
    } catch (err) {
      console.error('Error saving slide:', err);
      addAlert('Failed to save slide.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlide = (slide) => {
    setNewSlide(slide);
    setIsEditing(true);
    setExpandedForm(true);
  };

  const handleDeleteSlide = async (slideId) => {
    if (!confirm('Delete this slide?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'carouselSlides', slideId));
      setSlides((prev) => prev.filter((slide) => slide.id !== slideId));
      addAlert('Slide deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting slide:', err);
      addAlert('Failed to delete slide.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewSlide({ id: '', desktop: '', tablet: '', mobile: '' });
    setIsEditing(false);
  };

  const toggleFormExpansion = () => {
    setExpandedForm((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-5 flex justify-center items-start">
        <div className="w-full max-w-5xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-image text-blue-500"></i>
            Manage Carousel Banners
          </h2>
          <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={toggleFormExpansion}
            >
              <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <i className={`bx bx-chevron-${expandedForm ? 'up' : 'down'} text-blue-500`}></i>
                {isEditing ? 'Edit Slide' : 'Add New Slide'}
              </span>
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="text-gray-600 hover:text-gray-800 dark:hover:text-gray-400 text-sm flex items-center gap-1"
                  title="Cancel editing"
                >
                  <i className="bx bx-x"></i>
                  Cancel
                </button>
              )}
            </div>
            {expandedForm && (
              <form onSubmit={handleSaveSlide} className="mt-4 ml-4 space-y-4 animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['desktop', 'tablet', 'mobile'].map((type) => (
                    <div key={type} className="relative group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        {`${type.charAt(0).toUpperCase() + type.slice(1)} Media`}
                        <i
                          className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help"
                          title={`Upload an image, GIF, or short video optimized for ${type} devices (GIF ≤10MB, Videos ≤50MB)`}
                        ></i>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name={type}
                          value={newSlide[type]}
                          onChange={handleInputChange}
                          placeholder="Enter media URL or upload below"
                          className="mt-1 w-full py-2 pl-3 pr-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                          disabled={uploading[type]}
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        onChange={(e) => handleMediaUpload(e, type)}
                        className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={uploading[type]}
                      />
                      {uploading[type] && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Uploading... {uploadProgress[type]}%</p>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[type]}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {renderMediaPreview(newSlide[type])}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={uploading.desktop || uploading.tablet || uploading.mobile || loading}
                    className="py-2 px-6 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2 shadow-sm"
                  >
                    {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-save"></i>}
                    {loading ? 'Saving...' : isEditing ? 'Update Slide' : 'Add Slide'}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="mt-6 p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <i className="bx bx-list-ul text-blue-500"></i>
              Current Slides
            </h3>
            {slides.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300 italic">No slides available.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slides.map((slide) => (
                  <li
                    key={slide.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                  >
                    {renderMediaPreview(slide.desktop)}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Slide {slide.id.split('-')[1]}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSlide(slide)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                          title="Edit slide"
                        >
                          <i className="bx bx-edit"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                          title="Delete slide"
                        >
                          <i className="bx bx-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <AdminEditTrendings />
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}