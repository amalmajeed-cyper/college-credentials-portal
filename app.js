// ==========================================================================
// DATABASE & STATE CONTROLLER (LOCAL STORAGE AUTH)
// ==========================================================================

// Seed default student database if not already present
function initUserDatabase() {
  if (!localStorage.getItem('college_students')) {
    const defaultStudents = {
      'student@college.edu': {
        email: 'student@college.edu',
        password: 'password123',
        name: 'Jane Doe',
        collegeId: 'SIAZ-2026-9041'
      }
    };
    localStorage.setItem('college_students', JSON.stringify(defaultStudents));
  }
}
initUserDatabase();

function getStudents() {
  return JSON.parse(localStorage.getItem('college_students') || '{}');
}

function registerUser(email, password, name, collegeId) {
  const students = getStudents();
  students[email] = { email, password, name, collegeId };
  localStorage.setItem('college_students', JSON.stringify(students));
}

// Runtime State
const state = {
  currentUser: null,
  tempSignup: { email: '', password: '' },
  generatedOtp: '',
  progressInterval: null
};

// ==========================================================================
// FORM STATE PANEL NAVIGATIONS
// ==========================================================================
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const otpSection = document.getElementById('otp-section');
const profileSection = document.getElementById('profile-section');
const successSection = document.getElementById('success-section');
const dashboardSection = document.getElementById('dashboard-section');

// Navigation triggers
document.getElementById('go-to-signup-btn').addEventListener('click', (e) => {
  e.preventDefault();
  clearBanners();
  switchPanel(loginSection, signupSection);
});

document.getElementById('go-to-login-btn').addEventListener('click', (e) => {
  e.preventDefault();
  clearBanners();
  switchPanel(signupSection, loginSection);
});

function switchPanel(fromPanel, toPanel) {
  fromPanel.style.opacity = '0';
  fromPanel.style.transform = 'translateY(-15px)';
  
  setTimeout(() => {
    fromPanel.classList.remove('active');
    toPanel.classList.add('active');
    toPanel.offsetHeight; // force reflow
    toPanel.style.opacity = '1';
    toPanel.style.transform = 'translateY(0)';
  }, 350);
}

function clearBanners() {
  document.querySelectorAll('.validation-banner').forEach(banner => {
    banner.style.display = 'none';
  });
}

function showBanner(bannerId, message) {
  const banner = document.getElementById(bannerId);
  banner.querySelector('.message').textContent = message;
  banner.style.display = 'flex';
}

// Overlay Loader helpers
function showOverlay(overlayId) {
  document.getElementById(overlayId).classList.add('active');
}

function hideOverlay(overlayId) {
  document.getElementById(overlayId).classList.remove('active');
}

// ==========================================================================
// INTERACTIVE AUTHENTICATION HANDLERS
// ==========================================================================

// 1. LOGIN SUBMIT
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearBanners();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  showOverlay('login-overlay');
  
  // Artificial delay to look professional
  setTimeout(() => {
    hideOverlay('login-overlay');
    const students = getStudents();
    const student = students[email];
    
    if (!student) {
      showBanner('login-error-banner', 'This email is not registered. Please sign up.');
      return;
    }
    
    if (student.password !== password) {
      showBanner('login-error-banner', 'Incorrect password. Please try again.');
      return;
    }
    
    // Successful Login
    state.currentUser = student;
    setupDashboardWorkspace();
    switchPanel(loginSection, dashboardSection);
    startCertificateGenerationFlow();
  }, 800);
});

// 2. SIGN UP SUBMIT (TRIGGERS REAL SMTP EMAIL FOR OTP)
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearBanners();
  
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  
  if (password !== confirmPassword) {
    showBanner('signup-error-banner', 'Passwords do not match.');
    return;
  }
  
  const students = getStudents();
  if (students[email]) {
    showBanner('signup-error-banner', 'This email is already registered. Please log in.');
    return;
  }
  
  // Generate random 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  state.generatedOtp = otp;
  state.tempSignup = { email, password };
  
  showOverlay('signup-overlay');
  
  // Post OTP payload to Node.js backend
  fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
  .then(res => res.json())
  .then(data => {
    hideOverlay('signup-overlay');
    if (data.success) {
      document.getElementById('otp-recipient-label').textContent = email;
      switchPanel(signupSection, otpSection);
    } else {
      showBanner('signup-error-banner', data.error || 'Server failed to send OTP.');
    }
  })
  .catch(err => {
    hideOverlay('signup-overlay');
    showBanner('signup-error-banner', 'Connection error. Verify that the backend server is running.');
    console.error(err);
  });
});

// 3. OTP VERIFICATION SUBMIT
const otpForm = document.getElementById('otp-form');
otpForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearBanners();
  
  showOverlay('otp-overlay');
  
  setTimeout(() => {
    hideOverlay('otp-overlay');
    const enteredOtp = document.getElementById('otp-input').value.trim();
    
    if (enteredOtp !== state.generatedOtp) {
      showBanner('otp-error-banner', 'Invalid verification code. Please check your email inbox.');
      return;
    }
    
    // Verified! Move to profile name input card
    switchPanel(otpSection, profileSection);
  }, 600);
});

// Resend OTP
document.getElementById('resend-otp-btn').addEventListener('click', (e) => {
  e.preventDefault();
  clearBanners();
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  state.generatedOtp = otp;
  
  showOverlay('otp-overlay');
  
  fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: state.tempSignup.email, otp })
  })
  .then(res => res.json())
  .then(data => {
    hideOverlay('otp-overlay');
    if (data.success) {
      showBanner('otp-error-banner', 'A new verification code has been sent to your email.');
      document.getElementById('otp-error-banner').className = 'validation-banner success';
      setTimeout(() => {
        document.getElementById('otp-error-banner').className = 'validation-banner error';
      }, 3000);
    } else {
      showBanner('otp-error-banner', data.error || 'Failed to resend OTP.');
    }
  })
  .catch(err => {
    hideOverlay('otp-overlay');
    showBanner('otp-error-banner', 'Connection error resending verification code.');
  });
});

// 4. PROFILE NAME SUBMIT (AUTO-GENERATES ID)
const profileForm = document.getElementById('profile-form');
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  showOverlay('profile-overlay');
  
  const name = document.getElementById('profile-name').value.trim();
  
  // Auto-generate College ID starting with SIAZ
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const collegeId = `SIAZ-2026-${randomSuffix}`;
  
  setTimeout(() => {
    hideOverlay('profile-overlay');
    // Save credentials in local storage database
    registerUser(state.tempSignup.email, state.tempSignup.password, name, collegeId);
    
    // Success panel binding
    document.getElementById('success-college-id').textContent = collegeId;
    switchPanel(profileSection, successSection);
  }, 800);
});

// Success redirect to Login page
document.getElementById('success-proceed-btn').addEventListener('click', () => {
  document.getElementById('login-email').value = state.tempSignup.email;
  document.getElementById('login-password').value = '';
  clearBanners();
  
  showBanner('login-success-banner', 'Account registered! Please sign in using your credentials.');
  switchPanel(successSection, loginSection);
});


// ==========================================================================
// ACADEMIC DASHBOARD WORKSPACE BUILDER
// ==========================================================================
const dispStudentName = document.getElementById('disp-student-name');
const dispStudentId = document.getElementById('disp-student-id');

const certName = document.getElementById('cert-name');
const certId = document.getElementById('cert-id');
const certDate = document.getElementById('cert-date');

function setupDashboardWorkspace() {
  const user = state.currentUser;
  
  // Set UI labels
  dispStudentName.textContent = user.name;
  dispStudentId.textContent = `ID: ${user.collegeId}`;
  
  // Set certificate placeholders
  certName.textContent = user.name;
  certId.textContent = user.collegeId;
  certDate.textContent = '8 July 2026';
  
  // Reset dispatch panels
  document.getElementById('dispatch-waiting-state').style.display = 'flex';
  document.getElementById('dispatch-success-state').style.display = 'none';
}

// ==========================================================================
// PROGRESS RING & DISPATCH LOGGER ANIMATOR
// ==========================================================================
const progressCircle = document.querySelector('.progress-ring__circle');
const progressValue = document.querySelector('.progress-value');
const radius = progressCircle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

function setProgress(percent) {
  const offset = circumference - (percent / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;
  progressValue.textContent = `${percent}%`;
}

function updateLogState(logId, logState) {
  const logItem = document.getElementById(logId);
  const icon = logItem.querySelector('.icon');
  
  if (logState === 'active') {
    logItem.classList.add('active');
    logItem.classList.remove('complete');
    icon.className = 'fa-solid fa-circle-notch fa-spin icon';
  } else if (logState === 'complete') {
    logItem.classList.add('complete');
    logItem.classList.remove('active');
    icon.className = 'fa-solid fa-circle-check icon';
  } else {
    logItem.classList.remove('active', 'complete');
    icon.className = 'fa-solid fa-circle-notch icon';
  }
}

function startCertificateGenerationFlow() {
  if (state.progressInterval) clearInterval(state.progressInterval);
  
  let percent = 0;
  setProgress(0);
  
  updateLogState('log-1', 'idle');
  updateLogState('log-2', 'idle');
  updateLogState('log-3', 'idle');
  updateLogState('log-4', 'idle');
  
  updateLogState('log-1', 'active');

  state.progressInterval = setInterval(() => {
    percent += 1;
    setProgress(percent);

    if (percent === 25) {
      updateLogState('log-1', 'complete');
      updateLogState('log-2', 'active');
    } else if (percent === 50) {
      updateLogState('log-2', 'complete');
      updateLogState('log-3', 'active');
    } else if (percent === 75) {
      updateLogState('log-3', 'complete');
      updateLogState('log-4', 'active');
    } else if (percent >= 100) {
      clearInterval(state.progressInterval);
      updateLogState('log-4', 'complete');
      progressValue.innerHTML = '<i class="fa-solid fa-check" style="color: var(--accent-green);"></i>';
      
      // Progress complete, compile off-screen HTML certificate into PDF and upload to SMTP server
      compileAndSendCertificatePDF();
    }
  }, 40); // ~4 seconds
}

// ==========================================================================
// COMPILE PDF CERTIFICATE & UPLOAD TO BACKEND FOR SMTP DISPATCH
// ==========================================================================
function compileAndSendCertificatePDF() {
  const element = document.getElementById('google-ai-certificate');
  
  const opt = {
    margin:       0.1,
    filename:     'Google_AI_Certificate.pdf',
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { 
      scale: 2.5, // High-quality resolution
      useCORS: true,
      logging: false
    },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
  };

  // Compile element to PDF raw blob
  html2pdf()
    .set(opt)
    .from(element)
    .outputPdf('blob')
    .then(async (pdfBlob) => {
      // Convert Blob to Base64 String
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        
        try {
          const response = await fetch('/api/send-certificate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: state.currentUser.email,
              name: state.currentUser.name,
              collegeId: state.currentUser.collegeId,
              pdfBase64: base64data
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Success State visual transition
            document.getElementById('sent-email-address').textContent = state.currentUser.email;
            document.getElementById('dispatch-waiting-state').style.display = 'none';
            document.getElementById('dispatch-success-state').style.display = 'block';
          } else {
            alert('Email Dispatch Failed: ' + (data.error || 'Check SMTP configurations on the backend server.'));
            console.error(data.error);
          }
        } catch (error) {
          alert('Network Connection Error: Could not reach the email server backend.');
          console.error(error);
        }
      };
    })
    .catch((error) => {
      alert('PDF Compilation Error.');
      console.error(error);
    });
}

// Local download helper in case they click "Download Backup Copy"
const downloadCertificateBtn = document.getElementById('download-certificate-btn');
downloadCertificateBtn.addEventListener('click', () => {
  downloadCertificateBtn.disabled = true;
  const originalHTML = downloadCertificateBtn.innerHTML;
  downloadCertificateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';

  const element = document.getElementById('google-ai-certificate');
  
  const opt = {
    margin:       0.1,
    filename:     `Google_AI_Certificate_${state.currentUser.name.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { 
      scale: 3, 
      useCORS: true,
      logging: false
    },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      downloadCertificateBtn.disabled = false;
      downloadCertificateBtn.innerHTML = originalHTML;
    })
    .catch((err) => {
      console.error(err);
      downloadCertificateBtn.disabled = false;
      downloadCertificateBtn.innerHTML = originalHTML;
    });
});

// Portal logout click
document.getElementById('dashboard-logout-btn').addEventListener('click', () => {
  state.currentUser = null;
  clearBanners();
  switchPanel(dashboardSection, loginSection);
});
