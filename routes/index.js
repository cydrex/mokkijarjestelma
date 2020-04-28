var express = require('express');
var router = express.Router();

// views/index.hbs 
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Mökinvaraus järjestelmä' });
});

router.get('/login', function (req, res, next) {
    res.render('login', { title: 'Login' });
});

router.get('/register', function (req, res, next) {
    res.render('register', { title: 'register' });
});

router.get('/mokit', function (req, res, next) {
    res.render('mokit', { title: 'Vuokrattavat mökit' });
});

router.get('/lisaaMokki', function (req, res, next) {
    res.render('lisaaMokki', { title: 'Lisää mökki' });
});

router.get('/lisatty', function (req, res, next) {
    res.render('lisatty', { title: 'Mökki lisätty!' });
});

router.get('/hyvaksyMokit', function (req, res, next) {
    res.render('hyvaksyMokit', { title: 'Hyväksy mökkejä!' });
});

router.get('/mokkiPohja', function (req, res, next) {
    res.render('mokkiPohja', { title: 'mökki' });
});

module.exports = router;