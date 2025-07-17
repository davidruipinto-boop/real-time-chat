const socket = io('https://real-time-server-ih0p.onrender.com');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
// Exemplo de emojis e ASCII faces
const emojis = ["😊", "😂", "❤️", "👍", "🥺", "😍", "🔥"];
const asciiFaces = ["¯\\_(ツ)_/¯", "( ͡° ͜ʖ ͡°)", "(╯°□°）╯︵ ┻━┻", "(｡♥‿♥｡)", "(▀̿Ĺ̯▀̿ ̿)"];

const emojiBtn = document.getElementById("emoji-button");
const asciiBtn = document.getElementById("ascii-button");
const emojiPicker = document.getElementById("emoji-picker");
const asciiPicker = document.getElementById("ascii-picker");

function populatePicker(picker, items) {
    picker.innerHTML = '';
    items.forEach(char => {
        const span = document.createElement("span");
        span.textContent = char;
        span.style.cursor = 'pointer';
        span.onclick = (e) => {
            e.stopPropagation(); // Impede que o clique feche o picker
            messageInput.value += char;
            messageInput.focus();
            // Não fecha automaticamente!
        };
        picker.appendChild(span);
    });
}

let emojiOpen = false;
let asciiOpen = false;

emojiBtn.onclick = (e) => {
    e.stopPropagation();
    asciiPicker.style.display = 'none';
    asciiOpen = false;

    emojiOpen = !emojiOpen;
    emojiPicker.style.display = emojiOpen ? 'flex' : 'none';

    if (emojiOpen) populatePicker(emojiPicker, emojis);
};

asciiBtn.onclick = (e) => {
    e.stopPropagation();
    emojiPicker.style.display = 'none';
    emojiOpen = false;

    asciiOpen = !asciiOpen;
    asciiPicker.style.display = asciiOpen ? 'flex' : 'none';

    if (asciiOpen) populatePicker(asciiPicker, asciiFaces);
};

// Fecha os pickers ao enviar mensagem
document.getElementById('send-container').addEventListener('submit', () => {
    emojiPicker.style.display = 'none';
    asciiPicker.style.display = 'none';
    emojiOpen = false;
    asciiOpen = false;
});



let name = '';

while (!name || name.length > 20) {
    name = prompt('Qual é o teu nome? (máx. 20 caracteres)');
    if (name && name.length > 20) {
        alert('O nome não pode ter mais de 20 caracteres.');
    }
}
const now = new Date();
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');
const time = `[${hours}:${minutes}]`;
appendMessage(`<strong>${time}</strong> Entraste no chat`, true);

socket.emit('new-user', name);

socket.on('chat-message', data => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    appendMessage(`<strong>[${time}]</strong> <strong>${data.name}:</strong> ${data.message}`, false);
});


socket.on('file-message', data => {
    appendFile(data, false); // Estilo de outros
});


socket.on('user-connected', name => {
    const now = new Date();
    const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
    appendMessage(`<strong>${time}</strong> <strong>${name}</strong> entrou no chat`, false);
});

socket.on('user-disconnected', name => {
    const now = new Date();
    const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
    appendMessage(`<strong>${time}</strong> <strong>${name}</strong> saiu do chat`, false);
});


messageForm.addEventListener('submit', e => {
    e.preventDefault();

    const message = messageInput.value;
    const file = fileInput.files[0];

    if (file) {
        if (file.size > 0.5 * 1024 * 1024) { // 5MB limite
            alert('O ficheiro é demasiado grande (máx. 0.5MB).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function() {
            const base64 = reader.result;
            const fileData = {
                name: name,
                fileName: file.name,
                fileType: file.type,
                fileData: base64
            };
            socket.emit('send-file', fileData);
            appendFile(fileData, true); // Estilo do próprio
        };
        reader.onerror = function() {
            alert('Erro ao ler o ficheiro.');
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    }


    if (message.trim() !== '') {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;

        appendMessage(`<strong>[${time}]</strong> <strong>Tu:</strong> ${message}`, true);
        socket.emit('send-chat-message', message);
        messageInput.value = '';
    }

});

function appendMessage(message, isSelf = false) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    messageElement.classList.add('message');
    messageElement.classList.add(isSelf ? 'self' : 'other');

    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}





function appendFile(data, isSelf = false) {
    const fileElement = document.createElement('div');
    fileElement.classList.add('message');
    fileElement.classList.add(isSelf ? 'self' : 'other');

    const fileType = data.fileType || '';

    // Imagem
    if (fileType.startsWith('image/')) {

        const img = document.createElement('img');
        img.src = data.fileData;
        img.alt = data.fileName;
        img.style.maxWidth = '300px';
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        fileElement.innerHTML = `<strong>${time} ${data.name} enviou uma imagem:</strong><br/>`;
        fileElement.appendChild(img);
    }
    // Vídeo
    else if (fileType.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = data.fileData;
        video.controls = true;
        video.style.maxWidth = '300px';
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        fileElement.innerHTML = `<strong>${time} ${data.name} enviou um vídeo:</strong><br/>`;
        fileElement.appendChild(video);
    }
    // Áudio
    else if (fileType.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = data.fileData;
        audio.controls = true;
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        fileElement.innerHTML = `<strong>${time} ${data.name} enviou um áudio:</strong><br/>`;
        fileElement.appendChild(audio);
    }
    // Qualquer outro tipo de ficheiro
    else {
        const link = document.createElement('a');
        link.href = data.fileData;
        link.download = data.fileName;
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
        link.innerText = `${time}   ${data.name} enviou: ${data.fileName}`;
        fileElement.appendChild(link);
    }

    messageContainer.append(fileElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}



const allUsersContainer = document.getElementById('all-users');

socket.on('update-user-list', users => {
    updateUserList(users);
});

function updateUserList(users) {
    allUsersContainer.innerHTML = ''; // Limpa a lista antiga

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.innerText = user;
        allUsersContainer.append(userElement);
    });
}
