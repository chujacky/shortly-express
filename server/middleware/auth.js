const models = require('../models');
const Promise = require('bluebird');
const express = require('express');

const createSessionHelper = (req, res, next) => {
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
};

module.exports.createSession = (req, res, next) => {
  if (!req.cookies) {
    createSessionHelper(req, res, next);
  } else {
    models.Sessions.get({hash: req.cookies.shortlyid})
      .then((session) => {
        req.session = session;
        next();
      })
      .catch((session) => {
        createSessionHelper(req, res, next);
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

