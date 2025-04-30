// Get DOM elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Add ripple effect function
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - diameter / 2}px`;
    circle.style.top = `${event.clientY - button.offsetTop - diameter / 2}px`;
    circle.classList.add('ripple');
    
    const ripple = button.querySelector('.ripple');
    if (ripple) {
        ripple.remove();
    }
    
    button.appendChild(circle);
}

// Add ripple effect to all buttons
function addRippleEffect() {
    const buttons = document.getElementsByTagName('button');
    for (const button of buttons) {
        button.addEventListener('click', createRipple);
    }
}

// Set button loading state
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        // 更改按钮内容为Loading...
        button.innerHTML = 'Loading...';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        // 恢复原始内容
        button.innerHTML = '<span>Login</span><i class="material-icons" aria-hidden="true">arrow_forward</i>';
    }
}

// Add ripple effect after DOM is loaded
document.addEventListener('DOMContentLoaded', addRippleEffect);

// Login button click event
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Please enter email and password');
        return;
    }
    
    // Set button to loading state
    setButtonLoading(loginBtn, true);
    loginMessage.textContent = '';
    
    // Authenticate with Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful, onAuthStateChanged listener will handle redirection
        })
        .catch((error) => {
            // Login failed
            console.error('Login error:', error);
            
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'User not found';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    break;
                default:
                    errorMessage = 'Login failed, please try again later';
            }
            
            showMessage(errorMessage);
            setButtonLoading(loginBtn, false);
        });
});

// Display message function
function showMessage(message) {
    loginMessage.textContent = message;
    loginMessage.style.display = 'block';
}

// Check user login status
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is logged in, check page type
        const currentPage = window.location.pathname;
        if (currentPage.includes('index.html') || currentPage === '/') {
            // On login page, get user role and redirect
            firebase.database().ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    const userData = snapshot.val();
                    if (userData) {
                        const userRole = userData.role;
                        if (userRole === 'admin') {
                            window.location.href = 'pages/admin.html';
                        } else {
                            window.location.href = 'pages/pos.html';
                        }
                    }
                });
        }
    }
});

// Logout function
function logout() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = '../index.html';
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
} 