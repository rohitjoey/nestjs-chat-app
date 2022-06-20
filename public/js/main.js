const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

console.log(username, room);
const socket = io('http://localhost:5000');

//join room
socket.emit('joinRoom', { username, room });

//get room and users of tha room
socket.on('roomUsers', ({ room, roomUsers }) => {
  outputRoomName(room);
  outputRoomUsers(roomUsers);
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = e.target.msg.value;

  socket.emit('chat', msg);
  e.target.msg.value = '';
  e.target.msg.focus();
});

socket.on('chat', (message) => {
  outMessage(message);
  //scroll to down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// socket.on('disconnect', () => {
//   socket.on('users', (message) => {
//     console.log(message);
//   });
// });

const outMessage = (msgObject) => {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `<p class="meta">${msgObject.username} <span>${msgObject.time}</span></p>
    <p class="text">
        ${msgObject.text}
    </p>`;
  document.querySelector('.chat-messages').appendChild(div);
};

const outputRoomName = (room) => {
  roomName.innerText = room;
};

const outputRoomUsers = (users) => {
  userList.innerHTML = `${users
    .map((user) => `<li>${user.username}</li>`)
    .join('')}`;
};
