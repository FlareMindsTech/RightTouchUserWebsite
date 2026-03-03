import React, { useState } from 'react';
// Icons-ai import seiyavum
import { 
  Wind, 
  Search, 
  MapPin, 
  ChevronDown, 
  Wrench, 
  Brush, 
  ShieldCheck, 
  Zap, 
  CircleDollarSign, 
  RotateCcw 
} from 'lucide-react';

const HomePage = ({ isActive, onNavigate, onOpenService, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Emoji-ku bathila Icons components
  const categories = [
    { image: require('../assets/AC.jpg'), name: 'AC' },
    { image: require('../assets/washing machine.jpg'), name: 'Washing Machine' },
    { image: require('../assets/fridge.jpg'), name: 'Refrigerator' },
    { image: require('../assets/water purifier.jpg'), name: 'Water Purifier' }
  ];

  const offers = [
    { id: 1, badge: 'HOT DEAL', title: 'Deep clean with foam-jet AC services', desc: 'AC service & repair', icon: <Wind size={40} /> },
    { id: 2, badge: 'NEW', title: 'Home affordable carpet cleaning', desc: 'Electrical & carpet services', icon: <Brush size={40} /> },
    { id: 3, badge: 'SAVE 20%', title: 'Premium plumbing services', desc: 'Bathroom & kitchen repair', icon: <Wrench size={40} /> }
  ];

  const appliances = [
    { image: require('../assets/AC.jpg'), name: 'AC' },
    { image: require('../assets/washing machine.jpg'), name: 'Washing Machine' },
    { image: require('../assets/water purifier.jpg'), name: 'Water Purifier' },
    { image: require('../assets/AC.jpg'), name: 'Television' },
    { image: require('../assets/fridge.jpg'), name: 'Refrigerator' }
  ];

  const whyChooseUs = [
    { icon: <ShieldCheck className="text-blue-500" />, title: 'Verified Experts', desc: 'All technicians are background-checked and certified.' },
    { icon: <Zap className="text-yellow-500" />, title: 'Fast Response', desc: 'Get a technician at your doorstep within 2 hours.' },
    { icon: <CircleDollarSign className="text-green-500" />, title: 'Best Prices', desc: 'Transparent pricing. No hidden charges.' },
    { icon: <RotateCcw className="text-red-500" />, title: 'Money-Back', desc: 'Not satisfied? Get a full refund, no questions asked.' }
  ];

  const handleServiceClick = (service) => {
    // Navigate to product services page with the selected service type
    onNavigate('product-services', service);
    showToast(`Opening ${service} services`);
  };

  const handleApplianceClick = (appliance) => {
    // Navigate to product services page with the selected appliance type
    onNavigate('product-services', appliance);
    showToast(`Opening ${appliance} services`);
  };

  const handleBookNow = (offer) => {
    showToast(`Booking ${offer.title}`);
  };

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-home">
      {/* Mobile location bar */}
      <div className="location-bar mobile-only">
        <div className="location-left">
          <MapPin size={20} className="location-pin" />
          <div className="location-text">
            <strong>67B Gregorio Grove</strong>
            <span>Jaskolskiville, South Africa <ChevronDown size={14} className="chevron" /></span>
          </div>
        </div>
      </div>

      {/* Desktop hero */}
      <div className="desktop-hero desktop-only">
        <div className="hero-content">
          <p className="hero-sub">Your Trusted Partner for</p>
          <h1 className="hero-title">Home Repair & Services</h1>
          <p className="hero-desc">Expert technicians for AC, appliances, plumbing & more. Book in minutes.</p>


        </div>
        
      </div>

      {/* Mobile search */}
      <div className="search-section mobile-only">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search for 'AC Repair'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Grid */}
      <div className="section-wrap">
        <div className="category-grid">
          {categories.map(cat => (
            <div 
              key={cat.name}
              className="category-card"
              onClick={() => handleServiceClick(cat.name)}
            >
              <div className="cat-icon-wrap">
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Offers Carousel */}
      <div className="section-wrap">
        <h2 className="section-title">Offers for you</h2>
        <div className="carousel-track" id="offersCarousel">
          {offers.map(offer => (
            <div key={offer.id} className={`offer-card ${offer.id === 2 ? 'offer-card-2' : offer.id === 3 ? 'offer-card-3' : ''}`}>
              <div className="offer-badge">{offer.badge}</div>
              <div className="offer-text">
                <h3>{offer.title}</h3>
                <p>{offer.desc}</p>
                <button className="btn-book-white" onClick={() => handleBookNow(offer)}>Book Now</button>
              </div>
              <div className={`offer-img offer-img-${offer.id}`}>{offer.icon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Appliance Repair Carousel */}
      <div className="section-wrap">
        <h2 className="section-title">Appliance repair & Services</h2>
        <div className="carousel-track" id="applianceCarousel">
          {appliances.map(app => (
            <div key={app.name} className="appliance-card" onClick={() => handleApplianceClick(app.name)}>
              <div className={`appliance-img-wrap ${app.name.toLowerCase().replace(' ', '')}`}>
                <img src={app.image} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span>{app.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="section-wrap desktop-only">
        <h2 className="section-title">Why Choose RightTouch?</h2>
        <div className="why-grid">
          {whyChooseUs.map(item => (
            <div key={item.title} className="why-card">
              <div className="why-icon" style={{ fontSize: '2rem' }}>{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomePage;