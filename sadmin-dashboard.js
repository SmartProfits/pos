// Super Admin Dashboard JavaScript

// User roles
const USER_ROLES = {
    SADMIN: 'sadmin',
    ADMIN: 'admin',
    USER: 'user'
};

// DOM elements
const userEmailNav = document.getElementById('userEmailNav');
const logoutBtn = document.getElementById('logoutBtn');

// Company Management Elements
const createCompanyBtn = document.getElementById('createCompanyBtn');
const createCompanyBtnSidebar = document.getElementById('createCompanyBtnSidebar');
const createCompanyModal = new bootstrap.Modal(document.getElementById('createCompanyModal'));
const createCompanyForm = document.getElementById('createCompanyForm');
const createCompanySubmitBtn = document.getElementById('createCompanySubmitBtn');
const createCompanySpinner = document.getElementById('createCompanySpinner');
const refreshCompaniesBtn = document.getElementById('refreshCompaniesBtn');
const companiesTableBody = document.getElementById('companiesTableBody');
const companyModalTitle = document.getElementById('companyModalTitle');
const companySubmitBtnText = document.getElementById('companySubmitBtnText');

// User Management Elements
const createUserBtn = document.getElementById('createUserBtn');
const createUserModal = new bootstrap.Modal(document.getElementById('createUserModal'));
const createUserForm = document.getElementById('createUserForm');
const createUserSubmitBtn = document.getElementById('createUserSubmitBtn');
const createUserSpinner = document.getElementById('createUserSpinner');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const usersTableBody = document.getElementById('usersTableBody');
const newUserRole = document.getElementById('newUserRole');
const newUserName = document.getElementById('newUserName');
const companyPermissionsSection = document.getElementById('companyPermissionsSection');
const companyPermissionsList = document.getElementById('companyPermissionsList');
const userModalTitle = document.getElementById('userModalTitle');
const userSubmitBtnText = document.getElementById('userSubmitBtnText');
const passwordSection = document.getElementById('passwordSection');

const alertContainer = document.getElementById('alertContainer');

// Stats elements
const totalCompaniesElement = document.getElementById('totalCompanies');
const totalUsersElement = document.getElementById('totalUsers');
const approvedLeavesElement = document.getElementById('approvedLeaves');
const pendingLeavesElement = document.getElementById('pendingLeaves');

// Current user data
let currentUser = null;
let currentUserRole = null;

// Edit state tracking
let editingCompanyId = null;
let editingUserId = null;

// Utility Functions
function showAlert(message, type = 'danger') {
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getRoleBadgeClass(role) {
    switch (role) {
        case USER_ROLES.SADMIN:
            return 'bg-danger';
        case USER_ROLES.ADMIN:
            return 'bg-warning';
        case USER_ROLES.USER:
            return 'bg-primary';
        default:
            return 'bg-secondary';
    }
}

function setLoading(button, isLoading, spinner, originalText = '') {
    if (isLoading) {
        button.disabled = true;
        spinner.classList.remove('d-none');
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Loading...`;
    } else {
        button.disabled = false;
        spinner.classList.add('d-none');
        button.innerHTML = originalText || button.textContent.replace('Loading...', '').trim();
    }
}

// Check authentication and permissions
function checkAuth() {
    const userRole = sessionStorage.getItem('userRole');
    const userId = sessionStorage.getItem('userId');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (!userId || !userRole) {
        window.location.href = 'index.html';
        return false;
    }
    
    if (userRole !== USER_ROLES.SADMIN) {
        showAlert('Access denied. Super Admin privileges required.', 'danger');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }
    
    currentUserRole = userRole;
    currentUser = { uid: userId, email: userEmail };
    userEmailNav.textContent = userEmail;
    
    return true;
}

// Load all companies from database
async function loadCompanies() {
    try {
        const companiesRef = window.firebaseRef(window.firebaseDatabase, 'companies');
        const snapshot = await window.firebaseGet(companiesRef);
        
        if (snapshot.exists()) {
            const companies = snapshot.val();
            allCompaniesData = companies; // Store globally for company expansion
            displayCompanies(companies);
            return companies;
        } else {
            allCompaniesData = {};
            companiesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No companies found</td></tr>';
            return {};
        }
    } catch (error) {
        console.error('Error loading companies:', error);
        showAlert('Failed to load companies. Please try again.');
        companiesTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading companies</td></tr>';
        return {};
    }
}

// Display companies in table
function displayCompanies(companies) {
    const companyEntries = Object.entries(companies);
    
    if (companyEntries.length === 0) {
        companiesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No companies found</td></tr>';
        return;
    }
    
    const tableRows = companyEntries.map(([companyId, companyData]) => {
        return `
            <tr>
                <td><strong>${companyData.name}</strong></td>
                <td>${companyData.location || '-'}</td>
                <td>${companyData.address || '-'}</td>
                <td>${formatDate(companyData.createdAt)}</td>
                <td><span class="badge bg-info">${companyData.userCount || 0}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="editCompany('${companyId}')" title="Edit Company">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteCompany('${companyId}', '${companyData.name}')" title="Delete Company">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    companiesTableBody.innerHTML = tableRows;
}

// Create or update company
async function saveCompany(name, location, address, isEdit = false) {
    try {
        const companyId = isEdit ? editingCompanyId : 'comp_' + Date.now();
        
        // Prepare company data
        const companyData = {
            name: name,
            location: location,
            address: address
        };
        
        if (isEdit) {
            // Get existing data to preserve certain fields
            const existingRef = window.firebaseRef(window.firebaseDatabase, `companies/${companyId}`);
            const existingSnapshot = await window.firebaseGet(existingRef);
            if (existingSnapshot.exists()) {
                const existingData = existingSnapshot.val();
                companyData.createdAt = existingData.createdAt;
                companyData.userCount = existingData.userCount || 0;
            }
            companyData.updatedAt = new Date().toISOString();
        } else {
            companyData.createdAt = new Date().toISOString();
            companyData.userCount = 0;
        }
        
        // Save company in database
        const companyRef = window.firebaseRef(window.firebaseDatabase, `companies/${companyId}`);
        await window.firebaseSet(companyRef, companyData);
        
        showAlert(`Company "${name}" ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
        
        // Refresh companies list
        loadData();
        
        return true;
    } catch (error) {
        console.error('Error saving company:', error);
        showAlert(`Failed to ${isEdit ? 'update' : 'create'} company. Please try again.`);
        return false;
    }
}

// Delete company
async function deleteCompanyAction(companyId) {
    try {
        // Check if company has users assigned
        const usersRef = window.firebaseRef(window.firebaseDatabase, 'users');
        const usersSnapshot = await window.firebaseGet(usersRef);
        let hasUsers = false;
        
        if (usersSnapshot.exists()) {
            const users = usersSnapshot.val();
            for (const userData of Object.values(users)) {
                if (userData.companyPermissions && userData.companyPermissions[companyId]) {
                    hasUsers = true;
                    break;
                }
            }
        }
        
        if (hasUsers) {
            showAlert('Cannot delete company: There are users assigned to this company. Please remove user assignments first.');
            return false;
        }
        
        // Delete company employees first
        const employeesRef = window.firebaseRef(window.firebaseDatabase, `employees/${companyId}`);
        await window.firebaseSet(employeesRef, null);
        
        // Delete company
        const companyRef = window.firebaseRef(window.firebaseDatabase, `companies/${companyId}`);
        await window.firebaseSet(companyRef, null);
        
        showAlert('Company deleted successfully!', 'success');
        
        // Refresh companies list
        loadData();
        
        return true;
    } catch (error) {
        console.error('Error deleting company:', error);
        showAlert('Failed to delete company. Please try again.');
        return false;
    }
}

// Load all users from database
async function loadUsers() {
    try {
        const usersRef = window.firebaseRef(window.firebaseDatabase, 'users');
        const snapshot = await window.firebaseGet(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            displayUsers(users);
            return users;
        } else {
            usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
            return {};
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Failed to load users. Please try again.');
        usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading users</td></tr>';
        return {};
    }
}

// Store companies data globally for company expansion
let allCompaniesData = {};

// Toggle company details for a specific user
function toggleUserCompanies(userId) {
    const existingExpansion = document.getElementById(`company-expansion-${userId}`);
    
    if (existingExpansion) {
        // If expansion already exists, remove it (collapse)
        existingExpansion.remove();
        return;
    }
    
    // Get user data to find their company permissions
    getUserCompanies(userId);
}

// Get and display user's companies
async function getUserCompanies(userId) {
    try {
        const userRef = window.firebaseRef(window.firebaseDatabase, `users/${userId}`);
        const snapshot = await window.firebaseGet(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const companyPermissions = userData.companyPermissions || {};
            
            // Create expansion row
            const userRow = document.getElementById(`user-row-${userId}`);
            if (userRow) {
                const expansionRow = createCompanyExpansionRow(userId, companyPermissions);
                userRow.insertAdjacentHTML('afterend', expansionRow);
            }
        }
    } catch (error) {
        console.error('Error loading user companies:', error);
        showAlert('Failed to load user companies.');
    }
}

// Create company expansion row HTML
function createCompanyExpansionRow(userId, companyPermissions) {
    const companyIds = Object.keys(companyPermissions);
    
    if (companyIds.length === 0) {
        return `
            <tr id="company-expansion-${userId}" class="table-light">
                <td colspan="6" class="px-4 py-3">
                    <div class="text-muted">No companies assigned to this user.</div>
                </td>
            </tr>
        `;
    }
    
    const companiesList = companyIds.map(companyId => {
        const company = allCompaniesData[companyId];
        if (!company) {
            return `
                <div class="d-flex align-items-center mb-2 p-2 bg-white rounded border">
                    <i class="bi bi-building text-muted me-3"></i>
                    <div>
                        <strong class="text-danger">Unknown Company</strong>
                        <small class="text-muted d-block">Company ID: ${companyId}</small>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="d-flex align-items-center mb-2 p-2 bg-white rounded border">
                <i class="bi bi-building text-primary me-3"></i>
                <div>
                    <strong>${company.name}</strong>
                    <small class="text-muted d-block">
                        <i class="bi bi-geo-alt me-1"></i>${company.location || 'No location specified'}
                    </small>
                    ${company.address ? `<small class="text-muted d-block">${company.address}</small>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <tr id="company-expansion-${userId}" class="table-light">
            <td colspan="6" class="px-4 py-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-primary">
                        <i class="bi bi-buildings me-2"></i>Company Access (${companyIds.length})
                    </h6>
                    <button class="btn btn-sm btn-outline-secondary" onclick="toggleUserCompanies('${userId}')" title="Collapse">
                        <i class="bi bi-chevron-up"></i>
                    </button>
                </div>
                <div class="companies-list">
                    ${companiesList}
                </div>
            </td>
        </tr>
    `;
}

// Display users in table
function displayUsers(users) {
    const userEntries = Object.entries(users);
    
    if (userEntries.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
        return;
    }
    
    const tableRows = userEntries.map(([uid, userData]) => {
        const roleBadgeClass = getRoleBadgeClass(userData.role);
        const companyPermissions = userData.companyPermissions || {};
        const companiesCount = Object.keys(companyPermissions).length;
        
        let companiesDisplay = '-';
        if (userData.role === USER_ROLES.SADMIN || userData.role === USER_ROLES.ADMIN) {
            companiesDisplay = '<span class="badge bg-success">All Companies</span>';
        } else if (companiesCount > 0) {
            companiesDisplay = `<span class="badge bg-info clickable-companies" style="cursor: pointer;" onclick="toggleUserCompanies('${uid}')" data-user-id="${uid}">${companiesCount} Companies</span>`;
        }
        
        return `
            <tr id="user-row-${uid}">
                <td>
                    <strong>${userData.profile?.name || 'No Name'}</strong>
                    <br><small class="text-muted">${userData.email}</small>
                </td>
                <td><span class="badge ${roleBadgeClass}">${userData.role?.toUpperCase() || 'USER'}</span></td>
                <td>${companiesDisplay}</td>
                <td>${formatDate(userData.createdAt)}</td>
                <td>${formatDate(userData.lastLogin)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="editUser('${uid}')" title="Edit User">
                            <i class="bi bi-pencil"></i>
                        </button>

                        ${userData.role !== USER_ROLES.SADMIN ? `
                            <button class="btn btn-outline-danger" onclick="deleteUser('${uid}', '${userData.email}')" title="Delete User">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    usersTableBody.innerHTML = tableRows;
}

// Load all data
async function loadData() {
    const [companies, users] = await Promise.all([
        loadCompanies(),
        loadUsers()
    ]);
    updateStats(companies, users);
    await loadCompanyPermissionsInCreateForm();
}

// Update dashboard stats
function updateStats(companies, users) {
    const companyEntries = Object.entries(companies || {});
    const userEntries = Object.entries(users || {});
    
    totalCompaniesElement.textContent = companyEntries.length;
    totalUsersElement.textContent = userEntries.length;
    
    // For now, set leave stats to 0 as we haven't implemented leave requests yet
    approvedLeavesElement.textContent = '0';
    pendingLeavesElement.textContent = '0';
}

// Load company permissions for create user form
async function loadCompanyPermissionsInCreateForm() {
    try {
        const companiesRef = window.firebaseRef(window.firebaseDatabase, 'companies');
        const snapshot = await window.firebaseGet(companiesRef);
        
        if (snapshot.exists()) {
            const companies = snapshot.val();
            const companyEntries = Object.entries(companies);
            
            if (companyEntries.length > 0) {
                const permissionsHtml = companyEntries.map(([companyId, companyData]) => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="company_${companyId}" value="${companyId}">
                        <label class="form-check-label" for="company_${companyId}">
                            <strong>${companyData.name}</strong>
                            <small class="text-muted d-block">${companyData.location || 'No location'} - ${companyData.address || 'No address'}</small>
                        </label>
                    </div>
                `).join('');
                
                companyPermissionsList.innerHTML = permissionsHtml;
            } else {
                companyPermissionsList.innerHTML = '<p class="text-muted">No companies available. Create companies first.</p>';
            }
        } else {
            companyPermissionsList.innerHTML = '<p class="text-muted">No companies available. Create companies first.</p>';
        }
    } catch (error) {
        console.error('Error loading companies for permissions:', error);
        companyPermissionsList.innerHTML = '<p class="text-danger">Error loading companies.</p>';
    }
}

// Get selected company permissions
function getSelectedCompanyPermissions() {
    const permissions = {};
    const checkboxes = companyPermissionsList.querySelectorAll('input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        const companyId = checkbox.value;
        permissions[companyId] = {
            read: true,
            write: true  // For now, giving full access. Can be customized later
        };
    });
    
    return permissions;
}

// Create or update user
async function saveUser(email, password, name, role, companyPermissions = {}, isEdit = false) {
    try {
        let userId;
        
        if (isEdit) {
            userId = editingUserId;
            
            // Update existing user data
            const userRef = window.firebaseRef(window.firebaseDatabase, `users/${userId}`);
            const existingSnapshot = await window.firebaseGet(userRef);
            
            if (!existingSnapshot.exists()) {
                showAlert('User not found.');
                return false;
            }
            
            const existingData = existingSnapshot.val();
            const userData = {
                ...existingData,
                email: email,
                role: role,
                profile: {
                    ...existingData.profile,
                    name: name,
                    updatedAt: new Date().toISOString()
                }
            };
            
            // Update company permissions for users (admins and sadmins have access to all)
            if (role === USER_ROLES.USER && Object.keys(companyPermissions).length > 0) {
                userData.companyPermissions = companyPermissions;
            } else if (role !== USER_ROLES.USER) {
                // Remove company permissions for admin/sadmin roles
                delete userData.companyPermissions;
            }
            
            await window.firebaseSet(userRef, userData);
            
        } else {
            // Create user with Firebase Auth
            const userCredential = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            const user = userCredential.user;
            userId = user.uid;
            
            // Prepare user data
            const userData = {
                email: email,
                role: role,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                profile: {
                    name: name,
                    updatedAt: new Date().toISOString()
                }
            };
            
            // Add company permissions for users (admins and sadmins have access to all)
            if (role === USER_ROLES.USER && Object.keys(companyPermissions).length > 0) {
                userData.companyPermissions = companyPermissions;
            }
            
            // Create user profile in database
            const userRef = window.firebaseRef(window.firebaseDatabase, `users/${userId}`);
            await window.firebaseSet(userRef, userData);
        }
        
        // Update company user counts
        await updateCompanyUserCounts();
        
        showAlert(`User ${name} (${email}) ${isEdit ? 'updated' : 'created'} successfully with role: ${role}`, 'success');
        
        // Refresh data
        loadData();
        
        return true;
    } catch (error) {
        console.error('Error saving user:', error);
        let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} user.`;
        
        if (!isEdit) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email address is already in use.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                    break;
                default:
                    errorMessage = error.message || 'An unexpected error occurred.';
            }
        }
        
        showAlert(errorMessage);
        return false;
    }
}

// Delete user
async function deleteUserAction(userId) {
    try {
        // Delete user from database
        const userRef = window.firebaseRef(window.firebaseDatabase, `users/${userId}`);
        await window.firebaseSet(userRef, null);
        
        // Note: We cannot delete the Firebase Auth user from the client side
        // This would require Firebase Admin SDK on the server side
        
        // Update company user counts
        await updateCompanyUserCounts();
        
        showAlert('User deleted successfully!', 'success');
        
        // Refresh data
        loadData();
        
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user. Please try again.');
        return false;
    }
}

// Update company user counts
async function updateCompanyUserCounts() {
    try {
        const usersRef = window.firebaseRef(window.firebaseDatabase, 'users');
        const usersSnapshot = await window.firebaseGet(usersRef);
        
        const companiesRef = window.firebaseRef(window.firebaseDatabase, 'companies');
        const companiesSnapshot = await window.firebaseGet(companiesRef);
        
        if (!companiesSnapshot.exists()) return;
        
        const companies = companiesSnapshot.val();
        const companyUserCounts = {};
        
        // Initialize all company counts to 0
        for (const companyId of Object.keys(companies)) {
            companyUserCounts[companyId] = 0;
        }
        
        // Count users for each company
        if (usersSnapshot.exists()) {
            const users = usersSnapshot.val();
            for (const userData of Object.values(users)) {
                if (userData.companyPermissions) {
                    for (const companyId of Object.keys(userData.companyPermissions)) {
                        if (companyUserCounts.hasOwnProperty(companyId)) {
                            companyUserCounts[companyId]++;
                        }
                    }
                }
            }
        }
        
        // Update each company's user count
        for (const [companyId, userCount] of Object.entries(companyUserCounts)) {
            const companyRef = window.firebaseRef(window.firebaseDatabase, `companies/${companyId}/userCount`);
            await window.firebaseSet(companyRef, userCount);
        }
        
    } catch (error) {
        console.error('Error updating company user counts:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth()) return;
    
    // Load initial data
    loadData();
});

// Logout functionality
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
        await window.signOut(window.firebaseAuth);
        sessionStorage.clear();
        localStorage.removeItem('rememberEmail');
        showAlert('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Error logging out. Please try again.');
    }
});

// User role change handler
newUserRole.addEventListener('change', (e) => {
    const selectedRole = e.target.value;
    
    if (selectedRole === USER_ROLES.USER) {
        companyPermissionsSection.style.display = 'block';
    } else {
        companyPermissionsSection.style.display = 'none';
    }
});

// Create company modal


// Create company modal
createCompanyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openCompanyModal();
});

createCompanyBtnSidebar.addEventListener('click', (e) => {
    e.preventDefault();
    openCompanyModal();
});

// Open company modal for adding/editing
function openCompanyModal(companyData = null, companyId = null) {
    editingCompanyId = companyId;
    
    if (companyData) {
        // Edit mode
        companyModalTitle.textContent = 'Edit Company';
        companySubmitBtnText.textContent = 'Update Company';
        
        // Populate form
        document.getElementById('newCompanyName').value = companyData.name || '';
        document.getElementById('newCompanyLocation').value = companyData.location || '';
        document.getElementById('newCompanyAddress').value = companyData.address || '';
    } else {
        // Add mode
        companyModalTitle.textContent = 'Create New Company';
        companySubmitBtnText.textContent = 'Create Company';
        createCompanyForm.reset();
    }
    
    createCompanyModal.show();
}

// Create company form submission
createCompanyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('newCompanyName').value.trim();
    const location = document.getElementById('newCompanyLocation').value.trim();
    const address = document.getElementById('newCompanyAddress').value.trim();
    
    if (!name || !location || !address) {
        showAlert('Please fill in all required fields.');
        return;
    }
    
    setLoading(createCompanySubmitBtn, true, createCompanySpinner);
    
    const isEdit = !!editingCompanyId;
    const success = await saveCompany(name, location, address, isEdit);
    
    if (success) {
        createCompanyForm.reset();
        createCompanyModal.hide();
        editingCompanyId = null;
    }
    
    setLoading(createCompanySubmitBtn, false, createCompanySpinner, isEdit ? 'Update Company' : 'Create Company');
});

// Create user modal
createUserBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openUserModal();
});

// Open user modal for adding/editing
function openUserModal(userData = null, userId = null) {
    editingUserId = userId;
    
    if (userData) {
        // Edit mode
        userModalTitle.textContent = 'Edit User';
        userSubmitBtnText.textContent = 'Update User';
        passwordSection.style.display = 'none'; // Hide password field in edit mode
        
        // Populate form
        document.getElementById('newUserEmail').value = userData.email || '';
        newUserName.value = userData.profile?.name || '';
        document.getElementById('newUserRole').value = userData.role || '';
        
        // Handle company permissions
        if (userData.role === USER_ROLES.USER && userData.companyPermissions) {
            companyPermissionsSection.style.display = 'block';
            // Pre-select user's companies
            setTimeout(() => { // Wait for companies to load
                for (const companyId of Object.keys(userData.companyPermissions)) {
                    const checkbox = document.getElementById(`company_${companyId}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                }
            }, 100);
        }
    } else {
        // Add mode
        userModalTitle.textContent = 'Create New User';
        userSubmitBtnText.textContent = 'Create User';
        passwordSection.style.display = 'block'; // Show password field in create mode
        createUserForm.reset();
        companyPermissionsSection.style.display = 'none';
    }
    
    createUserModal.show();
}

// Create user form submission
createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value.trim();
    const name = newUserName.value.trim();
    const role = document.getElementById('newUserRole').value;
    
    const isEdit = !!editingUserId;
    
    // Validate required fields
    if (!email || !name || !role) {
        showAlert('Please fill in all required fields.');
        return;
    }
    
    // Password is only required for new users
    if (!isEdit && !password) {
        showAlert('Please provide a password for the new user.');
        return;
    }
    
    // Get company permissions if user role is selected
    let companyPermissions = {};
    if (role === USER_ROLES.USER) {
        companyPermissions = getSelectedCompanyPermissions();
        if (Object.keys(companyPermissions).length === 0) {
            showAlert('Please select at least one company for user access.');
            return;
        }
    }
    
    setLoading(createUserSubmitBtn, true, createUserSpinner);
    
    const success = await saveUser(email, password, name, role, companyPermissions, isEdit);
    
    if (success) {
        createUserForm.reset();
        createUserModal.hide();
        companyPermissionsSection.style.display = 'none';
        passwordSection.style.display = 'block'; // Reset for next use
        editingUserId = null;
    }
    
    setLoading(createUserSubmitBtn, false, createUserSpinner, isEdit ? 'Update User' : 'Create User');
});

// Refresh companies
refreshCompaniesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadData();
});

// Refresh users
refreshUsersBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadData();
});

// Global functions for company table actions
window.editCompany = async function(companyId) {
    try {
        const companyRef = window.firebaseRef(window.firebaseDatabase, `companies/${companyId}`);
        const snapshot = await window.firebaseGet(companyRef);
        
        if (snapshot.exists()) {
            const companyData = snapshot.val();
            openCompanyModal(companyData, companyId);
        } else {
            showAlert('Company not found.');
        }
    } catch (error) {
        console.error('Error loading company data:', error);
        showAlert('Failed to load company data.');
    }
};

window.deleteCompany = function(companyId, companyName) {
    if (confirm(`Are you sure you want to delete company: ${companyName}?\n\nThis will delete all employees and affect all users with access to this company.\n\nThis action cannot be undone.`)) {
        deleteCompanyAction(companyId);
    }
};

// Global functions for user table actions
window.editUser = async function(userId) {
    try {
        const userRef = window.firebaseRef(window.firebaseDatabase, `users/${userId}`);
        const snapshot = await window.firebaseGet(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            await loadCompanyPermissionsInCreateForm(); // Load companies first
            openUserModal(userData, userId);
        } else {
            showAlert('User not found.');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showAlert('Failed to load user data.');
    }
};

window.deleteUser = function(userId, userEmail) {
    if (confirm(`Are you sure you want to delete user: ${userEmail}?\n\nThis action cannot be undone.`)) {
        deleteUserAction(userId);
    }
};

// Global function for toggling user companies
window.toggleUserCompanies = toggleUserCompanies;

// Listen for auth state changes
window.onAuthStateChanged(window.firebaseAuth, (user) => {
    if (!user) {
        // User is signed out
        window.location.href = 'index.html';
    }
}); 