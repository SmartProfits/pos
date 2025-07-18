// User Dashboard JavaScript

// User roles
const USER_ROLES = {
    SADMIN: 'sadmin',
    ADMIN: 'admin',
    USER: 'user'
};

// DOM elements
const userEmailElement = document.getElementById('userEmail');
const userDisplayNameElement = document.getElementById('userDisplayName');
const logoutBtn = document.getElementById('logoutBtn');
const alertContainer = document.getElementById('alertContainer');

// Company selection elements
const companySelect = document.getElementById('companySelect');
const currentCompanyName = document.getElementById('currentCompanyName');
const currentCompanyLocation = document.getElementById('currentCompanyLocation');

// Employee management elements
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const addEmployeeBtnHeader = document.getElementById('addEmployeeBtnHeader');
const refreshEmployeesBtn = document.getElementById('refreshEmployeesBtn');
const employeesTableBody = document.getElementById('employeesTableBody');
const employeeTableContainer = document.getElementById('employeeTableContainer');
const noCompanySelected = document.getElementById('noCompanySelected');

// Modal elements
const employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'));
const employeeModalTitle = document.getElementById('employeeModalTitle');
const employeeForm = document.getElementById('employeeForm');
const saveEmployeeBtn = document.getElementById('saveEmployeeBtn');
const saveEmployeeSpinner = document.getElementById('saveEmployeeSpinner');

// Form elements
const employeeName = document.getElementById('employeeName');
const employeeNo = document.getElementById('employeeNo');
const position = document.getElementById('position');
const joinDate = document.getElementById('joinDate');
const yearsOfService = document.getElementById('yearsOfService');
const annualLeave = document.getElementById('annualLeave');
const medicalLeave = document.getElementById('medicalLeave');
const hospitalizationLeave = document.getElementById('hospitalizationLeave');
const employeeCompany = document.getElementById('employeeCompany');

// Stats elements
const totalEmployeesElement = document.getElementById('totalEmployees');
const activeLeavesElement = document.getElementById('activeLeaves');
const pendingRequestsElement = document.getElementById('pendingRequests');

// Current user data
let currentUser = null;
let currentUserRole = null;
let currentUserCompanies = [];
let selectedCompanyId = null;
let editingEmployeeId = null;

// Calculate years of service based on join date
function calculateYearsOfService(joinDateString) {
    if (!joinDateString) return null;
    
    const joinDate = new Date(joinDateString);
    const currentDate = new Date();
    
    // Check if joined this year
    if (joinDate.getFullYear() === currentDate.getFullYear()) {
        return 'current-year';
    }
    
    // Calculate the difference in years
    let years = currentDate.getFullYear() - joinDate.getFullYear();
    
    // Check if the anniversary has passed this year
    const monthDiff = currentDate.getMonth() - joinDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < joinDate.getDate())) {
        years--;
    }
    
    // Return the range category
    if (years < 2) return '<2';
    else if (years >= 2 && years < 5) return '2-5';
    else return '>5';
}

// Format years of service range for display
function formatYearsOfServiceDisplay(yearsRange) {
    switch(yearsRange) {
        case 'current-year': return 'Current year';
        case '<2': return 'Less than 2 years';
        case '2-5': return '2 to 5 years';
        case '>5': return 'More than 5 years';
        default: return 'Not specified';
    }
}

// Update years of service based on join date
function updateYearsOfService() {
    const joinDateValue = joinDate.value;
    if (joinDateValue) {
        const yearsRange = calculateYearsOfService(joinDateValue);
        yearsOfService.value = formatYearsOfServiceDisplay(yearsRange);
        yearsOfService.dataset.range = yearsRange; // Store the range for calculations
        updateLeaveEntitlements();
    } else {
        yearsOfService.value = '';
        yearsOfService.dataset.range = '';
        updateLeaveEntitlements();
    }
}

// Leave calculation based on position and years of service
function calculateLeaveEntitlements(positionLevel, yearsOfServiceRange) {
    // Special case for current year employees
    if (yearsOfServiceRange === 'current-year') {
        return {
            annualLeave: 0, // No annual leave for current year employees
            medicalLeave: 14, // Fixed 14 days medical leave
            hospitalizationLeave: 60 // Fixed for all employees
        };
    }
    
    // Annual Leave calculation
    const annualLeaveTable = {
        'Manager Level': { '<2': 14, '2-5': 14, '>5': 16 },
        'Executive Level': { '<2': 14, '2-5': 14, '>5': 16 },
        'Supervisor Level': { '<2': 14, '2-5': 14, '>5': 16 },
        'Clerical Level': { '<2': 10, '2-5': 12, '>5': 16 },
        'Worker Level': { '<2': 8, '2-5': 12, '>5': 16 }
    };
    
    // Medical Leave calculation  
    const medicalLeaveTable = {
        'Manager Level': { '<2': 14, '2-5': 18, '>5': 22 },
        'Executive Level': { '<2': 14, '2-5': 18, '>5': 22 },
        'Supervisor Level': { '<2': 14, '2-5': 18, '>5': 22 },
        'Clerical Level': { '<2': 14, '2-5': 18, '>5': 22 },
        'Worker Level': { '<2': 14, '2-5': 18, '>5': 22 }
    };
    
    const annualLeaveDays = annualLeaveTable[positionLevel]?.[yearsOfServiceRange] || 0;
    const medicalLeaveDays = medicalLeaveTable[positionLevel]?.[yearsOfServiceRange] || 0;
    
    return {
        annualLeave: annualLeaveDays,
        medicalLeave: medicalLeaveDays,
        hospitalizationLeave: 60 // Fixed for all employees
    };
}

// Update leave entitlements when position or years of service changes
function updateLeaveEntitlements() {
    const positionValue = position.value;
    const yearsRange = yearsOfService.dataset.range;
    
    if (positionValue && yearsRange) {
        const entitlements = calculateLeaveEntitlements(positionValue, yearsRange);
        annualLeave.value = `${entitlements.annualLeave} days`;
        medicalLeave.value = `${entitlements.medicalLeave} days`;
        hospitalizationLeave.value = `${entitlements.hospitalizationLeave} days`;
    } else {
        annualLeave.value = '';
        medicalLeave.value = '';
        hospitalizationLeave.value = '60 days';
    }
}

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

function setLoading(button, isLoading, spinner, originalText = '') {
    if (isLoading) {
        button.disabled = true;
        spinner.classList.remove('d-none');
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;
    } else {
        button.disabled = false;
        spinner.classList.add('d-none');
        button.innerHTML = originalText || '<i class="bi bi-check-lg me-1"></i>Save Employee';
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
    
    if (userRole !== USER_ROLES.USER) {
        showAlert('Access denied. User privileges required.', 'danger');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }
    
    currentUserRole = userRole;
    currentUser = { uid: userId, email: userEmail };
    
    // Update UI
    userEmailElement.textContent = userEmail;
    userDisplayNameElement.textContent = userEmail.split('@')[0]; // Use email prefix as display name
    
    return true;
}

// Load user's accessible companies
async function loadUserCompanies() {
    try {
        const userRef = window.firebaseRef(window.firebaseDatabase, `users/${currentUser.uid}`);
        const snapshot = await window.firebaseGet(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const companyPermissions = userData.companyPermissions || {};
            
            // Load company details
            const companiesRef = window.firebaseRef(window.firebaseDatabase, 'companies');
            const companiesSnapshot = await window.firebaseGet(companiesRef);
            
            if (companiesSnapshot.exists()) {
                const allCompanies = companiesSnapshot.val();
                currentUserCompanies = [];
                
                // Filter companies based on user permissions
                for (const [companyId, permissions] of Object.entries(companyPermissions)) {
                    if (allCompanies[companyId]) {
                        currentUserCompanies.push({
                            id: companyId,
                            ...allCompanies[companyId],
                            permissions: permissions
                        });
                    }
                }
                
                updateCompanyDropdowns();
            }
        }
    } catch (error) {
        console.error('Error loading user companies:', error);
        showAlert('Failed to load company data.');
    }
}

// Update company dropdown options
function updateCompanyDropdowns() {
    // Main company selector
    companySelect.innerHTML = '<option value="">Select Company</option>';
    
    // Employee modal company selector
    employeeCompany.innerHTML = '<option value="">Select Company</option>';
    
    currentUserCompanies.forEach(company => {
        const companyDisplayName = `${company.name}${company.location ? ' - ' + company.location : ''}`;
        const option1 = new Option(companyDisplayName, company.id);
        const option2 = new Option(companyDisplayName, company.id);
        companySelect.add(option1);
        employeeCompany.add(option2);
    });
    
    if (currentUserCompanies.length === 0) {
        companySelect.innerHTML = '<option value="">No companies available</option>';
        employeeCompany.innerHTML = '<option value="">No companies available</option>';
    }
}

// Load employees for selected company
async function loadEmployees(companyId) {
    try {
        const employeesRef = window.firebaseRef(window.firebaseDatabase, `employees/${companyId}`);
        const snapshot = await window.firebaseGet(employeesRef);
        
        if (snapshot.exists()) {
            const employees = snapshot.val();
            displayEmployees(employees);
            updateStats(employees);
        } else {
            employeesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No employees found for this company</td></tr>';
            updateStats({});
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        showAlert('Failed to load employees.');
        employeesTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error loading employees</td></tr>';
    }
}

// Display employees in table
function displayEmployees(employees) {
    const employeeEntries = Object.entries(employees || {});
    
    if (employeeEntries.length === 0) {
        employeesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No employees found</td></tr>';
        return;
    }
    
    const tableRows = employeeEntries.map(([employeeId, employeeData]) => {
        // Format join date display
        const joinDateDisplay = employeeData.joinDate ? 
            new Date(employeeData.joinDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            }) : 'Not specified';
        
        // Check if employee joined this year for highlighting
        const isCurrentYearEmployee = employeeData.yearsOfService === 'current-year';
        
        // Format years of service display
        let yearsDisplay = '';
        switch(employeeData.yearsOfService) {
            case 'current-year': 
                yearsDisplay = '<span class="badge bg-warning text-dark"><i class="bi bi-star-fill me-1"></i>Current year</span>'; 
                break;
            case '<2': yearsDisplay = 'Less than 2 years'; break;
            case '2-5': yearsDisplay = '2 to 5 years'; break;
            case '>5': yearsDisplay = 'More than 5 years'; break;
            default: yearsDisplay = employeeData.yearsOfService || 'Not specified';
        }
        
        // Apply highlighting for current year employees
        const rowClass = isCurrentYearEmployee ? 'table-warning' : '';
        const empNoDisplay = isCurrentYearEmployee ? 
            `<strong>${employeeData.empNo}</strong> <i class="bi bi-star-fill text-warning ms-1" title="New Employee"></i>` : 
            `<strong>${employeeData.empNo}</strong>`;
        
        // Special badge styling for current year employees
        const annualLeaveBadge = isCurrentYearEmployee ? 
            `<span class="badge bg-secondary">${employeeData.annualLeave} days</span>` :
            `<span class="badge bg-primary">${employeeData.annualLeave} days</span>`;
            
        return `
            <tr class="${rowClass}">
                <td>${empNoDisplay}</td>
                <td>${employeeData.name}</td>
                <td>${employeeData.position}</td>
                <td>${joinDateDisplay}</td>
                <td>${yearsDisplay}</td>
                <td>${annualLeaveBadge}</td>
                <td><span class="badge bg-info">${employeeData.medicalLeave} days</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="editEmployee('${employeeId}')" title="Edit Employee">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteEmployee('${employeeId}', '${employeeData.name}')" title="Delete Employee">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    employeesTableBody.innerHTML = tableRows;
}

// Update dashboard stats
function updateStats(employees) {
    const employeeEntries = Object.entries(employees || {});
    totalEmployeesElement.textContent = employeeEntries.length;
    
    // For now, set leave stats to 0 as we haven't implemented leave requests yet
    activeLeavesElement.textContent = '0';
    pendingRequestsElement.textContent = '0';
}

// Create new employee
async function saveEmployee(employeeData, isEdit = false) {
    try {
        if (!selectedCompanyId) {
            showAlert('Please select a company first.');
            return false;
        }
        
        const employeeId = isEdit ? editingEmployeeId : 'emp_' + Date.now();
        const employeeRef = window.firebaseRef(window.firebaseDatabase, `employees/${selectedCompanyId}/${employeeId}`);
        
        await window.firebaseSet(employeeRef, {
            ...employeeData,
            companyId: selectedCompanyId,
            createdAt: isEdit ? employeeData.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        showAlert(`Employee ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
        
        // Reload employees
        await loadEmployees(selectedCompanyId);
        
        return true;
    } catch (error) {
        console.error('Error saving employee:', error);
        showAlert('Failed to save employee. Please try again.');
        return false;
    }
}

// Validate employee number uniqueness within company
async function validateEmployeeNumber(empNo, companyId, excludeEmployeeId = null) {
    try {
        const employeesRef = window.firebaseRef(window.firebaseDatabase, `employees/${companyId}`);
        const snapshot = await window.firebaseGet(employeesRef);
        
        if (snapshot.exists()) {
            const employees = snapshot.val();
            for (const [employeeId, employeeData] of Object.entries(employees)) {
                if (employeeId !== excludeEmployeeId && employeeData.empNo === empNo) {
                    return false; // Employee number already exists
                }
            }
        }
        return true; // Employee number is unique
    } catch (error) {
        console.error('Error validating employee number:', error);
        return true; // Allow saving if validation fails
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth()) return;
    
    // Load user companies
    loadUserCompanies();
});

// Company selection change
companySelect.addEventListener('change', (e) => {
    selectedCompanyId = e.target.value;
    
    if (selectedCompanyId) {
        const selectedCompany = currentUserCompanies.find(c => c.id === selectedCompanyId);
        currentCompanyName.textContent = selectedCompany ? selectedCompany.name : 'Unknown';
        currentCompanyLocation.textContent = selectedCompany ? selectedCompany.location || 'Not specified' : '-';
        
        // Show employee table and load employees
        noCompanySelected.style.display = 'none';
        employeeTableContainer.style.display = 'block';
        loadEmployees(selectedCompanyId);
    } else {
        currentCompanyName.textContent = 'None selected';
        currentCompanyLocation.textContent = '-';
        noCompanySelected.style.display = 'block';
        employeeTableContainer.style.display = 'none';
        updateStats({});
    }
});

// Position and join date change handlers
position.addEventListener('change', updateLeaveEntitlements);
joinDate.addEventListener('change', updateYearsOfService);

// Add employee buttons
addEmployeeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openEmployeeModal();
});

addEmployeeBtnHeader.addEventListener('click', (e) => {
    e.preventDefault();
    openEmployeeModal();
});

// Refresh employees
refreshEmployeesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (selectedCompanyId) {
        loadEmployees(selectedCompanyId);
    }
});

// Open employee modal for adding/editing
function openEmployeeModal(employeeData = null, employeeId = null) {
    if (!selectedCompanyId) {
        showAlert('Please select a company first.');
        return;
    }
    
    editingEmployeeId = employeeId;
    
    if (employeeData) {
        // Edit mode
        employeeModalTitle.textContent = 'Edit Employee';
        populateEmployeeForm(employeeData);
    } else {
        // Add mode
        employeeModalTitle.textContent = 'Add New Employee';
        employeeForm.reset();
        employeeCompany.value = selectedCompanyId;
        hospitalizationLeave.value = '60 days';
    }
    
    employeeModal.show();
}

// Populate employee form for editing
function populateEmployeeForm(employeeData) {
    employeeName.value = employeeData.name || '';
    employeeNo.value = employeeData.empNo || '';
    position.value = employeeData.position || '';
    joinDate.value = employeeData.joinDate || '';
    employeeCompany.value = employeeData.companyId || selectedCompanyId;
    
    // Set leave values (these will be read-only display values)
    annualLeave.value = employeeData.annualLeave ? `${employeeData.annualLeave} days` : '';
    medicalLeave.value = employeeData.medicalLeave ? `${employeeData.medicalLeave} days` : '';
    hospitalizationLeave.value = '60 days';
    
    // Update years of service and leave entitlements based on join date
    if (employeeData.joinDate) {
        const yearsRange = calculateYearsOfService(employeeData.joinDate);
        yearsOfService.value = formatYearsOfServiceDisplay(yearsRange);
        yearsOfService.dataset.range = yearsRange;
        
        if (employeeData.position) {
            updateLeaveEntitlements();
        }
    } else {
        yearsOfService.value = '';
        yearsOfService.dataset.range = '';
    }
}

// Save employee form submission
employeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Extract numeric values from the readonly fields
    const annualLeaveValue = parseInt(annualLeave.value.replace(' days', ''));
    const medicalLeaveValue = parseInt(medicalLeave.value.replace(' days', ''));
    const yearsRange = yearsOfService.dataset.range;
    
    const formData = {
        name: employeeName.value.trim(),
        empNo: employeeNo.value.trim(),
        position: position.value,
        joinDate: joinDate.value,
        yearsOfService: yearsRange,
        annualLeave: annualLeaveValue,
        medicalLeave: medicalLeaveValue,
        hospitalizationLeave: 60
    };
    
    // Validation
    if (!formData.name || !formData.empNo || !formData.position || !formData.joinDate) {
        showAlert('Please fill in all required fields.');
        return;
    }
    
    if (isNaN(formData.annualLeave) || isNaN(formData.medicalLeave)) {
        showAlert('Please select position and join date to calculate leave entitlements.');
        return;
    }
    
    // Check employee number uniqueness
    const isEmpNoUnique = await validateEmployeeNumber(formData.empNo, selectedCompanyId, editingEmployeeId);
    if (!isEmpNoUnique) {
        showAlert('Employee number already exists in this company. Please use a different number.');
        return;
    }
    
    setLoading(saveEmployeeBtn, true, saveEmployeeSpinner);
    
    const isEdit = !!editingEmployeeId;
    const success = await saveEmployee(formData, isEdit);
    
    if (success) {
        employeeModal.hide();
        employeeForm.reset();
        yearsOfService.value = '';
        yearsOfService.dataset.range = '';
        hospitalizationLeave.value = '60 days';
        editingEmployeeId = null;
    }
    
    setLoading(saveEmployeeBtn, false, saveEmployeeSpinner);
});

// Global functions for employee table actions
window.editEmployee = async function(employeeId) {
    if (!selectedCompanyId) {
        showAlert('Please select a company first.');
        return;
    }
    
    try {
        const employeeRef = window.firebaseRef(window.firebaseDatabase, `employees/${selectedCompanyId}/${employeeId}`);
        const snapshot = await window.firebaseGet(employeeRef);
        
        if (snapshot.exists()) {
            const employeeData = snapshot.val();
            openEmployeeModal(employeeData, employeeId);
        } else {
            showAlert('Employee not found.');
        }
    } catch (error) {
        console.error('Error loading employee data:', error);
        showAlert('Failed to load employee data.');
    }
};

window.deleteEmployee = async function(employeeId, employeeName) {
    if (!selectedCompanyId) {
        showAlert('Please select a company first.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete employee: ${employeeName}?\n\nThis action cannot be undone.`)) {
        try {
            const employeeRef = window.firebaseRef(window.firebaseDatabase, `employees/${selectedCompanyId}/${employeeId}`);
            await window.firebaseSet(employeeRef, null); // Delete by setting to null
            
            showAlert(`Employee ${employeeName} deleted successfully.`, 'success');
            
            // Reload employees
            await loadEmployees(selectedCompanyId);
        } catch (error) {
            console.error('Error deleting employee:', error);
            showAlert('Failed to delete employee. Please try again.');
        }
    }
};

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

// Listen for auth state changes
window.onAuthStateChanged(window.firebaseAuth, (user) => {
    if (!user) {
        // User is signed out
        window.location.href = 'index.html';
    }
}); 