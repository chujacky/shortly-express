const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/', (req, res, next) => {
  Auth.createSession(req, res, () => {
      Auth.verifySession(req, res, () => {
        res.render('index');
      });
  });
});

app.get('/create', (req, res, next) => {
   Auth.verifySession(req, res, () => {
        res.render('index');
    });
});

app.get('/links', (req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  models.Users.create({username, password})
    .then(() => {
      Auth.createSession(req, res, () => {
        models.Sessions.get({hash: req.session.hash})
          .then((session) => {
            return models.Users.get({username: username});
          })
          .then((user) => {
            return models.Sessions.update({id: user.id}, {userId: user.id}); 
          })
          .then(() => {
            res.status(200).redirect('/');
          });
      });
    })
    .catch(() => {
      res.status(404).redirect('/signup');
    });
});

app.post('/login', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  models.Users.get({username: username})
    .then((result) => {
      return models.Users.compare(password, result.password, result.salt);
    })
    .then((success) => {
      if (success) {
        res.status(200).redirect('/');
      } else {
        res.status(401).redirect('/login');
      }
    })
    .catch(() => {
      res.status(404).redirect('/login');
    });
});

app.get('/login', (req, res) => {
  res.render('login');
})

app.get('/logout', (req, res, next) => {
  var hash = req.headers.cookie.split('=')[1];
  
  models.Sessions.delete({hash: hash})
    .then(() => {
      res.status(200).redirect('/login');
    });
});
/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
