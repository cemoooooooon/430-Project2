import { init as initJournal } from "./JournalApp.jsx";

// show error text in the error bubble
const handleError = (message) => {
  const errorSpan = document.getElementById("errorMessage");
  const errorBox = document.getElementById("domoMessage");

  if (errorSpan && errorBox) {
    errorSpan.textContent = message;
    errorBox.classList.remove("hidden");
  }
};

// send a POST as JSON and react to redirect / error
const sendPost = async (url, data) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  // hide any previous errors
  const errorBox = document.getElementById("domoMessage");
  if (errorBox) {
    errorBox.classList.add("hidden");
  }

  // handle redirects
  if (result.redirect) {
    window.location = result.redirect;
    return;
  }

  if (result.error) {
    handleError(result.error);
  }
};

// setting up event listeners
const initAuth = () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  // sign up!
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = signupForm.querySelector("#user").value;
      const pass = signupForm.querySelector("#pass").value;
      const pass2 = signupForm.querySelector("#pass2").value;

      if (!username || !pass || !pass2) {
        handleError("All fields are required!");
        return false;
      }

      if (pass !== pass2) {
        handleError("Passwords do not match!");
        return false;
      }

      sendPost(signupForm.getAttribute("action"), { username, pass, pass2 });
      return false;
    });
  }

  // log in!
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = loginForm.querySelector("#user").value;
      const pass = loginForm.querySelector("#pass").value;

      if (!username || !pass) {
        handleError("Username or password is empty!");
        return false;
      }

      sendPost(loginForm.getAttribute("action"), { username, pass });
      return false;
    });
  }
};

// each one will only do work if its DOM elements exist
window.addEventListener("load", () => {
  initAuth();
  initJournal();
});
