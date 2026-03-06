// pages/ServicePage.jsx
import React from 'react';
import { 
  Wrench, 
  Zap, 
  Sparkles, 
  Hammer, 
  Droplets, 
  UtensilsCrossed, 
  Bath, 
  Bug 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServicesPage = ({ isActive, onNavigate, onOpenServiceDetail }) => {
  const navigate = useNavigate();
  
  const services = [
    { icon: <Wrench size={24} />, name: 'Appliance Repair' },
    { icon: <Zap size={24} />, name: 'Electricians' },
    { icon: <Sparkles size={24} />, name: 'House Cleaning' },
    { icon: <Hammer size={24} />, name: 'Carpenter' },
    { icon: <Droplets size={24} />, name: 'Plumber' },
    { icon: <UtensilsCrossed size={24} />, name: 'Kitchen Cleaning' },
    { icon: <Bath size={24} />, name: 'Bathroom Cleaning' },
    { icon: <Bug size={24} />, name: 'Pest Control' }
  ];

  // Map general services to product categories for navigation
  const serviceToCategoryMap = {
    'Appliance Repair': 'AC',
    'Electricians': 'AC',
    'House Cleaning': 'AC',
    'Carpenter': 'AC',
    'Plumber': 'AC',
    'Kitchen Cleaning': 'AC',
    'Bathroom Cleaning': 'AC',
    'Pest Control': 'AC'
  };

  const filteredServices = services;

  // Handle service click - navigate to product-services page
  const handleServiceClick = (serviceName) => {
    const category = serviceToCategoryMap[serviceName] || 'AC';
    navigate(`/product-services?type=${encodeURIComponent(category)}`);
  };

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
      {/* Mobile header */}
      <div className="page-header-mobile mobile-only">
        <h1 className="page-title-mobile">Home Services</h1>
      </div>

      {/* Desktop header */}
      <div className="services-hero desktop-only">
        <h1>Our <span className="accent">Services</span></h1>
        <p>Professional, verified experts for every home service need</p>
      </div>

      {/* Service Grid */}
      <div className="section-wrap">
        <div className="service-grid" id="serviceGrid">
          {filteredServices.map(service => (
            <div 
              key={service.name}
              className="service-card"
              onClick={() => handleServiceClick(service.name)}
            >
              <div className="service-icon">{service.icon}</div>
              <span>{service.name}</span>
            </div>
          ))}
        </div>
      </div>


    </section>
  );
};

export default ServicesPage;

