// Leave Management System - JavaScript

// User roles
const USER_ROLES = {
    SADMIN: 'sadmin',
    ADMIN: 'admin',
    USER: 'user'
};

// DOM elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginSpinner = document.getElementById('loginSpinner');
const alertContainer = document.getElementById('alertContainer');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const rememberMeCheckbox = document.getElementById('rememberMe');

// Utility Functions
function showAlert(message, type = 'danger') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertContainer.innerHTML = alertHtml;
}

function clearAlerts() {
    alertContainer.innerHTML = '';
}

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loginSpinner.classList.remove('d-none');
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';
    } else {
        loginBtn.disabled = false;
        loginSpinner.classList.add('d-none');
        loginBtn.innerHTML = 'Sign In';
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Get user role from database
async function getUserRole(userId) {
    try {
        const userRef = window.firebaseRef(window.firebaseDatabase, `users/${userId}`);
        const snapshot = await window.firebaseGet(userRef);
        
        if (snapshot.exists()) {
            return snapshot.val().role || USER_ROLES.USER;
        } else {
            // If user doesn't exist in database, create with default role
            await createUserProfile(userId, emailInput.value, USER_ROLES.USER);
            return USER_ROLES.USER;
        }
    } catch (error) {
        console.error('Error getting user role:', error);
        return USER_ROLES.USER;
    }
}

// Create user profile in database
async function createUserProfile(userId, email, role = USER_ROLES.USER) {
    try {
        const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js');
        const userRef = ref(window.firebaseDatabase, `users/${userId}`);
        
        await set(userRef, {
            email: email,
            role: role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating user profile:', error);
    }
}

// Update last login
async function updateLastLogin(userId) {
    try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js');
        const userRef = ref(window.firebaseDatabase, `users/${userId}`);
        
        await update(userRef, {
            lastLogin: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}

// Redirect based on user role
function redirectToAppropriatePanel(role) {
    switch (role) {
        case USER_ROLES.SADMIN:
            window.location.href = 'sadmin-dashboard.html';
            break;
        case USER_ROLES.ADMIN:
            window.location.href = 'admin-dashboard.html';
            break;
        case USER_ROLES.USER:
            window.location.href = 'user-dashboard.html';
            break;
        default:
            window.location.href = 'user-dashboard.html';
    }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validation
    if (!email || !password) {
        showAlert('Please fill in all fields.');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('Please enter a valid email address.');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.');
        return;
    }
    
    setLoading(true);
    
    try {
        // Sign in with Firebase Auth
        const userCredential = await window.signInWithEmailAndPassword(window.firebaseAuth, email, password);
        const user = userCredential.user;
        
        // Get user role from database
        const userRole = await getUserRole(user.uid);
        
        // Update last login
        await updateLastLogin(user.uid);
        
        // Store user info in session if remember me is checked
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberEmail', email);
        } else {
            localStorage.removeItem('rememberEmail');
        }
        
        // Store user role in session
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('userId', user.uid);
        sessionStorage.setItem('userEmail', user.email);
        
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect after a short delay
        setTimeout(() => {
            redirectToAppropriatePanel(userRole);
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'An error occurred during login.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed login attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
            default:
                errorMessage = error.message || 'An unexpected error occurred.';
        }
        
        showAlert(errorMessage);
    } finally {
        setLoading(false);
    }
});

// Handle forgot password
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showAlert('Please enter your email address first.');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('Please enter a valid email address.');
        return;
    }
    
    try {
        await window.sendPasswordResetEmail(window.firebaseAuth, email);
        showAlert('Password reset email sent! Please check your inbox.', 'success');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send password reset email.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            default:
                errorMessage = error.message || 'An unexpected error occurred.';
        }
        
        showAlert(errorMessage);
    }
});

// Check if user is already logged in
window.onAuthStateChanged(window.firebaseAuth, async (user) => {
    if (user) {
        // User is signed in
        try {
            const userRole = await getUserRole(user.uid);
            sessionStorage.setItem('userRole', userRole);
            sessionStorage.setItem('userId', user.uid);
            sessionStorage.setItem('userEmail', user.email);
            
            // Redirect to appropriate dashboard
            redirectToAppropriatePanel(userRole);
        } catch (error) {
            console.error('Error checking user state:', error);
        }
    }
});

// Auto-fill email if remembered
document.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
        passwordInput.focus();
    } else {
        emailInput.focus();
    }
});

// Add enter key support for form submission
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && (emailInput === document.activeElement || passwordInput === document.activeElement)) {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

// Export functions for use in other files
window.LeaveManagementSystem = {
    USER_ROLES,
    getUserRole,
    createUserProfile,
    updateLastLogin,
    showAlert,
    clearAlerts
}; 