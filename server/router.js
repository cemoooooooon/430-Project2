const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get(
    '/login',
    mid.requiresSecure,
    mid.requiresLogout,
    controllers.Account.loginPage,
  );

  app.post(
    '/login',
    mid.requiresSecure,
    mid.requiresLogout,
    controllers.Account.login,
  );

  app.get(
    '/signup',
    mid.requiresSecure,
    mid.requiresLogout,
    controllers.Account.signupPage,
  );

  app.post(
    '/signup',
    mid.requiresSecure,
    mid.requiresLogout,
    controllers.Account.signup,
  );

  // log out!
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  // journal routes!
  app.get('/journal', mid.requiresLogin, controllers.Journal.journalPage);
  app.get(
    '/journal/entries',
    mid.requiresLogin,
    controllers.Journal.getEntries,
  );
  app.post(
    '/journal/entry',
    mid.requiresLogin,
    controllers.Journal.createEntry,
  );

  app.post(
    '/changePassword',
    mid.requiresLogin,
    controllers.Account.changePassword,
  );

  app.get('/journal/stats', mid.requiresLogin, controllers.Journal.getStats);

  app.get('/', mid.requiresSecure, (req, res) => {
    if (req.session.account) {
      return res.redirect('/journal');
    }
    return controllers.Account.loginPage(req, res);
  });
};

module.exports = router;
