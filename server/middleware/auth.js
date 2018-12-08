const models = require('../models');
const Promise = require('bluebird');
const express = require('express');

module.exports.createSession = (req, res, next) => {
  console.log(req);
  models.Sessions.get({hash: req.cookies.shortlyid})
    .then((session) => {
      console.log('-----------------', session);
      req.session = session;
      next();
    })
    .catch((session) => {
      models.Sessions.create()
        .then((result) => {
          return models.Sessions.get({id: result.insertId});
        })
        .then((session) => {
          req.session = {
            hash: session.hash
          };
          res.cookie('shortlyid', session.hash);
          next();
        });
    });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

