require("dotenv").config();
const mongoose = require("mongoose")
const express = require("express");
const cors = require("cors");
// const saltRounds = 10
const passport = require("passport")
// const passportLocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs")
const session = require("express-session")
const app = express();
// const PORT = process.env.PORT || 5000;
const PORT = 8000;
const ObjectId = require("mongodb").ObjectId;
const User = require("./models/User")
console.log(process.env.ATLAS_URI);
mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("MongoDB Atlas Connected…")
  }).catch(err=>console.log(err))

// Middleware
app.use(express.json());
//  res.header('Access-Control-Allow-Origin', "http://localhost:3000");
app.use(cors({
  origin: "https://myproject-client.netlify.app",
  methods: ["GET", "POST"],
  credentials: true,
  exposedHeaders: ["Set-Cookie"]
}));
// , "Origin", "X-Requested-With", "Content-Type"
//   origin: "https://myproject-client.netlify.app",

// app.set('trust proxy', 1)

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "https://myproject-client.netlify.app");
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false,
  // cookie: {
  //   sameSite: 'none',
  //   secure: true,
  // }
}))

app.use(function (req, res, next) {
  if (!req.session) {
    return next(new Error('session expired')) //handle error
  }
  next() //otherwise continue
});

require("./passportConfig")(passport);

app.use(cookieParser("Our little secret"));
app.use(passport.initialize())
app.use(passport.session())

// https://myproject-client.netlify.app
//----------------------------------------- END OF MIDDLEWARE---------------------------------------------------

const questionsRoute = require("./routes/questions");
app.use("/questions", passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), questionsRoute);


app.post("/register", (function (req, res) {
  User.findOne({ username: req.body.email }, async (err, foundUser) => {
    if (err) throw err;
    if (foundUser) {
      res.send({ success: "already", message: "user already registered" })
    }
    else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const newUser = new User({
        name: req.body.name,
        username: req.body.email,
        password: hashedPassword,
      });
      await newUser.save()
      res.send({ success: true, message: "Successfully registered user" })
    }
  })
})
)
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send({success: false, message: "Invalid username or password"});
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send({ success: true, message: "Successfully Authenticated", user: req.user });
      });
    }
  })
    (req, res, next);
});
app.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.send({ success: false })
      } else {
        res.send({ success: true })
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});

module.exports = User

//     secure: true,
// var sessionConfig = {
//   secret: "Our little secret",
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     sameSite: 'none',
//   }
// }
// };

// if (process.env.NODE_ENV === 'production') {
//   app.set('trust proxy', 1); // trust first proxy
//   sessionConfig.cookie.secure = true; // serve secure cookies
// }

// app.use(session(sessionConfig));

// app.route("/login").post(function (req, res) {
//   passport.authenticate('local', function (err, user) {
//     if (err) {
//       res.json({ success: false, message: err })
//     }
//     else {
//       if (!user) {
//         res.json({ success: false, message: 'username or password incorrect' })
//       }
//       else {
//         req.login(user, function (err) {
//           if (err) {
//             res.json({ success: false, message: err })
//           }
//           // else {
//           //   const token = jwt.sign({
//           //     userId: user._id,
//           //     username: user.name
//           //   }, secretkey,
//           //     { expiresIn: '24h' })
//           //   res.json({
//           //     success: true, message: "Authentication successful", token: token
//           //   });
//           // }
//         })
//       }
//     }
//   })
// })


  // const { name, email, password } = req.body
  // var hashPassword
  // bcrypt.genSalt(saltRounds, function (err, salt) {
  //   bcrypt.hash(password, salt, function (err, hash) {
  //     if (err)
  //       console.log(err);
  //     else {
  //       hashPassword = hash.toString()
  //       console.log(hashPassword);
  //     }
  //   });
  // });
  // const user = new User({
  //   name: name,
  //   email: email,
  //   password: hashPassword
  // })
  // User.register({ name: req.body.username, email: req.body.email }, req.body.password, (err, user){
  //   if (err)
  // })


  // user.save({ writeConcern: { w: "majority", wtimeout: 5000 } },
      //   (err) => {
      //     if (err)
      //       console.log(err);
      //     else
      //       res.send({ message: "successfully registered user", user: user })
      //   })

  // const { email, password } = req.body

  // User.findOne({ email: email }, (err, user) => {
  //   if (err)
  //     console.log(err);
  //   else {
  //     if (user) {
  //       var hashPassword
  //       bcrypt.genSalt(saltRounds, function (err, salt) {
  //         bcrypt.hash(password, salt, function (err, hash) {
  //           hashPassword = hash
  //         });
  //       });
  //       if (hashPassword === user.password)
  //         res.send({ message: "succesfully logged in", user: user })
  //       else
  //         res.send({ message: "password doesnt match" })
  //     }
  //     else {
  //       res.send({ message: "user not registered" })
  //     }
  //   }
  // })

