import { showSplash } from './splash.js';

// Register
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // register logic here
    showSplash("Welcome!", () => {
      window.location.href = "../login/login.html";
    });
  });
}

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // login logic here
    showSplash("Logging in...", () => {
      window.location.href = "../citizen/citizen.html";
    });
  });
}


