// Get DOM elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Login button click event
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Please enter email and password');
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Logging in...';
    
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
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="material-icons">login</i> Login';
        });
});

// Display message function
function showMessage(message) {
    loginMessage.textContent = message;
    loginMessage.style.display = 'block';
} 