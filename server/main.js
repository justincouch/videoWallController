import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import '../imports/api/db.js';
import { UI_DB } from '../imports/api/db.js';
import '../node_modules/isomorphic-fetch';
import Unsplash, { toJson } from "unsplash-js";
import Twitter from 'twitter';
import { Mongo } from 'meteor/mongo'

import lodash from 'lodash';
_ = lodash;

let fs = Npm.require('fs');
var path = Npm.require('path');
var basePath = path.resolve('.').split('.meteor')[0];

let unsplash;
let TWEET_CLIENT;
let TWEET_STREAM = {};

let WALL_MODES = [
  "RAINBOW",
  "VIDEOS",
  "UNSPLASH",
  "BLACK",
  "RED",
  "THREE",
  "test",
  "TWEET_WALL",
  "WEBSITE"
];

Meteor.startup(() => {
  let available_modes = UI_DB.findOne({"name":"WALL_MODES"});
  if ( available_modes != undefined ){
    available_modes.modes = [];
    for ( let i=0; i<WALL_MODES.length; i++ ){
      available_modes.modes.push(WALL_MODES[i]);
    }
    Meteor.call('ui_db.update', available_modes);
  }
  else {
    let obj = {
      "name":"WALL_MODES",
      "modes":[]
    };
    for ( let i=0; i<WALL_MODES.length; i++ ){
      obj.modes.push(WALL_MODES[i]);
    }
    Meteor.call('ui_db.insert', obj);
  }

  //console.log(UI_DB);
  let current_mode = UI_DB.findOne({"name":"MODE"});
  if ( current_mode != undefined ){

  }
  else {
    let obj = {
      "name":"MODE",
      "current_mode":"",
      "tweet_wall_params":{
        "q":"",
        "tweet_mode":"extended",
        "count":"100",
        "include_entities":"true"
      },
      "video_params":{
        "selected_videos":[]
      }
    };
    Meteor.call('ui_db.insert', obj);
  }

  let tweet_wall = UI_DB.findOne({"name":"TWEET_WALL"});
  if ( tweet_wall != undefined ){
    //reset queue and tweetHistory
    tweet_wall.queue = [];
    tweet_wall.history = [];
    Meteor.call('ui_db.update', tweet_wall);
  }
  else {
    let obj = {
      "name":"TWEET_WALL",
      "queue":[],
      "history":[]
    };
    Meteor.call('ui_db.insert', obj);
  }
  lookForVideos();
  connectToUnsplash();
  connectToTwitter();
});

function lookForVideos(){
  const videosFolder = '../web.browser/app/videos';
  var dir_videos = fs.readdirSync(videosFolder);
  console.log(dir_videos);

  let video_obj = UI_DB.findOne({"name":"VIDEO_LIST"});
  if ( video_obj != undefined ){
    video_obj.video_list = [];
    Meteor.call('ui_db.update', video_obj);
  }
  else {
    video_obj = {
      "name":"VIDEO_LIST",
      "video_list":[]
    };
    Meteor.call('ui_db.insert', video_obj);
  }

  video_obj = UI_DB.findOne({"name":"VIDEO_LIST"});

  for ( let i=0; i<dir_videos.length; i++ ){
    console.log(dir_videos[i]);
    fs.readFile(videosFolder +"/"+ dir_videos[i], Meteor.bindEnvironment(function(err,data){
      console.log("read it!");
      console.log(dir_videos[i]);
      if (err) throw err;
      // decodings from https://github.com/image-size/image-size/tree/master/lib/types
      // and guess and check of ogv
      if ( _.endsWith(dir_videos[i], 'png') ){
        assetWidth = data.readUInt32BE(16);
        assetHeight = data.readUInt32BE(20);
      }
      else if ( _.endsWith(dir_videos[i], 'jpg') ){
        let jpgdata = calculate(data);
        assetWidth = jpgdata.width;
        assetHeight = jpgdata.height;
      }
      else if ( _.endsWith(dir_videos[i], 'ogv') ){
        assetWidth = data.readUInt16BE(43);
        assetHeight = data.readUInt16BE(46);
      }
      else{
        assetWidth =  data.readUInt16BE(36);
        assetHeight =  data.readUInt16BE(38);
      }

      if(dir_videos[i] != ".DS_Store" && dir_videos[i].endsWith(".mp4")){
        let new_obj = {
          url: dir_videos[i],
          category: "",
          id: new Mongo.ObjectID(),
          width: assetWidth,
          height: assetHeight,
          thumbnail: dir_videos[i].substring(0,dir_videos[i].length-4) + ".jpg"
        };
        console.log(new_obj);
        let obj = UI_DB.findOne({"name":"VIDEO_LIST"});
        obj.video_list.push(new_obj);
        Meteor.call('ui_db.update', obj);
      }
    }));
  }
  //console.log(video_obj);
  //Meteor.call('ui_db.update', video_obj);
}

function connectToUnsplash(){
  unsplash = new Unsplash({
    applicationId: "3ec9859e6a79de28b52bfc28d82e54adf22b3f83adbcf4a82951c1cc968b4747",
    secret: "8ead02cdf31e7ef419a2e5c9b260adcda886c9271a8b55228b0cb03f3850947e",
    callbackUrl: ""
  });
  unsplash.collections.getCollectionPhotos(2349061)
    // .then(function(value){
    //   //console.log(JSON.stringify(value));
    //   let headstr = value.body._readableState.buffer.head.data.toString();
    //   let tailstr = value.body._readableState.buffer.tail.data.toString();
    //   let str = headstr + tailstr;
    //   console.log(headstr);
    //   console.log(tailstr);
    //   //console.log(value.body._readableState);
    //
    //   //console.log(JSON.parse(str));
    //   //console.log(value.body._readableState.buffer.head.data.toString());//.PassThrough.ReadableState.buffer);
    // });
    .then(toJson)
    .then(json => {
      let obj = UI_DB.findOne({"name":"MODE"});
      if ( obj != undefined ){
        obj.image_list = [];
        for( let i=0; i<json.length; i++ ){
          //console.log(json[i]);
          obj.image_list[i] = json[i];
          // obj.image_list[i].url = json[i].urls.regular;
          // obj.image_list[i].width = json[i].width;
          // obj.image_list[i].height = json[i].height;
        }
        Meteor.call('ui_db.update', obj);
      }
    });
}

function connectToTwitter(){
  TWEET_CLIENT = new Twitter({
    consumer_key: "2FwwEfgwIchclqtusLfSOUb24",
    consumer_secret: "M4A8eKelf2tjbEUkTlCa1kSootjaY0YHgQGXy8Jc2HqzbZtDax",
    access_token_key: "523620573-EnksnRQ3iy5o3aZLjKV7WpUGOn3jn2x0c7bqsxOG",
    access_token_secret: "bbprjTvm4Wrf3GroiVFIF6kOwuNt9R0btRsczYqE9coJa"
  });
}


function start_tweet_stream(obj){
  /**
   * Stream statuses filtered by keyword
   * number of tweets per second depends on topic popularity
   **/
  //let obj = UI_DB.findOne({"name":"MODE"});
  let query = "";
  if ( obj.tweet_wall_params ){
    query = obj.tweet_wall_params.q;
  }
  else {
    query = "from:_continuum";
  }
  console.log("twitter stream query: " + query);
  console.log(query);
  TWEET_CLIENT.stream('statuses/filter', {track: query},  Meteor.bindEnvironment(function(stream) {
    TWEET_STREAM = stream;

    stream.on('data', Meteor.bindEnvironment(function(tweet) {
      if ( tweet.text != undefined ){
        // console.log(tweet.user.screen_name + " - " + tweet.user.name);
        // console.log("  " + tweet.text);
        // console.log("  " + tweet.source);
        //io.emit( 'tweet', tweet );
        //Meteor.call('addTweet', tweet);
        passToAddTweet(tweet);
      }
    }));

    stream.on('error', Meteor.bindEnvironment(function(error) {
      console.log(error);
    }));
  }));
}

function passToAddTweet(obj){
  // console.log("passing to add tweet");
  // console.log(obj);
  Meteor.call('addTweet',obj);
}

function stop_tweet_stream(){
  if ( TWEET_CLIENT ){
    console.log("");
    console.log("");
    console.log("");
    console.log("STOPPING TWEET STREAM!!!");
    console.log("");
    console.log("");
    console.log("");
    TWEET_STREAM.destroy();
  }
}


function searchTwitter(obj){
  //let obj = UI_DB.findOne({"name":"MODE"});
  if ( obj.tweet_wall_params ){
    let tweet_wall = UI_DB.findOne({"name":"TWEET_WALL"});
    tweet_wall.queue = [];
    TWEET_CLIENT.get('search/tweets', obj.tweet_wall_params)
      .then(function(value){
        //console.log(value);
        // console.log(value.statuses.length);
        for( var i=0; i<value.statuses.length; i++ ){
          tweet_wall.queue.push(value.statuses[i]);
          //io.emit( 'tweet', value.statuses[i] );
        }
        Meteor.call('ui_db.update', tweet_wall);
      })
      .catch(console.error)
  }
}


Meteor.methods({
  'start_tweet_stream'(obj){
    start_tweet_stream(obj);
  },
  'stop_tweet_stream'(obj){
    stop_tweet_stream();
  },
  'searchTwitter'(obj){
    searchTwitter(obj);
  },
  'addTweet'(obj){
    let tweet_wall = UI_DB.findOne({"name":"TWEET_WALL"});
    if ( tweet_wall ){
      tweet_wall.queue.push(obj);
    }
    Meteor.call('ui_db.update', tweet_wall);
  }
});
