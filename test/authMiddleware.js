const chai = require('chai'),
  server = require('./../app'),
  sessionManager = require('./../app/services/sessionManager'),
  User = require('../app/models').user,
  should = chai.should(),
  usersFactory = require('./factories/users');

const successUserCreate = email =>
  usersFactory.build({ email: email || 'default@wolox.com.ar' }).then(user =>
    chai
      .request(server)
      .post('/users')
      .send(user.dataValues)
      .then(() => user.dataValues)
  );

const userAuth = (user, password = '1234') =>
  chai
    .request(server)
    .post('/users/sessions')
    .send({ username: user.username, password });

const successfulLogin = () => successUserCreate().then(userAuth);

describe('auth middleware', () => {
  it('should fail because getting authorized endpoint without header', done => {
    chai
      .request(server)
      .post('/logout')
      .catch(err => err.should.have.status(401))
      .then(() => done());
  });

  it('should fail because user does not exist anymore', done => {
    successfulLogin()
      .then(loginRes => {
        return User.findOne({ where: { username: 'username 1' } }).then(u => {
          return u.destroy().then(() => {
            return chai
              .request(server)
              .post('/logout')
              .set(sessionManager.HEADER_NAME, loginRes.headers[sessionManager.HEADER_NAME])
              .catch(err => err.should.have.status(401));
          });
        });
      })
      .then(() => done());
  });

  it('should work successfully', done => {
    successfulLogin()
      .then(loginRes => {
        return chai
          .request(server)
          .post('/logout')
          .set(sessionManager.HEADER_NAME, loginRes.headers[sessionManager.HEADER_NAME])
          .then(res => res.should.not.have.status(401));
      })
      .then(() => done());
  });
});
