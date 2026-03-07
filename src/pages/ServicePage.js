import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  ChevronLeft,
  Star,
  Sun,
  Car,
  Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllServices } from '../services/serviceService';
import { getAllCategories } from '../services/categoryService';
import '../styles/services.css';

const ServicesPage = ({ isActive, onNavigate, onOpenServiceDetail }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [view, setView] = useState('categories'); // 'categories' or 'services'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map category names to icons
  const categoryIconMap = {
    'Commercial': <Building2 size={32} />,
    'Solar': <Sun size={32} />,
    'Security': <ShieldCheck size={32} />,
    'Ev Services': <Car size={32} />,
    'default': <Wrench size={32} />
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isActive) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch categories and services in parallel
        const [catRes, servRes] = await Promise.all([
          getAllCategories({ categoryType: 'service' }),
          getAllServices()
        ]);

        console.log("Categories Response:", catRes);
        console.log("Services Response:", servRes);

        // Map categories (flexible response handling)
        let cats = catRes?.result || catRes?.data || catRes;
        if (Array.isArray(cats)) {
          setCategories(cats);
        }

        // Map services (flexible response handling)
        let servs = servRes?.result?.services || servRes?.data || servRes;
        if (Array.isArray(servs)) {
          setAllServices(servs);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load services. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isActive]);

  // Handle category selection
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    const filtered = allServices.filter(s => {
      const sCatId = s.categoryId?._id || s.categoryId;
      return sCatId === category._id;
    });
    setFilteredServices(filtered);
    setView('services');
  };

  // Handle service click
  const handleServiceClick = (service) => {
    const categoryName = service.categoryId?.category || selectedCategory?.category || 'AC';
    navigate(`/product-services?type=${encodeURIComponent(categoryName)}&serviceId=${service._id}`);
  };

  // Go back to categories
  const handleBackToCategories = () => {
    setView('categories');
    setSelectedCategory(null);
  };

  if (loading && isActive) {
    return (
      <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
        <div className="services-hero">
          <h1>Loading <span className="accent">Services...</span></h1>
        </div>
        <div className="section-wrap">
          <div className="loading-spinner" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="spinner"></div>
            <p>Fetching available services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && isActive) {
    return (
      <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
        <div className="services-hero">
          <h1><span className="accent">Oops!</span></h1>
          <p>{error}</p>
        </div>
        <div className="section-wrap">
          <div style={{ textAlign: 'center' }}>
            <button className="retry-button" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
      {/* Page Header */}
      <div className="services-hero">
        {view === 'services' && selectedCategory ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <button className="back-btn-simple" onClick={handleBackToCategories}>
                <ChevronLeft size={20} /> Back to Categories
              </button>
            </div>
            <h1>{selectedCategory.category} <span className="accent">Services</span></h1>
          </>
        ) : (
          <>
            <h1>Our <span className="accent">Categories</span></h1>
            <p>Choose a category to find specialized services</p>
          </>
        )}
      </div>

      <div className="section-wrap">
        {view === 'categories' ? (
          /* Category Grid */
          <div className="service-grid">
            {categories.map(cat => (
              <div
                key={cat._id}
                className="service-card category-card-new"
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="service-icon category-icon-large">
                  {categoryIconMap[cat.category] || categoryIconMap['default']}
                </div>
                <span className="category-name-text">{cat.category}</span>
                <p className="category-desc-small">{cat.description}</p>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="no-services-message" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <p>No categories available at the moment.</p>
              </div>
            )}
          </div>
        ) : (
          /* Service Grid (Filtered) */
          <>
            {filteredServices.length === 0 ? (
              <div className="no-services-message" style={{ textAlign: 'center', padding: '40px' }}>
                <p>No services found in this category.</p>
                <button className="view-details-link" onClick={handleBackToCategories}>View All Categories</button>
              </div>
            ) : (
              <div className="massive-list">
                {filteredServices.map(service => (
                  <div key={service._id} className="massive-section-wrap">
                    <div className="massive-card">
                      <div className="massive-card-content">
                        <h3 className="massive-card-title">{service.serviceName}</h3>

                        <div className="massive-card-rating">
                          <Star size={16} className="star-icon" />
                          <span>
                            {service.ratingSummary?.averageRating || 0.0} ({service.ratingSummary?.totalRatings || 0} reviews)
                          </span>
                        </div>

                        <div className="massive-card-price">
                          ₹{service.discountedPrice || service.serviceCost} •
                        </div>

                        <ul className="massive-card-description">
                          {(service.description?.split(',') || []).slice(0, 3).map((item, idx) => (
                            <li key={idx}>{item.trim()}</li>
                          ))}
                        </ul>

                        <div
                          className="massive-card-link"
                          onClick={() => handleServiceClick(service)}
                        >
                          View details
                        </div>
                      </div>

                      <div className="massive-card-right">
                        <div className="massive-card-image">
                          {service.serviceImages?.[0] ? (
                            <img src={service.serviceImages[0]} alt={service.serviceName} />
                          ) : (
                            <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>
                              <Wrench size={40} />
                            </div>
                          )}
                        </div>
                        <button
                          className="massive-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({ ...service, itemType: 'service' });
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ServicesPage;