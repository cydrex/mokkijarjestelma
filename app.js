const bodyParser = require('body-parser');
const multer = require('multer');
var express = require('express');
var session = require('express-session');
var handlebars = require('express-handlebars');
require('dotenv').config();
var path = require('path');
const fs = require('fs');
var uuid = require('uuid');
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// express
var app = express();

// express-handlebars
app.engine('.hbs', handlebars({ defaultLayout: 'default', extname: '.hbs' }));
app.set('view engine', '.hbs');

app.use(session({
    secret: 'asdasd',
    resave: false,
    saveUninitialized: false
}));

// static content
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));
app.use("/bootstrap", express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use("/popper", express.static(path.join(__dirname, '/node_modules/popper.js/dist')));
app.use("/jquery", express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use("/img", express.static(path.join(__dirname, '/public/img')));
var mokkikuvat = path.resolve(__dirname, 'mokkikuvat');
app.use("/public", express.static(path.join(__dirname, '/public')));
app.use("/mokkikiuvat", express.static(path.join(__dirname, '/mokkikuvat')));
app.use("/custom", express.static(path.join(__dirname, '/views/layouts')));
app.use(express.static(mokkikuvat));
app.use(function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});

//multer
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './mokkikuvat');
    },
    filename: function (req, file, cb) {
        const id = uuid.v4(),
            filename = id + file.originalname;

        return cb(null, filename);
    }
});
var upload = multer({ storage: storage });

//käyttäjädb
const User = require('./models/userdb');
//käytttäjän autentikointi
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//mökkitiedot
const mokkidb = require('./models/Mokki.js');
const SignupCode = require('./models/signupCode.js');

app.post('/upload', upload.array('mokki', 12), function (req, res) {
    console.log(req.file);
    const mokki = new mokkidb({
        yhteystiedot: req.body.yhteystiedot,
        nimi: req.body.nimi,
        perustiedot: req.body.perustiedot,
        huoneet: req.body.huoneet,
        varustelu: req.body.varustelu,
        koko: req.body.koko,
        sijainti: req.body.sijainti,
        etaisyydet: req.body.etaisyydet,
        hinta: req.body.hinta,
        mokkikuvat: req.files.map(file => {
            return { path: file.filename };
        })
    });

    mokki.save((error, result) => {
        if (error) {
            return next(err);
        }
        console.log(mokki);
        res.redirect('lisatty');
    });
});

//register
app.post('/register', function (req, res, next) {
    const username = req.body.username,
        password = req.body.password,
        registercode = req.body.registercode;
    SignupCode.findOne({ pin: registercode, used: false }, function (err, signupCode) {
        if (err) {
            console.log(err);
        } else {
            if (!signupCode) {
                console.log(signupCode);
                console.log('No signup code found!');
                res.redirect('/error-page');
                return;
            }
            SignupCode.updateOne({ pin: registercode }, { $set: { used: true } }, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    User.register(new User({ username: username }), password, function (err, user) {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log('user registered!');
                            res.redirect('/hyvaksyMokit');
                        }
                    });
                }
            });
        }
    });
});

app.post('/mokit/:id', function (req, res) {
    console.log(req.params);
    database.updateOne({ _id: req.params.id }, { $set: { approved: true } }, (err2, result) => {
        if (err2) {
            console.log(err, result);
            res.redirect("/error");
        } else {
            console.log('approved!');
            res.redirect('/hyvaksyMokit');
        }
    });
});

//login
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function (req, res) {
    res.redirect('/hyvaksyMokit');
});

//logout
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/mokit', function (req, res, next) {
    mokkidb.find({ approved: false }).then(unapproved => {
        mokkidb.find({ approved: true }).then(approved => {
            console.log(unapproved);
            res.render('mokit', {
                approved: approved,
                unapproved: unapproved
            });
        }).catch(error => {
            console.log(error);
        });
    }).catch(error => {
        console.log(error);
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

app.get('/mokit/:id', function (req, res) {
    const cottageId = req.params.id;
    mokkidb.findOne({ _id: cottageId }, function (err, cottage) {
        if (err || !cottage) {
            console.log(err);
            res.render('mokkiError');
            return;
        }
        res.render('mokkiPohja', {
            cottage: cottage
        });
    });
});

app.post('/approve/:id', function (req, res) {
    console.log(req.params);
    mokkidb.updateOne({ _id: req.params.id }, { $set: { approved: true } }, (err2, result) => {
        if (err2) {
            console.log(err, result);
            res.redirect("/error");
        } else {
            console.log('approved!');
            res.redirect('/getDemos');
        }
    });
});

function deleteFiles(files, callback) {
    let length = files.length;
    if (!length) return callback(null);
    files.forEach(function (file) {
        fs.unlink(file.path, function (err) {
            length--;
            if (err) {
                callback(err);
            } else if (length <= 0) {
                callback(null);
            }
        });
    });
}

app.post('/delete/:id', function (req, res) {
    console.log(req.params);
    mokkidb.findOneAndRemove({ _id: req.params.id }, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            deleteFiles(data.mokkikuvat, function (err, success) {
                if (err) {
                    res.render('errorPage');
                    return;
                }
                res.redirect("/hyvaksyMokit");
            });
        }
    });
});

app.get('/hyvaksyMokit', ensureAuthenticated, function (req, res, next) {
    mokkidb.find({ approved: false }).then(unapproved => {
        mokkidb.find({ approved: true }).then(approved => {
            res.render('hyvaksyMokit', {
                approved: approved,
                unapproved: unapproved
            });
        }).catch(error => {
            console.log(error);
        });
    }).catch(error => {
        console.log(error);
    });
});



//database connection
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('connected to database'))

// routes
var routes = require('./routes/index');
app.use('/', routes);

// server
app.listen(3000, function () {
    console.log('Application is open in localhost:3000.');
});