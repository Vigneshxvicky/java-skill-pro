document.addEventListener('DOMContentLoaded', () => {
  
    // Dark mode toggle
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
      darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
      });
    }
    
    // Membership form validation (if present)
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
      membershipForm.addEventListener('submit', function(e) {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        if (!username || !password) {
          e.preventDefault();
          const msgDiv = document.getElementById('membershipMsg');
          msgDiv.textContent = "Please fill in both username and password.";
          msgDiv.style.display = "block";
        }
      });
    }
  });
  