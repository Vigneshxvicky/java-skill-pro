document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatWindow = document.getElementById('chatWindow');
  
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (chatInput.value) {
        socket.emit('chat message', chatInput.value);
        chatInput.value = '';
      }
    });
  
    socket.on('chat message', (msg) => {
      const div = document.createElement('div');
      div.textContent = msg;
      chatWindow.appendChild(div);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });
  
    // Listen for notifications and display them as toast messages
    socket.on('notification', (data) => {
      const notif = document.createElement('div');
      notif.className = 'toast-notification';
      notif.textContent = data.message;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 4000);
    });
  });
  