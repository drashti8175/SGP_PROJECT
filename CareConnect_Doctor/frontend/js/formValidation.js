(function () {
  const stylesheet = document.createElement('style');
  stylesheet.innerHTML = `
    .fv-input-error { border-color: #dc3545 !important; box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.15); }
    .fv-input-success { border-color: #28a745 !important; box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.15); }
    .fv-error-text { color: #dc3545; font-size: 0.8rem; margin-top: 4px; min-height: 1rem; display: block; }
    .fv-success-text { color: #28a745; font-size: 0.8rem; margin-top: 4px; min-height: 1rem; display: block; }
    .fv-disabled { opacity: 0.55; pointer-events: none; }
    .fv-password-meter { font-size: 0.85rem; font-weight: 600; margin-top: 4px; }
    .fv-password-meter.weak { color: #d63347; }
    .fv-password-meter.medium { color: #fd7e14; }
    .fv-password-meter.strong { color: #10b981; }
  `;
  document.head.appendChild(stylesheet);

  const rules = {
    name: value => /^[A-Za-z ]{3,}$/.test(value.trim()),
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    phone: value => /^[1-9][0-9]{9}$/.test(value.trim()),
    age: value => { const n = Number(value); return Number.isInteger(n) && n >= 1 && n <= 100; },
    patientId: value => /^P\d{3}$/.test(value.trim()),
    bloodGroup: value => ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(value),
    appointmentDate: value => { if(!value) return false; const d = new Date(value); d.setHours(0,0,0,0); const now = new Date(); now.setHours(0,0,0,0); return d >= now; },
    timeSlot: value => value.trim() !== '',
    medicine: value => value.trim().length >= 2,
    dosage: value => /^[0-9]+(?:\s?(?:tablet|tablets|ml|mg|capsule|capsules))$/i.test(value.trim()),
    followUpDate: value => { if(!value) return false; const d = new Date(value); d.setHours(0,0,0,0); const tomorrow = new Date(); tomorrow.setHours(0,0,0,0); tomorrow.setDate(tomorrow.getDate() + 1); return d >= tomorrow; },
    password: value => /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(value),
    confirmPassword: (value, form) => { const pwd = form.querySelector('[name="password"], #regPassword, #dPassword'); return pwd && value === pwd.value; }
  };

  const messages = {
    name: 'Only alphabets allowed, minimum 3 characters (no numbers / special chars).',
    email: 'Enter a valid email address (e.g., abc@gmail.com).',
    phone: '10 digits required, numeric only, cannot start with 0.',
    age: 'Enter age between 1 and 100.',
    patientId: 'Format should be P101, P102, etc. (3 digits, no spaces).',
    bloodGroup: 'Select a valid blood group.',
    appointmentDate: 'Select current or future date.',
    timeSlot: 'Please select a timeslot.',
    medicine: 'At least 2 characters.',
    dosage: 'Use formats like 1 tablet, 5 ml, 250mg.',
    followUpDate: 'Choose a date after today.',
    password: 'Minimum 6 chars, must contain uppercase letter and number.',
    confirmPassword: 'Confirmation must match password.'
  };

  function getErrorContainer(el) {
    let error = el.nextElementSibling;
    if (error && error.classList.contains('fv-error-text')) return error;
    error = document.createElement('span');
    error.className = 'fv-error-text';
    el.insertAdjacentElement('afterend', error);
    return error;
  }

  function setInvalid(el, msg) {
    el.classList.add('fv-input-error');
    el.classList.remove('fv-input-success');
    const error = getErrorContainer(el);
    error.textContent = msg;
  }

  function setValid(el) {
    el.classList.add('fv-input-success');
    el.classList.remove('fv-input-error');
    const error = getErrorContainer(el);
    error.textContent = '';
  }

  function validateField(el) {
    const name = el.name || el.id;
    const value = (el.value || '').trim();

    if (el.required && value === '') {
      setInvalid(el, 'This field is required.');
      return false;
    }

    if (rules[name]) {
      const valid = rules[name](value, el.form);
      if (!valid) {
        setInvalid(el, messages[name]);
        return false;
      }
      setValid(el);
      return true;
    }

    // fallback HTML5 validity
    if (el.checkValidity && !el.checkValidity()) {
      setInvalid(el, el.validationMessage || 'Invalid value.');
      return false;
    }

    setValid(el);
    return true;
  }

  function updateSubmitState(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    const controls = Array.from(form.querySelectorAll('input, textarea, select')).filter(el => !el.disabled && el.type !== 'hidden');
    const allValid = controls.every(el => validateField(el));
    submitBtn.disabled = !allValid;
    submitBtn.classList.toggle('fv-disabled', !allValid);
  }

  function focusFirstInvalid(form) {
    const invalid = form.querySelector('.fv-input-error');
    if (invalid) invalid.focus({ preventScroll: true });
  }

  function attach(formSelector) {
    const form = typeof formSelector === 'string' ? document.querySelector(formSelector) : formSelector;
    if (!form) return;

    form.setAttribute('novalidate', '');

    const controls = Array.from(form.querySelectorAll('input, textarea, select')).filter(el => el.type !== 'hidden');
    controls.forEach(el => {
      el.dataset.validate = 'enabled';
      el.addEventListener('input', () => {
        validateField(el);
        updateSubmitState(form);
      });
      el.addEventListener('blur', () => {
        validateField(el);
        updateSubmitState(form);
      });
    });

    form.addEventListener('submit', function (e) {
      let valid = true;
      controls.forEach(el => {
        const isValid = validateField(el);
        if (!isValid) valid = false;
      });
      if (!valid) {
        e.preventDefault();
        focusFirstInvalid(form);
      } else {
        const successMsg = form.querySelector('.fv-form-success');
        if (successMsg) successMsg.textContent = '✅ Form completed successfully. Submitting...';
      }
    });

    updateSubmitState(form);
  }

  window.FormValidation = { attach, validateField, updateSubmitState };
})();