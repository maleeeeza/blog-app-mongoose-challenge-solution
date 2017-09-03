const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const should = chai.should();

const{BlogPost} = require('../models');
const{app, runServer, closeServer} = require('../server');
const{TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

//seed blog post data
function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];

  for (let i=1; 1<=10; i++){
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






});
