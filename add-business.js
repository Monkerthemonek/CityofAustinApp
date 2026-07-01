const REVIEW_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwlyycdXcbLm-5LqKBgtQWbxHciOXhTjQDKaHv3MznnZre0N6KnGwNH8BxaaQHLYFI-zg/exec';
const ACCOUNT_KEY = 'currentUser';
const SUBMISSIONS_KEY = 'submittedBusinesses';
const COOLDOWN_MS = 2 * 60 * 60 * 1000;

let cooldownTimer = null;

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');
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

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `business-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function initializeAddBusinessForm() {
    const form = document.getElementById('add-business-form');
    form.addEventListener('submit', handleAddBusiness);
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', updatePreview);

    document.getElementById('reset-business-form').addEventListener('click', resetForm);
    document.getElementById('view-business-map').addEventListener('click', () => {
        window.location.href = 'map.html';
    });
    document.getElementById('view-account-page').addEventListener('click', () => {
        window.location.href = 'account.html';
    });

    document.getElementById('business-lat').value = '30.2672';
    document.getElementById('business-lng').value = '-97.7431';
    updatePreview();
    updateSubmissionAccess();
}

function getScores() {
    return {
        taste: Number(document.getElementById('score-taste').value),
        price: Number(document.getElementById('score-price').value),
        setting: Number(document.getElementById('score-setting').value),
        service: Number(document.getElementById('score-service').value),
        wait: Number(document.getElementById('score-wait').value)
    };
}

function getAverage(scores) {
    return Number((Object.values(scores).reduce((total, score) => total + score, 0) / 5).toFixed(1));
}

function updatePreview() {
    const scores = getScores();
    const average = getAverage(scores).toFixed(1);

    setText('preview-name', document.getElementById('business-name').value || 'Business name');
    setText('preview-category', document.getElementById('business-category').value || 'Category');
    setText('preview-address', document.getElementById('business-address').value || 'Austin, TX');
    setText('preview-description', document.getElementById('business-description').value || 'Your description will appear here and help visitors understand what makes this business special.');
    setText('preview-hours', document.getElementById('business-hours').value || 'Hours not listed');
    setText('preview-average', average);
    setText('form-average', average);
    setText('preview-taste', `${scores.taste}/5`);
    setText('preview-price-score', `${scores.price}/5`);
    setText('preview-setting', `${scores.setting}/5`);
    setText('preview-service', `${scores.service}/5`);
    setText('preview-wait', `${scores.wait}/5`);
    setText('description-count', document.getElementById('business-description').value.length);

    document.querySelectorAll('.score-input').forEach((group) => {
        const input = group.querySelector('input');
        group.querySelector('output').textContent = input.value;
        input.style.setProperty('--score-progress', `${((Number(input.value) - 1) / 4) * 100}%`);
    });

    updatePreviewImage();
}

function updatePreviewImage() {
    const source = document.getElementById('business-image').value.trim();
    const image = document.getElementById('preview-image');
    const placeholder = document.getElementById('preview-image-placeholder');

    if (!source) {
        image.hidden = true;
        image.removeAttribute('src');
        placeholder.hidden = false;
        return;
    }

    image.onload = () => {
        image.hidden = false;
        placeholder.hidden = true;
    };
    image.onerror = () => {
        image.hidden = true;
        placeholder.hidden = false;
    };
    image.src = source;
    image.alt = `${document.getElementById('business-name').value || 'Business'} preview`;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function updateSubmissionAccess() {
    const user = getCurrentUser();
    const accountGate = document.getElementById('account-gate');
    const cooldownGate = document.getElementById('cooldown-gate');
    const cooldownMessage = document.getElementById('cooldown-message');
    const submitButton = document.getElementById('submit-business-button');
    const helper = document.getElementById('submission-helper');

    if (!user) {
        accountGate.hidden = false;
        accountGate.querySelector('h2').textContent = 'Log in before submitting';
        accountGate.querySelector('p').textContent = 'You can preview the form, but submissions only work from a LocalLens account.';
        cooldownGate.hidden = true;
        submitButton.disabled = true;
        helper.innerHTML = '<i class="fas fa-lock"></i> Log in or create an account before submitting.';
        return;
    }

    if (!user.verified) {
        accountGate.hidden = false;
        accountGate.querySelector('h2').textContent = 'Verify your email before submitting';
        accountGate.querySelector('p').textContent = 'Your account is logged in, but your email needs to be verified first.';
        cooldownGate.hidden = true;
        submitButton.disabled = true;
        helper.innerHTML = '<i class="fas fa-envelope"></i> Verify your email on the Account page before submitting.';
        return;
    }

    accountGate.hidden = true;
    const remaining = getRemainingCooldown(user);
    cooldownGate.hidden = remaining <= 0;
    submitButton.disabled = remaining > 0;

    if (remaining > 0) {
        cooldownMessage.textContent = `You can submit another business in ${formatDuration(remaining)}.`;
        helper.innerHTML = '<i class="fas fa-clock"></i> Your account has a 2-hour cooldown between submissions.';
    } else {
        helper.innerHTML = '<i class="fas fa-info-circle"></i> Submissions go to the Review tab before appearing on the map.';
    }

    clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(updateSubmissionAccess, remaining > 0 ? 30000 : 120000);
}

function buildSubmission() {
    const user = getCurrentUser();
    const scores = getScores();
    const rating = getAverage(scores);

    return {
        submitted_at: new Date().toISOString(),
        status: 'Pending',
        submitted_by: user.email,
        submitted_username: user.username || '',
        name: document.getElementById('business-name').value.trim(),
        category: document.getElementById('business-category').value,
        description: document.getElementById('business-description').value.trim(),
        taste: scores.taste,
        price_score: scores.price,
        setting: scores.setting,
        customer_service: scores.service,
        wait_time: scores.wait,
        overall_rating: rating,
        latitude: document.getElementById('business-lat').value.trim(),
        longitude: document.getElementById('business-lng').value.trim(),
        address: document.getElementById('business-address').value.trim(),
        phone: document.getElementById('business-phone').value.trim(),
        hours: document.getElementById('business-hours').value.trim(),
        image_url: document.getElementById('business-image').value.trim(),
        id: Date.now(),
        dateAdded: new Date().toISOString(),
        submittedBy: user.email,
        submittedUsername: user.username || '',
        rating
    };
}

async function submitToReviewSheet(submission) {
    const payload = new URLSearchParams();
    Object.entries(submission).forEach(([key, value]) => payload.append(key, value ?? ''));

    await fetch(REVIEW_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: payload
    });
}

async function handleAddBusiness(event) {
    event.preventDefault();
    const user = getCurrentUser();

    if (!user) {
        showToast('Please log in before submitting a business.', 'error');
        window.location.href = 'account.html';
        return;
    }

    if (!user.verified) {
        showToast('Please verify your email before submitting a business.', 'error');
        window.location.href = 'account.html';
        return;
    }

    const remaining = getRemainingCooldown(user);
    if (remaining > 0) {
        showToast(`Please wait ${formatDuration(remaining)} before submitting again.`, 'error');
        updateSubmissionAccess();
        return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const submitButton = document.getElementById('submit-business-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Submitting...</span>';

    const submission = buildSubmission();

    try {
        await submitToReviewSheet(submission);

        const savedBusinesses = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
        savedBusinesses.push(submission);
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(savedBusinesses));
        localStorage.setItem(getCooldownKey(user), String(Date.now()));

        document.querySelector('.submission-layout').hidden = true;
        document.getElementById('account-gate').hidden = true;
        document.getElementById('cooldown-gate').hidden = true;
        document.getElementById('success-message').hidden = false;
        showToast('Submitted to the Review tab.', 'success');
    } catch (error) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-plus"></i><span>Submit business</span>';
        showToast('The submission could not be sent. Try again in a moment.', 'error');
    }
}

function resetForm() {
    const form = document.getElementById('add-business-form');
    form.reset();
    document.getElementById('business-lat').value = '30.2672';
    document.getElementById('business-lng').value = '-97.7431';
    updatePreview();
    updateSubmissionAccess();
}

document.addEventListener('DOMContentLoaded', initializeAddBusinessForm);
