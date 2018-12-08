const express = require('express');
const auth = require('./auth');
const parseCookies = (req, res, next) => {

  var cookies = req.headers.cookie;
  if (!cookies) {
    return auth.createSession(req, res, next)
      .then(() => {
        console.log('dllm');
      });
  } else {
    var obj = {};
    cookies = cookies.split('; ');
    cookies.forEach((cookie, index) => {
      cookies[index] = cookie.split('=');
      obj[cookies[index][0]] = cookies[index][1];
    });
    req.cookies = obj;
  }
  next();
};

module.exports = parseCookies;