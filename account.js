const ACCOUNT_KEY = 'currentUser';
const USERS_KEY = 'localLensUsers';
const SUBMISSIONS_KEY = 'submittedBusinesses';
const COOLDOWN_MS = 2 * 60 * 60 * 1000;

const signedOutView = document.getElementById('signed-out-view');
const signedInView = document.getElementById('signed-in-view');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileAvatar = document.getElementById('profile-avatar');
const cooldownStatus = document.getElementById('cooldown-status');
const submissionList = document.getElementById('submission-list');

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');
}

function setCurrentUser(user) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(ACCOUNT_KEY);
}

function getCooldownKey(user) {
    return `lastBusinessSubmissionAt:${(user?.email || 'guest').toLowerCase()}`;
}

function getRemainingCooldown(user) {
    const lastSubmission = Number(localStorage.getItem(getCooldownKey(user)) || 0);
    return Math.max(0, COOLDOWN_MS - (Date.now() - lastSubmission));
}

function formatDuration(ms) {
    const totalMinutes = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
    return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `account-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

function switchTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.auth-form').forEach((form) => {
        form.classList.toggle('active', form.id === `${tabName}-form`);
    });
}

function updateAccountView() {
    const user = getCurrentUser();

    if (!user) {
        signedOutView.hidden = false;
        signedInView.hidden = true;
        return;
    }

    signedOutView.hidden = true;
    signedInView.hidden = false;
    profileName.textContent = user.name;
    profileEmail.textContent = user.email;
    profileAvatar.textContent = (user.name || 'L').trim().charAt(0).toUpperCase();
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
    updateCooldownStatus(user);
    renderSubmissions(user);
}

function updateCooldownStatus(user) {
    const remaining = getRemainingCooldown(user);
    if (remaining > 0) {
        cooldownStatus.textContent = `You can submit another business in ${formatDuration(remaining)}.`;
    } else {
        cooldownStatus.textContent = 'You can submit a business now.';
    }
}

function renderSubmissions(user) {
    const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        .filter((submission) => !submission.submittedBy || submission.submittedBy === user.email)
        .slice(-6)
        .reverse();

    if (!submissions.length) {
        submissionList.innerHTML = '<div class="empty-state">No submissions from this browser yet.</div>';
        return;
    }

    submissionList.innerHTML = submissions.map((submission) => {
        const date = submission.dateAdded ? new Date(submission.dateAdded).toLocaleString() : 'Recently';
        return `
            <div class="submission-row">
                <div>
                    <strong>${submission.name || 'Untitled place'}</strong><br>
                    <span>${submission.category || 'Category not listed'} • ${date}</span>
                </div>
                <span>${submission.rating || submission.overallRating || 'Pending'}/5</span>
            </div>
        `;
    }).join('');
}

function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
        showToast('That email already has an account. Log in instead.', 'error');
        switchTab('login');
        return;
    }

    const user = { id: Date.now(), name, email, password };
    users.push(user);
    saveUsers(users);
    setCurrentUser({ id: user.id, name: user.name, email: user.email });
    showToast('Account created. You can now submit businesses.');
    updateAccountView();
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const user = getUsers().find((candidate) => candidate.email === email && candidate.password === password);

    if (!user) {
        showToast('Email or password was not found.', 'error');
        return;
    }

    setCurrentUser({ id: user.id, name: user.name, email: user.email });
    showToast('Logged in successfully.');
    updateAccountView();
}

function handleProfileSave(event) {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const updatedUser = {
        ...currentUser,
        name: document.getElementById('edit-name').value.trim(),
        email: document.getElementById('edit-email').value.trim().toLowerCase()
    };

    const users = getUsers().map((user) => {
        if (user.id !== currentUser.id) return user;
        return { ...user, name: updatedUser.name, email: updatedUser.email };
    });

    saveUsers(users);
    setCurrentUser(updatedUser);
    showToast('Profile saved.');
    updateAccountView();
}

function initializeAccountPage() {
    document.querySelectorAll('.auth-tab').forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('profile-form').addEventListener('submit', handleProfileSave);
    document.getElementById('logout-button').addEventListener('click', () => {
        clearCurrentUser();
        showToast('Logged out.');
        updateAccountView();
    });

    updateAccountView();
    setInterval(() => {
        const user = getCurrentUser();
        if (user) updateCooldownStatus(user);
    }, 30000);
}

initializeAccountPage();
