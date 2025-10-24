/* State */
const state = {
  owner: {},
  vehicle: {},
  policyNo: '',
  paid: false
};

const steps = [1,2,3,4];
let current = 1;

const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

function setPage(n) {
  current = n;
  qsa('.panel').forEach(p => p.classList.add('hidden'));
  qs('#step-' + n)?.classList.remove('hidden');
  qs('#pageNo').textContent = String(n);

  // Progress UI
  qsa('.progress .step').forEach(step => {
    const k = Number(step.dataset.step);
    step.classList.remove('active','done');
    if (k < n) step.classList.add('done');
    if (k === n) step.classList.add('active');
  });
}

/* Validation helpers */
function required(el) {
  if (!el.value || el.value.trim() === '') {
    showError(el, 'Required');
    return false;
  }
  hideError(el);
  return true;
}
function showError(el, msg) {
  const small = el.closest('.field')?.querySelector('small.error');
  if (small) small.textContent = msg;
  el.setAttribute('aria-invalid', 'true');
  el.style.borderColor = '#dc2626';
}
function hideError(el) {
  const small = el.closest('.field')?.querySelector('small.error');
  if (small) small.textContent = '';
  el.removeAttribute('aria-invalid');
  el.style.borderColor = '';
}

/* Step 1 */
const ownerForm = qs('#owner-form');
ownerForm.addEventListener('submit', e => {
  e.preventDefault();
  const ownerName = qs('#ownerName');
  const idType = qs('#idType');
  const nicNumber = qs('#nicNumber');
  const address = qs('#address');
  const atoll = qs('#atoll');
  const island = qs('#island');
  const mobile = qs('#mobile');
  const email = qs('#email');

  const ok = [ownerName,idType,nicNumber,address,atoll,island,mobile,email].map(required).every(Boolean);
  if (!ok) return;

  state.owner = {
    ownerName: ownerName.value.trim(),
    idType: idType.value,
    nicNumber: nicNumber.value.trim(),
    address: address.value.trim(),
    atoll: atoll.value,
    island: island.value,
    mobile: mobile.value.trim(),
    email: email.value.trim()
  };

  // Persist to localStorage
  localStorage.setItem('wizard.owner', JSON.stringify(state.owner));

  // Pre-fill step 2
  qs('#ownerEcho').value = `${state.owner.ownerName} / ${state.owner.nicNumber}`;

  setPage(2);
});

qs('#owner-reset').addEventListener('click', () => {
  ownerForm.reset();
  state.owner = {};
  localStorage.removeItem('wizard.owner');
});

/* Step 2 */
const vehicleForm = qs('#vehicle-form');
vehicleForm.addEventListener('submit', e => {
  e.preventDefault();
  const vehicleType = qs('#vehicleType');
  const vehicleNumber = qs('#vehicleNumber');
  const premium = qs('#premium');
  const issuingDate = qs('#issuingDate');
  const proposalNumber = qs('#proposalNumber');
  const periodFrom = qs('#periodFrom');
  const periodTo = qs('#periodTo');

  const ok = [vehicleType,vehicleNumber,premium,issuingDate,periodFrom,periodTo].map(required).every(Boolean);
  if (!ok) return;

  // ensure dates order
  if (new Date(periodTo.value) <= new Date(periodFrom.value)) {
    showError(periodTo, 'Must be after Period From');
    return;
  } else {
    hideError(periodTo);
  }

  state.vehicle = {
    vehicleType: vehicleType.value,
    vehicleNumber: vehicleNumber.value.trim(),
    premium: Number(premium.value),
    issuingDate: issuingDate.value,
    proposalNumber: proposalNumber.value.trim(),
    periodFrom: periodFrom.value,
    periodTo: periodTo.value
  };
  localStorage.setItem('wizard.vehicle', JSON.stringify(state.vehicle));

  // Generate a policy no (preview)
  state.policyNo = genPolicy();
  fillReview();
  setPage(3);
});

qsa('#step-2 [data-nav="back"]').forEach(b => b.addEventListener('click', () => setPage(1)));

/* Step 3 */
function fillReview() {
  qs('#r-policy').textContent = state.policyNo;
  qs('#r-from').textContent = fmtDate(state.vehicle.periodFrom);
  qs('#r-to').textContent = fmtDate(state.vehicle.periodTo);
  qs('#r-vehicle').textContent = `${state.vehicle.vehicleType} / ${state.vehicle.vehicleNumber}`;
  qs('#r-premium').textContent = `MVR ${state.vehicle.premium.toFixed(2)}`;
  qs('#r-customer').textContent = `${state.owner.ownerName} / ${state.owner.nicNumber}`;
  qs('#r-contact').textContent = `${state.owner.mobile} / ${state.owner.email}`;
}

qsa('#step-3 [data-nav="back"]').forEach(b => b.addEventListener('click', () => setPage(2)));

qs('#useCredit').addEventListener('click', () => {
  alert('Credit applied (demo).');
});

// Payment modal
const payModal = qs('#payModal');
qs('#payNow').addEventListener('click', () => payModal.showModal());
payModal.addEventListener('close', () => {
  if (payModal.returnValue === 'card' || payModal.returnValue === 'mfaisaa') {
    // simulate payment
    setTimeout(() => {
      state.paid = true;
      fillReceipt();
      setPage(4);
    }, 300);
  }
});

/* Step 4 */
function fillReceipt() {
  qs('#receiptPolicy').textContent = state.policyNo;
  qs('#s-policy').textContent = state.policyNo;
  qs('#s-from').textContent = fmtDate(state.vehicle.periodFrom);
  qs('#s-to').textContent = fmtDate(state.vehicle.periodTo);
  qs('#s-vehicle').textContent = `${state.vehicle.vehicleType} / ${state.vehicle.vehicleNumber}`;
  qs('#s-premium').textContent = `MVR ${state.vehicle.premium.toFixed(2)}`;
  qs('#s-customer').textContent = `${state.owner.ownerName} / ${state.owner.nicNumber}`;
  qs('#s-contact').textContent = `${state.owner.mobile} / ${state.owner.email}`;
}

qs('#printReceipt').addEventListener('click', () => window.print());
qs('#goHome').addEventListener('click', () => {
  // reset, keep owner for convenience
  state.vehicle = {}; state.paid = false; state.policyNo = '';
  localStorage.removeItem('wizard.vehicle');
  setPage(1);
});

/* Utilities */
function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
function genPolicy() {
  const d = new Date();
  const seq = Math.floor(Math.random()*90000)+10000;
  const yy = String(d.getFullYear()).slice(-2);
  return `OL/${String(d.getMonth()+1).padStart(2,'0')}/${yy}/SOL/VMB/DP/${String(seq).padStart(5,'0')}`;
}

/* Restore from localStorage */
(function boot() {
  try {
    const o = JSON.parse(localStorage.getItem('wizard.owner') || 'null');
    if (o) {
      state.owner = o;
      // prefill UI
      for (const [k,v] of Object.entries(o)) {
        const el = qs('#' + k);
        if (el) el.value = v;
      }
      qs('#ownerEcho').value = `${o.ownerName} / ${o.nicNumber}`;
    }
  } catch {}
  setPage(1);
})();
