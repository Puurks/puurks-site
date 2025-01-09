document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const chatForm = document.getElementById("chatForm");
  const messageInput = document.getElementById("messageInput");
  const messages = document.getElementById("messages");
  const socket = io();

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Invalid login credentials");
        const user = await response.json();
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "chat.html";
      } catch (err) {
        document.getElementById("error").textContent = err.message;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);

      try {
        const response = await fetch("/api/register", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Registration failed");
        window.location.href = "chat-login.html";
      } catch (err) {
        document.getElementById("error").textContent = err.message;
      }
    });
  }

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (messageInput.value) {
        socket.emit("chat message", messageInput.value);
        messageInput.value = "";
      }
    });

    socket.on("chat message", (msg) => {
      const item = document.createElement("li");
      item.textContent = msg;
      messages.appendChild(item);
    });
  }
});
