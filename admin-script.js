document.addEventListener('DOMContentLoaded', () => {
  // --- Check Authentication State ---
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logoutBtn');

  function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('rashmi_rathi_admin_auth');
    if (isAuthenticated === 'true') {
      loginSection.classList.add('hidden');
      dashboardSection.classList.remove('hidden');
      initDashboard();
    } else {
      loginSection.classList.remove('hidden');
      dashboardSection.classList.add('hidden');
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('username').value.trim();
      const pass = document.getElementById('password').value.trim();

      // Simple credentials check
      if (user === 'admin' && pass === 'admin123') {
        sessionStorage.setItem('rashmi_rathi_admin_auth', 'true');
        loginError.style.display = 'none';
        checkAuth();
      } else {
        loginError.style.display = 'block';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('rashmi_rathi_admin_auth');
      checkAuth();
    });
  }

  checkAuth();

  // --- Dashboard Controller ---
  function initDashboard() {
    // --- Navigation Tabs ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const tabTitle = document.getElementById('tab-title');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tab}-panel`).classList.add('active');
        
        tabTitle.textContent = btn.textContent.trim();

        // Reload data based on active tab
        if (tab === 'overview') loadOverviewStats();
        if (tab === 'appointments') loadBookingsTable();
        if (tab === 'settings') loadStudioSettings();
        if (tab === 'reviews') loadReviewsControl();
      });
    });

    const viewAllBookingsShortcut = document.getElementById('view-all-bookings-shortcut');
    if (viewAllBookingsShortcut) {
      viewAllBookingsShortcut.addEventListener('click', () => {
        const bookingsBtn = document.querySelector('.nav-btn[data-tab="appointments"]');
        if (bookingsBtn) bookingsBtn.click();
      });
    }

    // --- Tab 1: Overview Stats & Recent Activity ---
    function loadOverviewStats() {
      fetch('/api/rashmi_rathi/bookings')
        .then(res => res.json())
        .then(bookings => {
          updateNavBadge(bookings);
          
          const totalBookingsEl = document.getElementById('stat-total-bookings');
          const pendingBookingsEl = document.getElementById('stat-pending-bookings');
          const confirmedBookingsEl = document.getElementById('stat-confirmed-bookings');
          
          const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
          const pendingCount = bookings.filter(b => b.status === 'Pending').length;
          
          if (totalBookingsEl) totalBookingsEl.textContent = bookings.length;
          if (pendingBookingsEl) pendingBookingsEl.textContent = pendingCount;
          if (confirmedBookingsEl) confirmedBookingsEl.textContent = confirmedCount;

          const recentList = document.getElementById('recent-bookings-list');
          if (recentList) {
            recentList.innerHTML = '';
            const sortedRecent = bookings.slice(0, 5); // Sorted by server descending
            
            if (sortedRecent.length === 0) {
              recentList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-light); padding: 15px;">No bookings recorded yet.</td></tr>';
              return;
            }

            sortedRecent.forEach(b => {
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td><strong>${escapeHTML(b.name)}</strong></td>
                <td>${escapeHTML(b.phone)}</td>
                <td>${escapeHTML(b.treatment)}</td>
                <td>${escapeHTML(b.date)} (${escapeHTML(b.time)})</td>
                <td><span class="status-badge ${b.status.toLowerCase()}">${b.status}</span></td>
                <td>
                  <div class="action-btns">
                    ${b.status === 'Pending' ? `<button class="action-btn confirm" data-id="${b.id}"><i class="fa-solid fa-check"></i> Confirm</button>` : ''}
                    <button class="action-btn delete" data-id="${b.id}"><i class="fa-solid fa-trash"></i> Delete</button>
                  </div>
                </td>
              `;
              recentList.appendChild(tr);
            });

            attachTableButtonListeners(recentList, loadOverviewStats);
          }
        })
        .catch(err => console.error('Failed to load overview statistics:', err));
    }

    // --- Tab 2: Bookings Management ---
    const filterSelect = document.getElementById('booking-filter-status');
    if (filterSelect) {
      const newFilterSelect = filterSelect.cloneNode(true);
      filterSelect.replaceWith(newFilterSelect);
      newFilterSelect.addEventListener('change', () => {
        loadBookingsTable();
      });
    }

    function loadBookingsTable() {
      fetch('/api/rashmi_rathi/bookings')
        .then(res => res.json())
        .then(bookings => {
          updateNavBadge(bookings);
          const allList = document.getElementById('all-bookings-list');
          if (!allList) return;
          
          allList.innerHTML = '';
          const activeFilterSelect = document.getElementById('booking-filter-status');
          const filterValue = activeFilterSelect ? activeFilterSelect.value : 'all';
          
          const filteredBookings = bookings.filter(b => {
            if (filterValue === 'all') return true;
            return b.status === filterValue;
          });

          if (filteredBookings.length === 0) {
            allList.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-light); padding: 30px;">No scheduler requests found matching filter.</td></tr>`;
            return;
          }

          filteredBookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${escapeHTML(b.name)}</strong><br><small style="color: var(--text-light);">${b.notes ? escapeHTML(b.notes) : ''}</small></td>
              <td>${escapeHTML(b.phone)}</td>
              <td>${escapeHTML(b.treatment)}</td>
              <td>${escapeHTML(b.date)}</td>
              <td>${escapeHTML(b.time)}</td>
              <td><span class="status-badge ${b.status.toLowerCase()}">${b.status}</span></td>
              <td>
                <div class="action-btns">
                  ${b.status === 'Pending' ? `<button class="action-btn confirm" data-id="${b.id}"><i class="fa-solid fa-check"></i> Confirm</button>` : ''}
                  <button class="action-btn delete" data-id="${b.id}"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
              </td>
            `;
            allList.appendChild(tr);
          });

          attachTableButtonListeners(allList, loadBookingsTable);
        })
        .catch(err => console.error('Failed to load bookings list:', err));
    }

    function attachTableButtonListeners(tbody, reloadCallback) {
      tbody.querySelectorAll('.action-btn.confirm').forEach(btn => {
        btn.addEventListener('click', () => {
          const bookingId = btn.getAttribute('data-id');
          updateBookingStatus(bookingId, 'Confirmed', reloadCallback);
        });
      });

      tbody.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this booking record?')) {
            const bookingId = btn.getAttribute('data-id');
            deleteBooking(bookingId, reloadCallback);
          }
        });
      });
    }

    function updateBookingStatus(id, newStatus, callback) {
      fetch('/api/rashmi_rathi/bookings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) callback();
      })
      .catch(err => console.error('Error updating booking status:', err));
    }

    function deleteBooking(id, callback) {
      fetch('/api/rashmi_rathi/bookings/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) callback();
      })
      .catch(err => console.error('Error deleting booking:', err));
    }

    // --- Tab 3: Settings Editor ---
    const settingsForm = document.getElementById('settingsForm');

    function loadStudioSettings() {
      fetch('/api/rashmi_rathi/settings')
        .then(res => res.json())
        .then(settings => {
          document.getElementById('set-phone').value = settings.phone || '';
          document.getElementById('set-address').value = settings.address || '';
          document.getElementById('set-address-footer').value = settings.addressFooter || '';
          document.getElementById('set-hours-week').value = settings.hoursWeek || '';
          document.getElementById('set-hours-sun').value = settings.hoursSun || '';
        })
        .catch(err => console.error('Error loading settings:', err));
    }

    if (settingsForm) {
      const newSettingsForm = settingsForm.cloneNode(true);
      settingsForm.replaceWith(newSettingsForm);
      
      newSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('set-phone').value;
        const address = document.getElementById('set-address').value;
        const addressFooter = document.getElementById('set-address-footer').value;
        const hoursWeek = document.getElementById('set-hours-week').value;
        const hoursSun = document.getElementById('set-hours-sun').value;
        
        fetch('/api/rashmi_rathi/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, address, addressFooter, hoursWeek, hoursSun })
        })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            const msg = document.getElementById('settings-save-success');
            if (msg) {
              msg.style.display = 'block';
              setTimeout(() => { msg.style.display = 'none'; }, 4000);
            }
          }
        })
        .catch(err => console.error('Error saving settings:', err));
      });
    }

    // --- Tab 4: Reviews Manager ---
    const addReviewForm = document.getElementById('addReviewForm');
    
    function loadReviewsControl() {
      fetch('/api/rashmi_rathi/reviews')
        .then(res => res.json())
        .then(reviews => {
          const adminReviewsList = document.getElementById('admin-reviews-list');
          if (!adminReviewsList) return;
          
          adminReviewsList.innerHTML = '';
          
          if (reviews.length === 0) {
            adminReviewsList.innerHTML = '<div style="color: var(--text-light); text-align: center; padding: 20px;">No custom reviews found.</div>';
            return;
          }
          
          reviews.forEach(r => {
            const div = document.createElement('div');
            div.className = 'review-admin-card';
            div.innerHTML = `
              <button class="delete-review-btn" data-id="${r.id}" title="Delete Testimonial"><i class="fa-solid fa-trash"></i></button>
              <h4>${escapeHTML(r.name)} (${r.rating} Stars)</h4>
              <span>${escapeHTML(r.meta)}</span>
              <p>"${escapeHTML(r.quote)}"</p>
            `;
            adminReviewsList.appendChild(div);
          });

          // Attach Delete review clickers
          adminReviewsList.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              if (confirm('Are you sure you want to delete this patient testimonial?')) {
                const reviewId = btn.getAttribute('data-id');
                deleteReview(reviewId);
              }
            });
          });
        })
        .catch(err => console.error('Error loading reviews list:', err));
    }

    if (addReviewForm) {
      const newReviewForm = addReviewForm.cloneNode(true);
      addReviewForm.replaceWith(newReviewForm);
      
      newReviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('rev-name').value;
        const meta = document.getElementById('rev-meta').value;
        const rating = parseInt(document.getElementById('rev-rating').value, 10);
        const quote = document.getElementById('rev-quote').value;
        const avatar = name.substring(0, 2).toUpperCase();

        const newReview = { name, meta, rating, avatar, quote, created_at: new Date().toISOString() };
        
        fetch('/api/rashmi_rathi/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReview)
        })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            newReviewForm.reset();
            loadReviewsControl();
          }
        })
        .catch(err => console.error('Error saving review:', err));
      });
    }

    function deleteReview(id) {
      fetch('/api/rashmi_rathi/reviews/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) loadReviewsControl();
      })
      .catch(err => console.error('Error deleting review:', err));
    }

    function updateNavBadge(bookings) {
      const badge = document.getElementById('nav-booking-badge');
      const pendingCount = bookings.filter(b => b.status === 'Pending').length;
      if (badge) {
        if (pendingCount > 0) {
          badge.textContent = pendingCount;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }

    // Helper: Escape HTML strings for safety
    function escapeHTML(str) {
      return str.replace(/[&<>'"]/g, 
        tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag)
      );
    }

    // Load initial tab data
    loadOverviewStats();
  }
});
