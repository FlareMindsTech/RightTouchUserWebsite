import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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
  selectedServiceType: propServiceType,
  setSelectedServiceType,
  cartItems,
  addToCart,
  removeFromCart,
  isInCart,
  showToast
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Dummy data for frequently added products
  const frequentlyAddedProducts = [
    { id: 101, name: 'AC Filter', price: 150, image: require('../assets/AC.jpg') },
    { id: 102, name: 'Gas Refill', price: 500, image: require('../assets/washing machine.jpg') },
    { id: 103, name: 'Remote Control', price: 299, image: require('../assets/fridge.jpg') },
    { id: 104, name: 'Copper Pipe', price: 450, image: require('../assets/water purifier.jpg') },
    { id: 105, name: 'Installation Kit', price: 350, image: require('../assets/AC.jpg') }
  ];

  // Handle adding product from carousel to cart
  const handleAddProductToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      serviceType: 'Product',
      quantity: 1
    });
    showToast(`${product.name} added to cart`);
  };

  // Dummy data for reviews
  const reviews = [
    {
      id: 1,
      userName: 'Rajesh Kumar',
      date: '15 Jan 2024',
      serviceName: 'Basic AC Service',
      rating: 5,
      statement: 'Excellent service! The technician was very professional and completed the work on time. Highly recommended!'
    },
    {
      id: 2,
      userName: 'Priya Sharma',
      date: '10 Jan 2024',
      serviceName: 'Premium AC Service',
      rating: 4,
      statement: 'Great experience overall. The team was punctual and did a thorough job. Will definitely use again.'
    },
    {
      id: 3,
      userName: 'Amit Patel',
      date: '05 Jan 2024',
      serviceName: 'Standard AC Service',
      rating: 5,
      statement: 'Very satisfied with the service. They explained everything clearly and the AC is working perfectly now.'
    },
    {
      id: 4,
      userName: 'Sneha Reddy',
      date: '28 Dec 2023',
      serviceName: 'Basic AC Service',
      rating: 4,
      statement: 'Good service at reasonable price. The technician was knowledgeable and fixed the issue quickly.'
    }
  ];

  // Dummy data for FAQs
  const faqs = [
    {
      question: 'How long does the service take?',
      answer: 'Basic service typically takes 45-60 minutes, while premium service may take 90-120 minutes depending on the condition of your AC.'
    },
    {
      question: 'Do you provide warranty on service?',
      answer: 'Yes, we provide 30 days warranty on all our services. If you face any issues within the warranty period, we will fix it free of cost.'
    },
    {
      question: 'Are the technicians verified?',
      answer: 'All our technicians are background-verified, certified, and have minimum 3 years of experience in AC servicing.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major payment methods including UPI, Credit/Debit cards, Net Banking, and Cash on Delivery.'
    },
    {
      question: 'Can I reschedule my appointment?',
      answer: 'Yes, you can reschedule your appointment up to 2 hours before the scheduled time without any extra charges.'
    }
  ];

  // Categories for the category grid
  const categories = [
    { image: require('../assets/AC.jpg'), name: 'AC' },
    { image: require('../assets/washing machine.jpg'), name: 'Washing Machine' },
    { image: require('../assets/fridge.jpg'), name: 'Refrigerator' },
    { image: require('../assets/water purifier.jpg'), name: 'Water Purifier' }
  ];

  // Get service type from URL params or props
  const urlServiceType = searchParams.get('type');
  const selectedServiceType = urlServiceType || propServiceType;

  // Update parent state when URL changes
  React.useEffect(() => {
    if (setSelectedServiceType && urlServiceType) {
      setSelectedServiceType(urlServiceType);
    }
  }, [urlServiceType, setSelectedServiceType]);

  // Get the current service type data
  const currentServiceData = serviceData[selectedServiceType] || serviceData['AC'];
  const serviceImage = currentServiceData.image;

  // Handle category click
  const handleCategoryClick = (categoryName) => {
    navigate(`/product-services?type=${encodeURIComponent(categoryName)}`);
    showToast(`Opening ${categoryName} services`);
  };

  // Handle View Details click
  const handleViewDetails = (service) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  };

  // Get quantity for a specific item
  const getQuantity = (serviceName) => {
    return quantities[serviceName] || 0;
  };

  // Increase quantity
  const increaseQuantity = (service) => {
    const currentQty = quantities[service.name] || 0;
    setQuantities({
      ...quantities,
      [service.name]: currentQty + 1
    });
    // Also add to cart if not already there
    if (!isInCart(service.name)) {
      addToCart({
        id: service.id,
        name: service.name,
        price: service.price,
        serviceType: selectedServiceType,
        quantity: 1
      });
      showToast(`${service.name} added to cart`);
    } else {
      // Update cart item quantity
      showToast(`Added another ${service.name}`);
    }
  };

  // Decrease quantity
  const decreaseQuantity = (service) => {
    const currentQty = quantities[service.name] || 1;
    if (currentQty > 1) {
      setQuantities({
        ...quantities,
        [service.name]: currentQty - 1
      });
      showToast(`Removed one ${service.name}`);
    } else {
      // If quantity becomes 0, remove from cart and reset
      const newQuantities = { ...quantities };
      delete newQuantities[service.name];
      setQuantities(newQuantities);
      removeFromCart(service.name);
      showToast(`${service.name} removed from cart`);
    }
  };

  // Handle Add to Cart click - adds item with quantity 1
  const handleAddToCart = (service) => {
    setQuantities({
      ...quantities,
      [service.name]: 1
    });
    addToCart({
      id: service.id,
      name: service.name,
      price: service.price,
      serviceType: selectedServiceType,
      quantity: 1
    });
    showToast(`${service.name} added to cart`);
  };

  // Handle Remove from Cart
  const handleRemoveFromCart = (serviceName) => {
    const newQuantities = { ...quantities };
    delete newQuantities[serviceName];
    setQuantities(newQuantities);
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

      {/* Category Grid */}
      <div className="section-wrap">
        <div className="category-grid">
          {categories.map(cat => (
            <div 
              key={cat.name}
              className={`category-card ${selectedServiceType === cat.name ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.name)}
            >
              <div className="cat-icon-wrap">
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
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
                  
                  {/* Add/Remove/Quantity Button */}
                  {isInCart(service.name) ? (
                    <div className="quantity-container">
                      <button 
                        className="qty-btn qty-minus"
                        onClick={() => decreaseQuantity(service)}
                      >
                        −
                      </button>
                      <span className="qty-value">{getQuantity(service.name) || 1}</span>
                      <button 
                        className="qty-btn qty-plus"
                        onClick={() => increaseQuantity(service)}
                      >
                        +
                      </button>
                    </div>
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
              {/* Service Name Header with Add to Cart */}
              <div className="modal-header-row">
                <div className="modal-header-left">
                  <h2 className="modal-service-name">{selectedService.name}</h2>
                  {/* Star Rating */}
                  <div className="modal-rating">
                    <span className="star">★</span>
                    <span className="rating-value">{selectedService.rating}</span>
                  </div>
                  {/* Price in Bold */}
                  <p className="modal-price">₹{selectedService.price}</p>
                </div>
                <div className="modal-header-right">
                  {isInCart(selectedService.name) ? (
                    <div className="quantity-container modal-qty">
                      <button 
                        className="qty-btn qty-minus"
                        onClick={() => decreaseQuantity(selectedService)}
                      >
                        −
                      </button>
                      <span className="qty-value">{getQuantity(selectedService.name) || 1}</span>
                      <button 
                        className="qty-btn qty-plus"
                        onClick={() => increaseQuantity(selectedService)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="cart-btn add-to-cart modal-add-btn"
                      onClick={() => handleAddToCart(selectedService)}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>

              {/* Frequently Added Together */}
              <div className="modal-section">
                <h3 className="modal-section-title">Frequently added together</h3>
                <div className="modal-product-carousel">
                  {frequentlyAddedProducts.map(product => (
                    <div key={product.id} className="modal-product-card">
                      <div className="modal-product-image">
                        <img src={product.image} alt={product.name} />
                      </div>
                      <span className="modal-product-name">{product.name}</span>
                      <div className="modal-product-bottom">
                        <span className="modal-product-price">₹{product.price}</span>
                        <button 
                          className="modal-product-cart-btn"
                          onClick={() => handleAddProductToCart(product)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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

              {/* Please Note */}
              <div className="modal-section note-section">
                <h3 className="modal-section-title">Please note</h3>
                <ul className="modal-note-list">
                  <li>Provide a stool if required</li>
                  <li>Provide a ladder if required</li>
                </ul>
              </div>

              {/* Reviews Section */}
              <div className="modal-section reviews-section">
                <div className="reviews-header">
                  <h3 className="modal-section-title">Reviews</h3>
                  <div className="reviews-summary">
                    <span className="star">★</span>
                    <span className="rating-value">4.5</span>
                    <span className="review-count">(12K reviews)</span>
                  </div>
                </div>
                <div className="reviews-list">
                  {reviews.slice(0, 4).map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <span className="review-user">{review.userName}</span>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-rating">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                      <span className="review-service">{review.serviceName}</span>
                      <p className="review-statement">{review.statement}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frequently Asked Questions */}
              <div className="modal-section faq-section">
                <h3 className="modal-section-title">Frequently Asked Questions</h3>
                <div className="faq-list">
                  {faqs.slice(0, 3).map((faq, idx) => (
                    <div key={idx} className="faq-item">
                      <button 
                        className={`faq-question ${openFaqIndex === idx ? 'active' : ''}`}
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      >
                        {faq.question}
                        <span className="faq-icon">{openFaqIndex === idx ? '−' : '+'}</span>
                      </button>
                      {openFaqIndex === idx && (
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {faqs.length > 3 && (
                  <button className="show-more-btn">Show More</button>
                )}
              </div>

              {/* Done Button */}
              <div className="modal-done-section">
                <button className="done-btn" onClick={closeModal}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductServices;

