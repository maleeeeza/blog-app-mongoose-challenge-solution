const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

//seed blog post data
function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];

  for (let i=1; i<=10; i++){
    seedData.push(generateBlogPostData());
  }
  return BlogPost.insertMany(seedData);
}

// generate blog post data
function generateBlogPostData(){
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    created: faker.date.past()
  }
}

// delete db
function tearDownDb(){
  console.warn('deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Blog Posts API resource', function(){
  before(function(){
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function(){
    return seedBlogPostData();
  });

  afterEach(function(){
    return tearDownDb();
  });

  after(function(){
    return closeServer();
  });

  describe('GET', function(){

    it('should return all existing blog posts', function(){
      let res;
      return chai.request(app)
      .get('/posts')
      .then(function(_res){
        res = _res;
        res.should.have.status(200);
        res.body.should.have.length.of.at.least(1);
        return BlogPost.count();
      })
      .then(function(count){
        res.body.should.have.lengthOf(count);
      });

    });

    it('should return blog posts with right fields', function() {

      let resBlogPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(post) {
            post.should.be.a('object');
            post.should.include.keys(
              'id', 'title', 'content', 'author', 'created');
          });
          resBlogPost = res.body[0];
          return BlogPost.findById(resBlogPost.id);
        })
        .then(function(post) {
          resBlogPost.id.should.equal(post.id);
          resBlogPost.title.should.equal(post.title);
          resBlogPost.content.should.equal(post.content);
          resBlogPost.author.should.equal(post.author.firstName + ' ' + post.author.lastName);
          resBlogPost.created.should.contain(post.created.toISOString());
        });
    });
  });

  describe('POST', function() {

    it('should add a new blog post', function() {

      const newBlogPost = {
        title: 'Skynet: is it really fiction?',
        content: 'content for skynet story',
        author: {
          firstName: 'The',
          lastName: 'Terminator'}
        };

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'title', 'content', 'author', 'created');
          res.body.id.should.not.be.null;
          res.body.title.should.equal(newBlogPost.title);
          res.body.content.should.equal(newBlogPost.content);
          res.body.author.should.equal(newBlogPost.author.firstName + ' ' + newBlogPost.author.lastName);
          res.body.created.should.not.be.null;
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          post.title.should.equal(newBlogPost.title);
          post.content.should.equal(newBlogPost.content);
          post.author.firstName.should.equal(newBlogPost.author.firstName);
          post.author.lastName.should.equal(newBlogPost.author.lastName);
          post.created.should.not.be.null;
        });
    });
  });


  describe('PUT', function() {
    it('should update fields', function() {
      const updateData = {
        title: 'blahblahblahblah',
        content: 'more blahblahblahblah'
      };

      return BlogPost
        .findOne()
        .exec()
        .then(function(post) {
          updateData.id = post.id;
          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(204);

          return BlogPost.findById(updateData.id).exec();
        })
        .then(function(post) {
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
        });
      });
  });

  describe('DELETE', function() {

    it('delete a blog post by id', function() {

      let post;

      return BlogPost
        .findOne()
        .exec()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return BlogPost.findById(post.id).exec();
        })
        .then(function(_post) {
          should.not.exist(_post);
        });
    });
  });











});
