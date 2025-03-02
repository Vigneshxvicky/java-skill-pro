const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// In‑memory “database”
const users = [];  
// Example user object: { username, password, points, bio, profilePicture }
const blogs = {};
// Each blog: blogs[username] = { content: string, mediaUrl: string }
const comments = {};  
// Each entry: comments[blogOwner] = [{ commenter, text, timestamp }, …]

// Middleware: static files and form data parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Session handling
app.use(session({
  secret: 'javaSkillBeeSecret',
  resave: false,
  saveUninitialized: false,
}));

// Socket.IO integration: handle real‑time chat & notifications
io.on('connection', (socket) => {
  console.log('A user connected.');
  
  socket.on('chat message', (msg) => {
    // In a real app, identify the sender from the session
    // Broadcast received chat message to everyone
    io.emit('chat message', msg);
  });

  socket.on('notification', (data) => {
    io.emit('notification', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

function getUser(req) {
  return users.find(u => u.username === req.session.user);
}

// ----- ROUTES -----

// Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Membership Registration (also acts as login for this demo)
app.get('/membership', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'membership.html'));
});
app.post('/membership', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.send('Username already exists. Please try a different one.');
  }
  // Create new user with initial points and empty profile info
  users.push({ username, password, points: 0, bio: '', profilePicture: '' });
  req.session.user = username;
  res.redirect('/blog');
});

// Blog Editing Page (for logged in users)
app.get('/blog', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});
app.post('/blog', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  const { content, mediaUrl } = req.body;
  blogs[req.session.user] = { content, mediaUrl };
  // Award 10 points for blog update (gamification)
  const user = getUser(req);
  if (user) user.points += 10;
  // Emit a notification
  io.emit('notification', { message: `${req.session.user} updated their blog!` });
  res.send('Blog updated successfully!');
});

// My Blog Page - displays blog post and comment form
app.get('/myblog', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  const blogData = blogs[req.session.user] || { content: "No blog content yet.", mediaUrl: "" };
  const blogComments = comments[req.session.user] || [];
  let commentsHtml = `<h3>Comments</h3>`;
  if (blogComments.length === 0) {
    commentsHtml += `<p>No comments yet.</p>`;
  } else {
    blogComments.forEach(c => {
      commentsHtml += `<div class="comment"><strong>${c.commenter}</strong>: ${c.text}<br/><small>${c.timestamp}</small></div>`;
    });
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${req.session.user}'s Blog</title>
      <link rel="stylesheet" href="/css/blog.css">
    </head>
    <body>
      <header>
        <h1>${req.session.user}'s Blog</h1>
        <button id="darkModeToggle">Toggle Dark Mode</button>
      </header>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/blog">Edit Blog</a></li>
          <li><a href="/profile">Profile</a></li>
          <li><a href="/calendar">Calendar</a></li>
          <li><a href="/chat">Chat</a></li>
          <li><a href="/logout">Logout</a></li>
        </ul>
      </nav>
      <main>
        <section class="blog-content">
          <p>${blogData.content}</p>
          ${ blogData.mediaUrl ? `<img src="${blogData.mediaUrl}" alt="Blog Media" class="blog-media">` : '' }
        </section>
        <section class="comments">
          ${commentsHtml}
        </section>
        <section class="add-comment">
          <h3>Add a Comment</h3>
          <form method="POST" action="/comment">
            <input type="hidden" name="blogOwner" value="${req.session.user}">
            <textarea name="comment" rows="4" placeholder="Write a comment..."></textarea><br/>
            <button type="submit">Post Comment</button>
          </form>
        </section>
      </main>
      <footer>
        <p>&copy; 2023 Java Skill Bee Club</p>
      </footer>
      <script src="/js/main.js"></script>
    </body>
    </html>
  `);
});

// Handle comment submission
app.post('/comment', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  const { blogOwner, comment } = req.body;
  const timestamp = new Date().toLocaleString();
  if (!comments[blogOwner]) comments[blogOwner] = [];
  comments[blogOwner].push({ commenter: req.session.user, text: comment, timestamp });
  const user = getUser(req);
  if (user) user.points += 5; // Gamification: 5 points per comment
  io.emit('notification', { message: `${req.session.user} commented on ${blogOwner}'s blog!` });
  res.redirect('/myblog');
});

// Profile Page – view and update profile with gamification points displayed
app.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  const user = getUser(req);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${req.session.user}'s Profile</title>
      <link rel="stylesheet" href="/css/profile.css">
    </head>
    <body>
      <header>
        <h1>Your Profile</h1>
        <button id="darkModeToggle">Toggle Dark Mode</button>
      </header>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/blog">Edit Blog</a></li>
          <li><a href="/myblog">My Blog</a></li>
          <li><a href="/calendar">Calendar</a></li>
          <li><a href="/chat">Chat</a></li>
          <li><a href="/logout">Logout</a></li>
        </ul>
      </nav>
      <main>
        <form method="POST" action="/profile">
          <label for="bio">Bio:</label><br/>
          <textarea name="bio" id="bio" rows="4" placeholder="Tell us about yourself...">${user.bio}</textarea><br/>
          <label for="profilePicture">Profile Picture URL:</label><br/>
          <input type="text" name="profilePicture" id="profilePicture" placeholder="Image URL" value="${user.profilePicture}"><br/>
          <button type="submit">Update Profile</button>
        </form>
        <div class="points">
          <h3>Gamification Points: ${user.points}</h3>
        </div>
      </main>
      <footer>
        <p>&copy; 2023 Java Skill Bee Club</p>
      </footer>
      <script src="/js/main.js"></script>
    </body>
    </html>
  `);
});
app.post('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  const { bio, profilePicture } = req.body;
  const user = getUser(req);
  if (user) {
    user.bio = bio;
    user.profilePicture = profilePicture;
  }
  res.redirect('/profile');
});

// Calendar Page – interactive schedule (using FullCalendar CDN)
app.get('/calendar', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

// Chat Page – real‑time chat using Socket.IO
app.get('/chat', (req, res) => {
  if (!req.session.user) return res.redirect('/membership');
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
