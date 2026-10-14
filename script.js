const DEMO_USER = {
  email: 'verifyrisk9@gmail.com',
  password: 'Sarang@999',
  name: 'Administrator'
};

const DEMO_USER_PASSWORDS = new Set([DEMO_USER.password, 'Sarang@123']);

const SESSION_KEY = 'rmsDemoAuth';
const INVOICE_STORAGE_KEY = 'rmsInvoiceData';
const MESSAGE_STORAGE_KEY = 'rmsWebsiteMessages';
const DELETED_MESSAGE_KEY = 'rmsDeletedMessages';

const DEFAULT_INVOICES = [
  { id: 'INV-2048', invoice: 'INV-2048', client: 'HDFC Capital', amount: '₹82,400', due: '14 Oct 2026', status: 'Paid' },
  { id: 'INV-2049', invoice: 'INV-2049', client: 'Bajaj Finserv', amount: '₹1,24,600', due: '18 Oct 2026', status: 'Pending' },
  { id: 'INV-2050', invoice: 'INV-2050', client: 'ICICI Home Loans', amount: '₹96,200', due: '20 Oct 2026', status: 'Review' },
  { id: 'INV-2051', invoice: 'INV-2051', client: 'Axis Bank', amount: '₹1,78,500', due: '25 Oct 2026', status: 'Overdue' }
];

const DEFAULT_MESSAGES = [
  { id: 'default-msg-1', sender: 'Finance Team', subject: 'Invoice approval pending', preview: 'Please confirm the branch-wise billing summary before release.', time: '10 min ago', unread: true },
  { id: 'default-msg-2', sender: 'Operations Desk', subject: 'Property verification update', preview: 'Three files were rejected for missing location proof. Please review.', time: '1 hour ago', unread: true },
  { id: 'default-msg-3', sender: 'Client Success', subject: 'Client escalation raised', preview: 'Newcase from HDFC with turnaround request for 48 hours.', time: '3 hours ago', unread: false },
  { id: 'default-msg-4', sender: 'Compliance Lead', subject: 'MIS report approved', preview: 'The monthly report was signed off and saved to the archive.', time: 'Yesterday', unread: false }
];

document.querySelectorAll('a[href="index.html"], a[href="index.html/"]')
  .forEach((link) => {
    link.setAttribute('href', '/');
  });

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

const yearNode = document.querySelector('[data-year]');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

function getDemoAuth() {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function setDemoAuth(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearDemoAuth() {
  localStorage.removeItem(SESSION_KEY);
}

function readStoredList(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStoredList(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getInvoiceData() {
  const invoices = readStoredList(INVOICE_STORAGE_KEY, DEFAULT_INVOICES);
  const normalized = invoices.map((invoice, index) => ({
    ...invoice,
    id: invoice.id || `INV-${index + 1}`,
    invoice: invoice.invoice || `INV-${index + 1}`
  }));

  if (!localStorage.getItem(INVOICE_STORAGE_KEY)) {
    writeStoredList(INVOICE_STORAGE_KEY, normalized);
  }

  return normalized;
}

function saveInvoiceData(invoices) {
  writeStoredList(INVOICE_STORAGE_KEY, invoices);
}

function getDeletedMessageIds() {
  const deletedIds = readStoredList(DELETED_MESSAGE_KEY, []);
  return deletedIds.filter(Boolean);
}

function setDeletedMessageIds(ids) {
  writeStoredList(DELETED_MESSAGE_KEY, ids);
}

function getMessageIdentity(message) {
  if (message && message.id) return String(message.id);

  const sender = message && message.sender ? String(message.sender) : 'website';
  const subject = message && message.subject ? String(message.subject) : 'inquiry';
  const time = message && message.time ? String(message.time) : 'now';
  return `${sender}-${subject}-${time}`;
}

function getMessageData() {
  const storedMessages = readStoredList(MESSAGE_STORAGE_KEY, []);
  const deletedIds = new Set(getDeletedMessageIds());

  const normalizedStoredMessages = storedMessages.map((message) => {
    const identity = getMessageIdentity(message);
    const normalizedMessage = {
      ...message,
      id: message.id || identity,
      unread: Boolean(message.unread),
      sender: message.sender || 'Website Visitor',
      subject: message.subject || 'Website inquiry',
      preview: message.preview || message.requirement || 'New website inquiry',
      time: message.time || 'Just now'
    };

    return normalizedMessage;
  });

  if (JSON.stringify(storedMessages) !== JSON.stringify(normalizedStoredMessages)) {
    writeStoredList(MESSAGE_STORAGE_KEY, normalizedStoredMessages);
  }

  return [...DEFAULT_MESSAGES, ...normalizedStoredMessages].filter((message) => !deletedIds.has(getMessageIdentity(message)));
}

function saveWebsiteMessage(message) {
  const storedMessages = readStoredList(MESSAGE_STORAGE_KEY, []);
  const messageEntry = {
    id: message.id || `message-${Date.now()}`,
    sender: message.sender || 'Website Visitor',
    subject: message.subject || 'Website inquiry',
    preview: message.preview || message.requirement || 'New website inquiry',
    time: message.time || 'Just now',
    unread: true
  };

  storedMessages.unshift(messageEntry);
  writeStoredList(MESSAGE_STORAGE_KEY, storedMessages);
}

function deleteMessageById(messageId) {
  if (!messageId) return;

  const storedMessages = readStoredList(MESSAGE_STORAGE_KEY, []);
  const filteredStoredMessages = storedMessages.filter((message) => getMessageIdentity(message) !== String(messageId));
  writeStoredList(MESSAGE_STORAGE_KEY, filteredStoredMessages);

  const deletedIds = getDeletedMessageIds();
  if (!deletedIds.includes(String(messageId))) {
    deletedIds.push(String(messageId));
    setDeletedMessageIds(deletedIds);
  }

  renderMessages();
}

function renderInvoices() {
  const invoiceTableBody = document.querySelector('#invoiceTableBody');
  if (!invoiceTableBody) return;

  const invoices = getInvoiceData();

  invoiceTableBody.innerHTML = invoices
    .map((entry) => {
      const statusClass = entry.status.toLowerCase().replace(/\s+/g, '-');
      return `
        <tr data-id="${entry.id}">
          <td>${entry.invoice}</td>
          <td>${entry.client}</td>
          <td>${entry.amount}</td>
          <td>${entry.due}</td>
          <td><span class="status-badge status-${statusClass}">${entry.status}</span></td>
          <td>
            <div class="row-actions">
              <button class="action-button" data-action="edit" data-invoice-id="${entry.id}" type="button">Edit</button>
              <button class="action-button danger" data-action="delete" data-invoice-id="${entry.id}" type="button">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderMessages(messagesOverride) {
  const messageList = document.querySelector('#messageList');
  if (!messageList) return;

  const messages = messagesOverride || getMessageData();
  messageList.innerHTML = messages
    .map(
      (item) => `
        <div class="message-item ${item.unread ? 'unread' : ''}" data-message-id="${item.id}">
          <div class="message-head">
            <strong>${item.sender}</strong>
            <span>${item.time}</span>
          </div>
          <p class="message-subject">${item.subject}</p>
          <p>${item.preview}</p>
          <div class="message-actions">
            <button class="action-button danger" type="button" data-action="delete-message" data-message-id="${item.id}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

function openInvoiceEditor(invoiceId) {
  const modal = document.querySelector('#invoiceModal');
  const modalTitle = document.querySelector('#invoiceModalTitle');
  const invoiceNumber = document.querySelector('#invoiceNumber');
  const invoiceClient = document.querySelector('#invoiceClient');
  const invoiceAmount = document.querySelector('#invoiceAmount');
  const invoiceDueDate = document.querySelector('#invoiceDueDate');
  const invoiceStatus = document.querySelector('#invoiceStatus');
  const invoiceIdInput = document.querySelector('#invoiceId');

  if (!modal || !modalTitle || !invoiceNumber || !invoiceClient || !invoiceAmount || !invoiceDueDate || !invoiceStatus || !invoiceIdInput) return;

  const invoices = getInvoiceData();
  const invoice = invoices.find((entry) => entry.id === invoiceId);

  if (invoice) {
    invoiceIdInput.value = invoice.id;
    invoiceNumber.value = invoice.invoice;
    invoiceClient.value = invoice.client;
    invoiceAmount.value = invoice.amount;
    invoiceDueDate.value = invoice.due;
    invoiceStatus.value = invoice.status;
    modalTitle.textContent = 'Edit Invoice';
  } else {
    invoiceIdInput.value = '';
    invoiceNumber.value = '';
    invoiceClient.value = '';
    invoiceAmount.value = '';
    invoiceDueDate.value = '';
    invoiceStatus.value = 'Pending';
    modalTitle.textContent = 'Add Invoice';
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeInvoiceModal() {
  const modal = document.querySelector('#invoiceModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function handleInvoiceAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const invoiceId = target.getAttribute('data-invoice-id');
  const action = target.getAttribute('data-action');

  if (action === 'edit') {
    openInvoiceEditor(invoiceId);
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm('Are you sure you want to delete this invoice?');
    if (!confirmed) return;

    const invoices = getInvoiceData().filter((entry) => entry.id !== invoiceId);
    saveInvoiceData(invoices);
    renderInvoices();
  }
}

function handleMessageAction(event) {
  const target = event.target.closest('[data-action="delete-message"]');
  if (!target) return;

  const messageId = target.getAttribute('data-message-id');
  const confirmed = window.confirm('Are you sure you want to delete this message?');
  if (!confirmed) return;

  deleteMessageById(messageId);
}

const contactForm = document.querySelector('#contactForm');
if (contactForm) {
  const nameInput = document.querySelector('#contactName');
  const emailInput = document.querySelector('#contactEmail');
  const companyInput = document.querySelector('#contactCompany');
  const industryInput = document.querySelector('#contactIndustry');
  const requirementInput = document.querySelector('#contactRequirement');
  const statusBox = document.querySelector('#contactStatus');

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fullName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const company = companyInput.value.trim();
    const requirement = requirementInput.value.trim();

    if (!fullName || !email || !company || !requirement) {
      if (statusBox) {
        statusBox.textContent = 'Please complete all required fields before submitting.';
        statusBox.classList.add('error');
      }
      return;
    }

    saveWebsiteMessage({
      sender: fullName,
      subject: `Website inquiry from ${company}`,
      preview: requirement,
      requirement,
      email,
      company,
      industry: industryInput.value,
      time: 'Just now',
      unread: true
    });

    contactForm.reset();
    if (statusBox) {
      statusBox.classList.remove('error');
      statusBox.textContent = 'Your message has been sent successfully. Our admin team will review it shortly.';
    }
  });
}

const loginForm = document.querySelector('#loginForm');
if (loginForm) {
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#password');
  const statusBox = document.querySelector('#loginStatus');

  const currentSession = getDemoAuth();
  if (currentSession) {
    window.location.href = 'dashboard.html';
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      if (statusBox) {
        statusBox.textContent = 'Please enter both user ID and password.';
      }
      return;
    }

    if (email === DEMO_USER.email.toLowerCase() && DEMO_USER_PASSWORDS.has(password)) {
      setDemoAuth({
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        role: 'Admin'
      });
      window.location.href = 'dashboard.html';
      return;
    }

    if (statusBox) {
      statusBox.textContent = 'Invalid credentials. Use the demo admin login details.';
    }
  });
}

const dashboardPage = document.querySelector('[data-dashboard-page]');
if (dashboardPage) {
  renderInvoices();
  renderMessages();

  const invoiceTableBody = document.querySelector('#invoiceTableBody');
  if (invoiceTableBody) {
    invoiceTableBody.addEventListener('click', handleInvoiceAction);
  }

  const messageList = document.querySelector('#messageList');
  if (messageList) {
    messageList.addEventListener('click', handleMessageAction);
  }

  const invoiceForm = document.querySelector('#invoiceForm');
  if (invoiceForm) {
    invoiceForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const invoiceIdInput = document.querySelector('#invoiceId');
      const invoiceNumber = document.querySelector('#invoiceNumber');
      const invoiceClient = document.querySelector('#invoiceClient');
      const invoiceAmount = document.querySelector('#invoiceAmount');
      const invoiceDueDate = document.querySelector('#invoiceDueDate');
      const invoiceStatus = document.querySelector('#invoiceStatus');

      const invoiceNumberValue = invoiceNumber.value.trim();
      const clientValue = invoiceClient.value.trim();
      const amountValue = invoiceAmount.value.trim();
      const dueDateValue = invoiceDueDate.value.trim();

      if (!invoiceNumberValue || !clientValue || !amountValue || !dueDateValue) {
        return;
      }

      const existingInvoices = getInvoiceData();

      if (invoiceIdInput.value) {
        const updatedInvoices = existingInvoices.map((entry) => {
          if (entry.id !== invoiceIdInput.value) return entry;
          return {
            ...entry,
            invoice: invoiceNumberValue,
            client: clientValue,
            amount: amountValue,
            due: dueDateValue,
            status: invoiceStatus.value
          };
        });

        saveInvoiceData(updatedInvoices);
      } else {
        const newInvoice = {
          id: `INV-${Date.now()}`,
          invoice: invoiceNumberValue,
          client: clientValue,
          amount: amountValue,
          due: dueDateValue,
          status: invoiceStatus.value
        };

        saveInvoiceData([...existingInvoices, newInvoice]);
      }

      renderInvoices();
      closeInvoiceModal();
    });
  }

  const addInvoiceButton = document.querySelector('#addInvoiceBtn');
  if (addInvoiceButton) {
    addInvoiceButton.addEventListener('click', () => openInvoiceEditor());
  }

  const closeInvoiceButton = document.querySelector('#closeInvoiceModal');
  if (closeInvoiceButton) {
    closeInvoiceButton.addEventListener('click', closeInvoiceModal);
  }

  const cancelInvoiceButton = document.querySelector('#cancelInvoiceEdit');
  if (cancelInvoiceButton) {
    cancelInvoiceButton.addEventListener('click', closeInvoiceModal);
  }

  const session = getDemoAuth();
  if (!session) {
    window.location.href = 'login.html';
  }

  const userNameNode = document.querySelector('#currentUserName');
  if (userNameNode) {
    userNameNode.textContent = session ? session.name : 'Administrator';
  }

  const lastLoginNode = document.querySelector('#lastLogin');
  if (lastLoginNode) {
    lastLoginNode.textContent = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  const logoutButton = document.querySelector('#logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearDemoAuth();
      window.location.href = 'login.html';
    });
  }
}
