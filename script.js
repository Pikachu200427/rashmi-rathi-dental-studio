// Redirect API requests to the secure public tunnel if hosted on GitHub Pages
(function() {
  const originalFetch = window.fetch;
  window.fetch = function (url, options) {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? ''
      : 'https://60c6d81e69772a.lhr.life';
    if (typeof url === 'string' && url.startsWith('/api/')) {
      url = API_BASE + url;
    }
    return originalFetch(url, options);
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  // --- Load Studio Settings & Reviews from SQLite Backend ---
  
  // Load Settings
  fetch('/api/rashmi_rathi/settings')
    .then(response => response.json())
    .then(settings => {
      const phoneEl = document.getElementById('studio-phone');
      const phoneFooter1 = document.getElementById('studio-phone-footer-1');
      const phoneFooter2 = document.getElementById('studio-phone-footer-2');
      const addressEl = document.getElementById('studio-address');
      const addressFooterEl = document.getElementById('studio-address-footer');
      const hoursWeekEl = document.getElementById('studio-hours-week');
      const hoursSunEl = document.getElementById('studio-hours-sun');

      if (phoneEl) phoneEl.textContent = settings.phone || '+91 9405028335';
      if (phoneFooter1) phoneFooter1.textContent = settings.phone || '+91 9405028335';
      if (phoneFooter2) phoneFooter2.textContent = settings.phone || '+91 9405028335';
      if (addressEl) addressEl.textContent = settings.address || 'Keshav Smurti Building, Great Nag Road, Near SD Hospital, In Front of NIT Sabhagruh, Juni Shukrawari, Nagpur, MH 440024';
      if (addressFooterEl) addressFooterEl.textContent = settings.addressFooter || settings.address || 'Juni Shukrawari, Great Nag Road, Ganesh Nagar, Nagpur - 440024';
      if (hoursWeekEl) hoursWeekEl.textContent = settings.hoursWeek || '10:00 AM - 8:00 PM';
      if (hoursSunEl) hoursSunEl.textContent = settings.hoursSun || '10:00 AM - 2:00 PM (By Appt Only)';
    })
    .catch(err => console.error('Failed to load studio settings from server:', err));

  // Load and Render Testimonials
  const reviewsCarousel = document.getElementById('reviews-carousel');
  const dotsIndicator = document.getElementById('carousel-dots');

  function loadReviews() {
    fetch('/api/rashmi_rathi/reviews')
      .then(response => response.json())
      .then(reviews => {
        if (!reviewsCarousel || !dotsIndicator) return;

        reviewsCarousel.innerHTML = '';
        dotsIndicator.innerHTML = '';

        if (reviews.length === 0) {
          reviewsCarousel.innerHTML = '<div style="color: var(--text-light); text-align: center; width: 100%;">No reviews added yet.</div>';
          return;
        }

        reviews.forEach((review, idx) => {
          // Create Review Card
          const card = document.createElement('div');
          card.className = `review-quote-card ${idx === 0 ? 'active' : ''}`;
          
          let starsHtml = '';
          for (let i = 0; i < review.rating; i++) {
            starsHtml += '<i class="fa-solid fa-star"></i>';
          }

          card.innerHTML = `
            <div class="review-header">
              <div class="reviewer-avatar text-indigo bg-indigo-light">${review.avatar || review.name.substring(0, 2).toUpperCase()}</div>
              <div class="reviewer-meta">
                <h4>${review.name}</h4>
                <div class="rating-stars-small">${starsHtml}</div>
              </div>
            </div>
            <p class="review-body">"${review.quote}"</p>
          `;
          reviewsCarousel.appendChild(card);

          // Create Dot
          const dot = document.createElement('span');
          dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
          dotsIndicator.appendChild(dot);
        });

        initReviewsCarousel();
      })
      .catch(err => console.error('Failed to load reviews from server:', err));
  }

  loadReviews();

  // --- Navigation Header Scroll Animation ---
  const headerNav = document.getElementById('header-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      headerNav.classList.add('scrolled');
    } else {
      headerNav.classList.remove('scrolled');
    }
    highlightMenuLinks();
  });

  // --- Mobile Navigation Menu Toggle ---
  const menuToggle = document.getElementById('menu-toggle');
  const navLinksMenu = document.getElementById('nav-links-menu');
  
  if (menuToggle && navLinksMenu) {
    menuToggle.addEventListener('click', () => {
      navLinksMenu.classList.toggle('open');
      const icon = menuToggle.querySelector('i');
      if (navLinksMenu.classList.contains('open')) {
        icon.classList.replace('fa-bars', 'fa-xmark');
      } else {
        icon.classList.replace('fa-xmark', 'fa-bars');
      }
    });

    // Close menu on click of links
    const menuLinks = navLinksMenu.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinksMenu.classList.remove('open');
        menuToggle.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
      });
    });
  }

  // --- Dynamic Highlighting of Navigation Items ---
  function highlightMenuLinks() {
    const sections = document.querySelectorAll('section');
    const menuLinks = document.querySelectorAll('.menu-link');
    
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 130)) {
        currentSection = section.getAttribute('id');
      }
    });

    menuLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').includes(currentSection)) {
        link.classList.add('active');
      }
    });
  }

  // --- Testimonial Review Carousel Slider ---
  let carouselInterval;
  function initReviewsCarousel() {
    const reviewCards = document.querySelectorAll('.review-quote-card');
    const dots = dotsIndicator.querySelectorAll('.carousel-dot');
    
    if (reviewCards.length === 0) return;
    
    let currentReview = 0;
    
    function showReview(index) {
      if (index >= reviewCards.length) currentReview = 0;
      else if (index < 0) currentReview = reviewCards.length - 1;
      else currentReview = index;
      
      reviewCards.forEach((card, idx) => {
        card.classList.remove('active');
        if (idx === currentReview) {
          card.classList.add('active');
        }
      });
      
      dots.forEach((dot, idx) => {
        dot.classList.remove('active');
        if (idx === currentReview) {
          dot.classList.add('active');
        }
      });
    }
    
    // Dot click listener
    dots.forEach((dot, idx) => {
      dot.replaceWith(dot.cloneNode(true));
    });

    const freshDots = dotsIndicator.querySelectorAll('.carousel-dot');
    freshDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showReview(idx);
        resetAutoPlay();
      });
    });
    
    // Auto rotate review
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
      showReview(currentReview + 1);
    }, 7000);
    
    function resetAutoPlay() {
      clearInterval(carouselInterval);
      carouselInterval = setInterval(() => {
        showReview(currentReview + 1);
      }, 7000);
    }
  }

  // --- Scheduler Form Booking Logic ---
  const schedulerForm = document.getElementById('schedulerForm');
  const schedulerMsg = document.getElementById('scheduler-message');
  
  if (schedulerForm) {
    schedulerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Extract form values
      const patientName = document.getElementById('sched-name').value;
      const contactPhone = document.getElementById('sched-phone').value;
      const treatmentSelect = document.getElementById('sched-treatment');
      const treatmentName = treatmentSelect.options[treatmentSelect.selectedIndex].text;
      const bookingDate = document.getElementById('sched-date').value;
      
      // Extract time slot radio button value
      const timeSlotRadio = document.querySelector('input[name="timeslot"]:checked');
      const selectedTimeSlot = timeSlotRadio ? timeSlotRadio.value : 'Preferred Time Slot';
      const notes = document.getElementById('sched-desc').value;
      
      // Button states update
      const submitBtn = schedulerForm.querySelector('.sched-submit-btn');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Reserving Slot...';
      submitBtn.disabled = true;

      // Save Booking in SQLite Backend
      const bookingData = {
        id: 'B-' + Date.now(),
        name: patientName,
        phone: contactPhone,
        treatment: treatmentName,
        date: bookingDate,
        time: selectedTimeSlot,
        notes: notes,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      fetch('/api/rashmi_rathi/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })
      .then(res => res.json())
      .then(result => {
        // Restore button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        if (result.success) {
          // Success panel reveal
          schedulerMsg.className = 'scheduler-message success';
          schedulerMsg.innerHTML = `
            <strong>Slot Reserved for ${patientName}!</strong><br>
            We've blocked your requested time: <strong>${selectedTimeSlot}</strong> on <strong>${bookingDate}</strong> for <strong>${treatmentName}</strong>.<br>
            We'll call you at <strong>${contactPhone}</strong> within 2 hours to confirm your final appointment time.
          `;
          schedulerForm.reset();
        } else {
          schedulerMsg.className = 'scheduler-message error';
          schedulerMsg.innerHTML = `<strong>Error:</strong> Slot reservation failed. Please try again.`;
        }
        
        schedulerMsg.style.display = 'block';
        
        // Auto fadeout success message
        setTimeout(() => {
          schedulerMsg.style.display = 'none';
        }, 10000);
      })
      .catch(err => {
        console.error('Booking submission failed:', err);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        schedulerMsg.className = 'scheduler-message error';
        schedulerMsg.innerHTML = `<strong>Error:</strong> Server connection failed. Check your network.`;
        schedulerMsg.style.display = 'block';
      });
    });
  }
});
