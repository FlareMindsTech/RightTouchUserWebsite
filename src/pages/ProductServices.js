import React, { useState } from 'react';

// Service data for different product types
const serviceData = {
  'AC': {
    image: require('../assets/AC.jpg'),
    rating: 4.8,
    reviews: '12K',
    services: [
      {
        id: 1,
        name: 'Basic AC Service',
        price: 299,
        rating: 4.5,
        servicesIncluded: ['Full AC cleaning', 'Filter cleaning', 'Gas pressure check'],
        servicesNotIncluded: ['Spare parts cost', 'Gas refill extra']
      },
      {
        id: 2,
        name: 'Standard AC Service',
        price: 499,
        rating: 4.7,
        servicesIncluded: ['Full AC cleaning', 'Filter cleaning', 'Gas pressure check', 'Cooling performance test'],
        servicesNotIncluded: ['Spare parts cost', 'Gas refill extra']
      },
      {
        id: 3,
        name: 'Premium AC Service',
        price: 799,
        rating: 4.9,
        servicesIncluded: ['Full AC cleaning', 'Filter cleaning', 'Gas pressure check', 'Cooling performance test', 'Deep coil cleaning'],
        servicesNotIncluded: ['Spare parts cost', 'Gas refill extra']
      }
    ]
  },
  'Washing Machine': {
    image: require('../assets/washing machine.jpg'),
    rating: 4.7,
    reviews: '8K',
    services: [
      {
        id: 1,
        name: 'Basic Washing Machine Service',
        price: 249,
        rating: 4.4,
        servicesIncluded: ['Full cleaning', 'Filter cleaning', 'Drainage check'],
        servicesNotIncluded: ['Spare parts cost', 'Internal parts repair']
      },
      {
        id: 2,
        name: 'Standard Washing Machine Service',
        price: 449,
        rating: 4.6,
        servicesIncluded: ['Full cleaning', 'Filter cleaning', 'Drainage check', 'Spin performance test'],
        servicesNotIncluded: ['Spare parts cost', 'Internal parts repair']
      },
      {
        id: 3,
        name: 'Premium Washing Machine Service',
        price: 699,
        rating: 4.8,
        servicesIncluded: ['Full cleaning', 'Filter cleaning', 'Drainage check', 'Spin performance test', 'Deep drum cleaning'],
        servicesNotIncluded: ['Spare parts cost', 'Internal parts repair']
      }
    ]
  },
  'Refrigerator': {
    image: require('../assets/fridge.jpg'),
    rating: 4.6,
    reviews: '6K',
    services: [
      {
        id: 1,
        name: 'Basic Refrigerator Service',
        price: 199,
        rating: 4.3,
        servicesIncluded: ['Full cleaning', 'Coil cleaning', 'Temperature check'],
        servicesNotIncluded: ['Spare parts cost', 'Gas refill extra']
      },
      {
        id: 2,
        name: 'Standard Refrigerator Service',
        price: 399,
        rating: 4.5,
        servicesIncluded: ['Full cleaning', 'Coil cleaning', 'Temperature check', 'Door seal check'],
        servicesNotIncluded: ['Spare parts cost', 'Gas refill extra']
      },
      {
        id: 3,
        name: 'Premium Refrigerator Service',
        price: 599,
        rating: 4.7,
        servicesIncluded: ['Full cleaning', 'Coil cleaning', 'Temperature check', 'Door seal check', 'Deep frost removal'],
        servicesNotIncluded: ['Spare parts cost', 'Gas refill extra']
      }
    ]
  },
  'Water Purifier': {
    image: require('../assets/water purifier.jpg'),
    rating: 4.5,
    reviews: '4K',
    services: [
      {
        id: 1,
        name: 'Basic Water Purifier Service',
        price: 149,
        rating: 4.2,
        servicesIncluded: ['Filter cleaning', 'UV bulb check', 'Water flow check'],
        servicesNotIncluded: ['Spare parts cost', 'Filter replacement']
      },
      {
        id: 2,
        name: 'Standard Water Purifier Service',
        price: 299,
        rating: 4.4,
        servicesIncluded: ['Filter cleaning', 'UV bulb check', 'Water flow check', 'Quality test'],
        servicesNotIncluded: ['Spare parts cost', 'Filter replacement']
      },
      {
        id: 3,
        name: 'Premium Water Purifier Service',
        price: 449,
        rating: 4.6,
        servicesIncluded: ['Filter cleaning', 'UV bulb check', 'Water flow check', 'Quality test', 'Full sanitization'],
        servicesNotIncluded: ['Spare parts cost', 'Filter replacement']
      }
    ]
  },
  'Television': {
    image: require('../assets/AC.jpg'),
    rating: 4.4,
    reviews: '3K',
    services: [
      {
        id: 1,
        name: 'Basic TV Service',
        price: 199,
        rating: 4.1,
        servicesIncluded: ['Screen cleaning', 'Power check', 'Remote testing'],
        servicesNotIncluded: ['Spare parts cost', 'Screen repair']
      },
      {
        id: 2,
        name: 'Standard TV Service',
        price: 349,
        rating: 4.3,
        servicesIncluded: ['Screen cleaning', 'Power check', 'Remote testing', 'Audio check'],
        servicesNotIncluded: ['Spare parts cost', 'Screen repair']
      },
      {
        id: 3,
        name: 'Premium TV Service',
        price: 499,
        rating: 4.5,
        servicesIncluded: ['Screen cleaning', 'Power check', 'Remote testing', 'Audio check', 'Internal cleaning'],
        servicesNotIncluded: ['Spare parts cost', 'Screen repair']
      }
    ]
  }
};

const ProductServices = ({ 
  isActive, 
  onNavigate, 
  selectedServiceType,
  cartItems,
  addToCart,
  removeFromCart,
  isInCart,
  showToast
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Get the current service type data
  const currentServiceData = serviceData[selectedServiceType] || serviceData['AC'];
  const serviceImage = currentServiceData.image;

  // Handle View Details click
  const handleViewDetails = (service) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  };

  // Handle Add to Cart
  const handleAddToCart = (service) => {
    addToCart({
      id: service.id,
      name: service.name,
      price: service.price,
      serviceType: selectedServiceType
    });
  };

  // Handle Remove from Cart
  const handleRemoveFromCart = (serviceName) => {
    removeFromCart(serviceName);
  };

  // Close modal
  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedService(null);
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Sub-headings based on service type
  const subHeadings = ['Basic Service', 'Standard Service', 'Premium Service'];

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-product-services">
      {/* Mobile header */}
      <div className="page-header-mobile mobile-only">
        <h1 className="page-title-mobile">{selectedServiceType || 'Services'}</h1>
      </div>

      {/* Desktop header */}
      <div className="services-hero desktop-only">
        <h1>{selectedServiceType || 'All'} <span className="accent">Services</span></h1>
        <p>Professional, verified experts for every home service need</p>
      </div>

      {/* Service Packages by Sub-headings */}
      <div className="section-wrap">
        {subHeadings.map((heading, index) => {
          const service = currentServiceData.services[index];
          if (!service) return null;
          
          return (
            <div key={heading} className="service-package-section">
              <h2 className="section-title">{heading}</h2>
              
              {/* Service Card */}
              <div className="product-service-card">
                {/* Left Side */}
                <div className="service-card-left">
                  <h3 className="service-name">{service.name}</h3>
                  
                  {/* Star Rating */}
                  <div className="service-rating">
                    <span className="star">★</span>
                    <span className="rating-value">{service.rating}</span>
                  </div>
                  
                  {/* Services List */}
                  <ul className="service-list">
                    {service.servicesIncluded.slice(0, 3).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  
                  {/* View Details Link */}
                  <button 
                    className="view-details-link"
                    onClick={() => handleViewDetails(service)}
                  >
                    View Details
                  </button>
                </div>
                
                {/* Right Side */}
                <div className="service-card-right">
                  <div className="service-image">
                    <img src={serviceImage} alt={service.name} />
                  </div>
                  
                  {/* Add/Remove Button */}
                  {isInCart(service.name) ? (
                    <button 
                      className="cart-btn remove-from-cart"
                      onClick={() => handleRemoveFromCart(service.name)}
                    >
                      Remove from Cart
                    </button>
                  ) : (
                    <button 
                      className="cart-btn add-to-cart"
                      onClick={() => handleAddToCart(service)}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedService && (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
          <div className="view-details-modal">
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <div className="modal-content">
              {/* Service Name */}
              <h2 className="modal-service-name">{selectedService.name}</h2>
              
              {/* Star Rating */}
              <div className="modal-rating">
                <span className="star">★</span>
                <span className="rating-value">{selectedService.rating}</span>
              </div>
              
              {/* Price in Bold */}
              <p className="modal-price">₹{selectedService.price}</p>
              
              {/* Services Included */}
              <div className="modal-section">
                <h3 className="modal-section-title">Services Included</h3>
                <ul className="modal-list included">
                  {selectedService.servicesIncluded.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              
              {/* Services Not Included */}
              <div className="modal-section">
                <h3 className="modal-section-title">Services Does Not Includes</h3>
                <ul className="modal-list not-included">
                  {selectedService.servicesNotIncluded.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductServices;

