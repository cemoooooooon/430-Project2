const models = require("../models");

const { Account } = models;

const loginPage = (req, res) => res.render("login");

const signupPage = (req, res) => res.render("signup");

const logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};

const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: "Passwords do not match!" });
  }

  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({ username, password: hash });
    await newAccount.save();

    req.session.account = Account.toAPI(newAccount);

    return res.json({ redirect: "/journal" });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Username already in use!" });
    }
    return res.status(500).json({ error: "An error occured!" });
  }
};

const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: "Wrong username or password!" });
    }

    req.session.account = Account.toAPI(account);

    return res.json({ redirect: "/journal" });
  });
};

const changePassword = async (req, res) => {
  if (!req.session.account) {
    return res.status(401).json({ error: "You must be logged in." });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Both current and new password are required." });
  }

  try {
    // get username from the session
    const username = req.session.account.username;

    // reuse the existing authenticate helper
    return Account.authenticate(
      username,
      currentPassword,
      async (err, account) => {
        if (err || !account) {
          return res
            .status(401)
            .json({ error: "Current password is incorrect." });
        }

        // hash the new password using the same helper as signup
        const hash = await Account.generateHash(newPassword);
        account.password = hash;
        await account.save();

        return res.json({ message: "Password updated successfully." });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error changing password." });
  }
};

module.exports = {
  loginPage,
  signupPage,
  login,
  logout,
  signup,
  changePassword,
};
