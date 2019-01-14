import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import '../imports/api/db.js';
import { UI_DB } from '../imports/api/db.js';

// import { THREE } from '../client/lib/three.js';
import THREE from 'three';
import d3 from 'd3';
import 'd3-scale';
//import './cloud.js';

import './main.html';

let LAST_MODE = "";
let TWEET_CLIENT;
let tweet_cloud;
let tweet_checkInt;
let UNSPLASH_COUNTER = 0;
let UNSPLASH_LENGTH = 0;

let VIDEOS_COUNTER = 0;
let VIDEOS_LENGTH = 0;


Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});

Template.videoWall.onRendered( function(){
  //console.log(THREE);
  //updated3Layout();
  //console.log(d3);
  //console.log(TWEET_CLOUD);
  //init();
  //animate();
  //connectToTwitter();
});

var camera, scene, renderer;
var geometry, material, mesh;

function init() {
	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.z = 1;

	scene = new THREE.Scene();

	geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	$(".videoWall-container").append( renderer.domElement );

}

function initRainbow(){
  // if ( !Detector.webgl ) {
	// 			Detector.addGetWebGLMessage();
	// 			return false;
	// 		}
  if ( document.getElementById( 'vshader' ) != null ){
			renderer = new THREE.WebGLRenderer();
			if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === null ) {
				document.getElementById( 'notSupported' ).style.display = '';
				return false;
			}
			// container = document.createElement( 'div' );
			// document.body.appendChild( container );
			camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 5000 );
			camera.position.z = 1800;
			scene = new THREE.Scene();
			var circleGeometry = new THREE.CircleBufferGeometry( 1, 6 );
			geometry = new THREE.InstancedBufferGeometry();
			geometry.index = circleGeometry.index;
			geometry.attributes = circleGeometry.attributes;
			var particleCount = 75000;
			var translateArray = new Float32Array( particleCount * 3 );
			for ( var i = 0, i3 = 0, l = particleCount; i < l; i ++, i3 += 3 ) {
				translateArray[ i3 + 0 ] = Math.random() * 12 - 6;
				translateArray[ i3 + 1 ] = Math.random() * 4 - 2;
				translateArray[ i3 + 2 ] = Math.random() * 4 - 2;
			}
      //console.log(document.getElementById( 'vshader' ));
      geometry.addAttribute( 'translate', new THREE.InstancedBufferAttribute( translateArray, 3, 1 ) );
			material = new THREE.RawShaderMaterial( {
				uniforms: {
					map: { value: new THREE.TextureLoader().load( '/textures/sprites/circle.png' ) },
					time: { value: 0.0 }
				},
				vertexShader: document.getElementById( 'vshader' ).textContent,
				fragmentShader: document.getElementById( 'fshader' ).textContent,
				depthTest: true,
				depthWrite: true
			} );
			mesh = new THREE.Mesh( geometry, material );
			mesh.scale.set( 500, 500, 500 );
			scene.add( mesh );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			//container.appendChild( renderer.domElement );
      $(".videoWall-container").append( renderer.domElement );
			//stats = new Stats();
			//container.appendChild( stats.dom );
			//window.addEventListener( 'resize', onWindowResize, false );
			//return true;
    }
    else {
      console.log("shader not ready");
    }
}

let reqAnimFrame;

function animate() {
  //console.log("animate");
	reqAnimFrame = requestAnimationFrame( animate );

	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;

	renderer.render( scene, camera );

}

function animateRainbow(){
  //console.log($("canvas"));
  if ($("canvas").length ){
    reqAnimFrame = requestAnimationFrame( animateRainbow );
  			//stats.update();
    var time = performance.now() * 0.0005;
  			material.uniforms.time.value = time;
  			mesh.rotation.x = time * 0.1;
  			//mesh.rotation.y = time * 0.4;
  			renderer.render( scene, camera );
      }
}



Template.videoWall.helpers({
  modes() {
    let obj = UI_DB.findOne({"name":"MODE"});
    if ( obj != undefined ){
      if ( obj.current_mode != LAST_MODE ){
        if ( $(".unsplash-container").length != 0){
          $(".unsplash-container").clearQueue().finish();
        }
        $(".videoWall-container").empty();
        cancelAnimationFrame( reqAnimFrame );
        if ( tweet_checkInt ){
          clearInterval(tweet_checkInt);
        }
        if ( LAST_MODE === "TWEET_WALL" ){
          Meteor.call("stop_tweet_stream");
        }
      //}

        if ( obj.current_mode === "UNSPLASH"){
          UNSPLASH_COUNTER = 0;
          UNSPLASH_LENGTH = obj.image_list.length;
          UNSPLASH_COUNTER = Math.floor( UNSPLASH_LENGTH * Math.random() );
          startUnsplash();
        }
        else if ( obj.current_mode === "VIDEOS"){
          $(".videoWall-container").css({"background-color":"black"});
          startVideos();
        }
        else if ( obj.current_mode === "THREE"){
          init();
          animate();
        }
        else if ( obj.current_mode === "RAINBOW"){
          initRainbow();
          animateRainbow();
        }
        else if ( obj.current_mode === "BLACK"){
          $(".videoWall-container").css({"background-color":"black"});
        }
        else if ( obj.current_mode === "RED"){
          $(".videoWall-container").css({"background-color":"red"});
        }
        else if ( obj.current_mode === "TWEET_WALL"){
          // if ( TWEET_CLIENT != undefined ){
          //   searchTwitter();
          // }
          // else {
          //   console.error("TWEET CLIENT not initialized");
          // }
          $(".videoWall-container").css({"background-color":"black"});
          tweet_cloud = new TWEET_CLOUD();
          //tweet_cloud.addTweet("tweet");
          tweet_cloud.createContainerDivs($(".videoWall-container"));

          console.log($("#tweet_search_terms_text").html());
          let h1str = '<h1>';
          let rin = obj.tweet_search_raw_input;
          for ( let i=0; i<rin.length; i++ ){
            if ( i > 0 ) h1str += "    |    ";
            h1str += rin[i];
            //if ( i > 0 && i < rin.length-1 ) h1str += "  |";
          }
          h1str += "</h1>";
          $("#tweet_search_terms_text").html(h1str);

          Meteor.call('searchTwitter',obj);
          Meteor.call('start_tweet_stream',obj);

          tweet_checkInt = setInterval(function(){
            tweet_cloud.checkTweetQueue();
          }, 20000 );
          //$(".videoWall-container").css({"background-color":"red"});
        }
        else if ( obj.current_mode === "WEBSITE"){
          if ( obj.website === undefined || obj.website === "" ) obj.website = "https://www.continuuminnovation.com";
          let div =
          $(
            '<iframe id="inlineFrameExample"'+
                'title="Inline Frame Example"'+
                'width="100%"'+
                'height="100%"'+
                'src="'+obj.website+'">'+
            '</iframe>'
          )
          .appendTo(".videoWall-container");
        }
        else {
          console.log("unsure what to do with: " + obj.current_mode);
        }
      }

      LAST_MODE = obj.current_mode;
    }
  },
  tweets(){
    let mobj = UI_DB.findOne({"name":"MODE"});
    if ( mobj != undefined && mobj.current_mode === "TWEET_WALL" ){
      let obj = UI_DB.findOne({"name":"TWEET_WALL"});
      //console.log(obj);
      if ( obj.queue.length != 0 ){
        for ( let i=0; i<obj.queue.length; i++ ){
          tweet_cloud.addTweet(obj.queue[i]);
          obj.history.push(obj.queue[i]);
        }
        obj.queue = [];
        Meteor.call('ui_db.update', obj);
      }
    }
  }
});

function startUnsplash(){
  let obj = UI_DB.findOne({"name":"MODE"});
  if ( obj.image_list != undefined && obj.image_list[UNSPLASH_COUNTER] != undefined ){
    let ratio = $("body").width() / obj.image_list[UNSPLASH_COUNTER].width;
    let timeToTop = obj.image_list[UNSPLASH_COUNTER].width/obj.image_list[UNSPLASH_COUNTER].height >= 1 ? 60000 : 120000;
    let stoptop = "-" + ((obj.image_list[UNSPLASH_COUNTER].height * ratio) - $(".videoWall-container").height()) + "px";
    console.log(obj.image_list[UNSPLASH_COUNTER].width, obj.image_list[UNSPLASH_COUNTER].height);
    console.log(ratio, stoptop);
    let div =
    $(
      '<div id="unsplash-container" class="unsplash-container">'+
        '<img id="theImg" src="'+obj.image_list[UNSPLASH_COUNTER].urls.regular+'" />'+
      '</div>'
    )
    .appendTo(".videoWall-container")
    .animate({
      //opacity: 0.25,
      top: stoptop
    }, timeToTop, "linear", function() {
      // Animation complete.
      let obj2 = UI_DB.findOne({"name":"MODE"});
      if ( obj2.current_mode === "UNSPLASH" ){
        UNSPLASH_COUNTER = Math.floor( UNSPLASH_LENGTH * Math.random() );
        //if (UNSPLASH_COUNTER >= UNSPLASH_LENGTH) UNSPLASH_COUNTER = 0;
        $(".videoWall-container").empty();
        startUnsplash();
      }
    });
  }
}

function startVideos(){
  let obj = UI_DB.findOne({"name":"MODE"});
  console.log(obj);
  VIDEOS_COUNTER = 0;
  if ( obj.video_params != undefined && obj.video_params.selected_videos.length != 0 ){
    VIDEOS_LENGTH = obj.video_params.selected_videos.length;
    $(".videoWall-container").append('<div id="videos-container"></div>');
    let video_obj = UI_DB.findOne({"name":"VIDEO_LIST"});
    for ( let i=0; i<obj.video_params.selected_videos.length; i++ ){
      let url = "";
      for ( let j=0; j<video_obj.video_list.length; j++ ){
        if ( obj.video_params.selected_videos[i] === video_obj.video_list[j].id._str ){
          url = video_obj.video_list[j].url;
        }
      }
      if ( url != "" ){
        $('<video preload><source src="videos/'+url+'" type="video/mp4"/></video>').appendTo("#videos-container").on('ended',function(){
          VIDEOS_COUNTER++;
          if (VIDEOS_COUNTER > VIDEOS_LENGTH-1) VIDEOS_COUNTER = 0;
          switchVideos();
        });
      }
    }
    switchVideos();
  }
  else {
    console.error("no videos selected!");
  }
}

function switchVideos(){
  let vids = $("video");
  console.log(vids);

  $(vids).fadeOut(function(){
    $(vids[VIDEOS_COUNTER]).currentTime = 0;
    $(vids[VIDEOS_COUNTER]).fadeIn();
    $(vids[VIDEOS_COUNTER])[0].play();
  });
}

function moveVideoToFront(){

}

// function connectToTwitter(){
//
// }

// function searchTwitter(){
//   let obj = UI_DB.findOne({"name":"MODE"});
//   if ( obj.tweet_wall_params ){
//     TWEET_CLIENT.get('search/tweets', obj.tweet_wall_params)
//       .then(function(value){
//         console.log(value);
//         // console.log(value.statuses.length);
//         // for( var i=0; i<value.statuses.length; i++ ){
//         //   io.emit( 'tweet', value.statuses[i] );
//         // }
//       })
//       .catch(console.error)
//   }
// }
//
// function streamTwitter(){
//   /**
//    * Stream statuses filtered by keyword
//    * number of tweets per second depends on topic popularity
//    **/
//   let obj = UI_DB.findOne({"name":"MODE"});
//   let query = "";
//   if ( obj.tweet_wall_params ){
//     query = obj.tweet_wall_params;
//   }
//   else {
//     query = "@_continuum";
//   }
//   console.log("twitter stream query: " + query);
//   client.stream('statuses/filter', {track: query},  function(stream) {
//     stream.on('data', function(tweet) {
//       if ( tweet.text != undefined ){
//         console.log(tweet.user.screen_name + " - " + tweet.user.name);
//         console.log("  " + tweet.text);
//         console.log("  " + tweet.source);
//         //io.emit( 'tweet', tweet );
//       }
//     });
//
//     stream.on('error', function(error) {
//       console.log(error);
//     });
//   });
// }


Template.videoWallController.events({
  'click .mode-button'(event, instance) {
    $(".mode-button-container").removeClass("active");
    $(event.target).parent().addClass("active");
    $(".extra-container").empty();
    console.log("click");
    console.log(event.target.dataset.modename);

    let obj = UI_DB.findOne({"name":"MODE"});
    if ( obj != undefined ){
      obj.clicked_mode = event.target.dataset.modename;
      if ( event.target.dataset.modename === "WEBSITE" ){
        $(".extra-container").append('<div><input type="text" id="display-name" name="ip-display" class="text_input"/></div><div><input type="submit" class="submit" value="Submit" /></div>');
      }
      else if ( event.target.dataset.modename === "TWEET_WALL" ){
        let htmlstr = '';
        htmlstr +=  '<div>';
        htmlstr +=    '<p>Type in up to 4 search terms. Use @ for a specific account, and # for hashtags.';
        htmlstr +=    '<input type="text" id="display-name" name="ip-display" class="text_input" placeholder="Put your tweet search terms here"/>';
        htmlstr +=    '<input type="text" id="display-name" name="ip-display" class="text_input" placeholder="Put your tweet search terms here"/>';
        htmlstr +=    '<input type="text" id="display-name" name="ip-display" class="text_input" placeholder="Put your tweet search terms here"/>';
        htmlstr +=    '<input type="text" id="display-name" name="ip-display" class="text_input" placeholder="Put your tweet search terms here"/>';
        // htmlstr +=    '<button id="add-button">+</button>';
        htmlstr +=  '</div>';
        htmlstr +=  '<div>';
        htmlstr +=    '<input type="submit" class="submit" value="Put it on the Wall!" />';
        htmlstr +=  '<div>';
        $(".extra-container").append(htmlstr);
      }
      else if ( event.target.dataset.modename === "VIDEOS" ) {
        let video_obj = UI_DB.findOne({"name":"VIDEO_LIST"});
        if ( video_obj.video_list != undefined && video_obj.video_list.length != 0 ){
          let htmlstr = '<div class="row">';
          for ( i in video_obj.video_list ){
            console.log(i);
            console.log(video_obj.video_list[i]);
            htmlstr += '  <div class="col s12 m6 l4">';
            htmlstr += '    <div class="card asset-card" id="asset-card-'+video_obj.video_list[i].id._str+'">';
            htmlstr += '      <div class="card-image">';
            htmlstr += '        <img src="videos/'+video_obj.video_list[i].thumbnail+'">';
            // htmlstr += '        <span class="card-title black-text">'+video_obj.video_list[i].url+'</span>';
            htmlstr += '        <a id="'+video_obj.video_list[i].id._str+'" class="select-asset btn-floating halfway-fab waves-effect waves-light green"><i id="'+video_obj.video_list[i].id._str+'" class="material-icons">check</i></a>';
            htmlstr += '      </div>';
            htmlstr += '      <div class="card-content">';
            htmlstr += '        <span class="card-title black-text">'+video_obj.video_list[i].url+'</span>';
            //htmlstr += '        <p>'+video_obj.video_list[i].url+'</p>';
            htmlstr += '      </div>';
            htmlstr += '    </div>';
            htmlstr += '  </div>';
          }
          htmlstr += '</div>';
          htmlstr +=  '<div>';
          htmlstr +=    '<input type="submit" class="submit" value="Put it on the Wall!" />';
          htmlstr +=  '<div>';
          $(".extra-container").append(htmlstr);
        } else {
          alert( "No video files in directory. You may need to add some. Contact Justin Couch to see what's happening." );
        }
      }
      else {
        obj.current_mode = event.target.dataset.modename;
        Meteor.call('ui_db.update', obj);
      }
      Meteor.call('ui_db.update', obj);
    }
    else {
      alert("Something is not right. Database isn't responding. Contact Justin to see if he can fix it.")
    }
  },
  'click .submit'(event,instance){
    console.log('submit');
    let inputs = $(".text_input");
    let newmode = $(".mode-button-container.active")[0].firstElementChild.dataset.modename;
    let obj = UI_DB.findOne({"name":"MODE"});
    if ( obj != undefined ){
      if ( newmode === "TWEET_WALL" ){
        console.log(obj);
        obj.current_mode = "TWEET_WALL";
        obj.tweet_search_raw_input = [];
        let qstr = "";
        if ( inputs.length != 0 ){
          for ( let i=0; i<inputs.length; i++ ){
            console.log(inputs[i]);
            console.log(inputs[i].value);
            if ( inputs[i].value != "" ){
              obj.tweet_search_raw_input.push(inputs[i].value);
            }

            if ( inputs[i].value.charAt(0) === "@" ){
              qstr += (i>0?",":"") + "from:" + inputs[i].value.slice(1);
            }
            else {
              if ( inputs[i].value != "" ){
                qstr += (i>0?",":"") + inputs[i].value;
              }
            }
            //if ( i != inputs.length-1 && inputs[i+1].value != "" ) qstr += " ";
          }
        }
        else {
          console.error("no inputs! what happened?");
        }
        console.log(qstr);
        obj.tweet_wall_params.q = qstr;
        Meteor.call('ui_db.update', obj);
      }
      else if ( newmode === "WEBSITE" ){
        obj.current_mode = "WEBSITE";
        obj.website = inputs[0].value;
        Meteor.call('ui_db.update', obj);
      }
      else if ( newmode === "VIDEOS" ){
        obj.current_mode = "VIDEOS";
        Meteor.call('ui_db.update', obj);
      }
    }
  },
  'click .select-asset'(event, instance){
    console.log("clicked an asset", event.target);
    console.log(event);
    console.log(event.target.id);
    let filename = event.target.id;
    let obj = UI_DB.findOne({"name":"MODE"});
    if ( obj != undefined ){
      if ( obj.video_params != undefined ){
        let index = obj.video_params.selected_videos.indexOf(filename);
        if ( index > -1 ){
          obj.video_params.selected_videos.splice(index,1);
        }
        else {
          obj.video_params.selected_videos.push(filename);
        }
        Meteor.call('ui_db.update', obj);
      }
    }
  }
});

Template.videoWallController.helpers({
  modes() {
    console.log("helping");
    let obj = UI_DB.findOne({"name":"MODE"});
    console.log(obj);
    console.log($(".active"));
    if ( obj != undefined ){
      $(".mode-button").removeClass("active");
      $('#'+obj.current_mode+'-button').addClass("active");

      if ( obj.clicked_mode === "VIDEOS" ){
        let card = $(".asset-card");
        card.find("a").removeClass("green").addClass("red");
        card.find("i").html("add");

        console.log("helping as VIDEOS");
        for ( let i=0; i<obj.video_params.selected_videos.length; i++ ){
          console.log(obj.video_params.selected_videos[i]);
          card = $("#asset-card-"+obj.video_params.selected_videos[i]);
          card.find("a").removeClass("red").addClass("green");
          card.find("i").html("check");
        }
      }
    }
  }
});





/*

 ________  __       __  ________  ________  ________        __       __   ______   __        __
/        |/  |  _  /  |/        |/        |/        |      /  |  _  /  | /      \ /  |      /  |
$$$$$$$$/ $$ | / \ $$ |$$$$$$$$/ $$$$$$$$/ $$$$$$$$/       $$ | / \ $$ |/$$$$$$  |$$ |      $$ |
   $$ |   $$ |/$  \$$ |$$ |__    $$ |__       $$ |         $$ |/$  \$$ |$$ |__$$ |$$ |      $$ |
   $$ |   $$ /$$$  $$ |$$    |   $$    |      $$ |         $$ /$$$  $$ |$$    $$ |$$ |      $$ |
   $$ |   $$ $$/$$ $$ |$$$$$/    $$$$$/       $$ |         $$ $$/$$ $$ |$$$$$$$$ |$$ |      $$ |
   $$ |   $$$$/  $$$$ |$$ |_____ $$ |_____    $$ |         $$$$/  $$$$ |$$ |  $$ |$$ |_____ $$ |_____
   $$ |   $$$/    $$$ |$$       |$$       |   $$ |         $$$/    $$$ |$$ |  $$ |$$       |$$       |
   $$/    $$/      $$/ $$$$$$$$/ $$$$$$$$/    $$/          $$/      $$/ $$/   $$/ $$$$$$$$/ $$$$$$$$/

*/


function TWEET_CLOUD(){
  this.tweetHistory = [];
  this.tweetQueue = [];
  this.tweetWords = "";
  this.parentContainer = $(".videoWall-container");

  this.w,// = document.getElementById("center-col").offsetWidth,
  this.h = 680,
  this.words = [],
  this.max,
  this.scale = 1,
  this.complete = 0,
  this.keyword = "",
  this.tags,
  this.fontSize,
  this.maxLength = 30,
  this.fetcher,
  this.svg,
  this.background,
  this.vis,
  this.dispatch,
  this.word,
  this.end,

  this.checkTweetQueue = function(){
    //let obj = UI_DB.findOne({"name":"TWEET_WALL"});
    //console.log(obj);
    if ( this.tweetQueue.length != 0 ){
        var lc = $("#left-col");
        var tq0 = $( "#t_"+this.tweetQueue[0].id_str );
        //$( tq0, lc ).remove();
        var tq02 = tq0.clone().appendTo(this.parentContainer);
        tq02.css({"position": "absolute","left":"30px","top":"36px","width":"680px"});
        tq02.children(".tweetHolder").css("backgroundColor","#000000");
        this.makeBig(tq02);
        tq0.slideToggle(500,function(){
            $(this,lc).remove();
        });
        var tweetToAdd = this.tweetQueue.shift();
        this.tweetWords = this.tweetWords.concat((tweetToAdd.full_text != undefined ? tweetToAdd.full_text : tweetToAdd.text), " ");
        //parseText(tweetWords);
    }
    else {
        //console.log("tweet queue is empty");
        this.showARandomTweet();
        //parseText(tweetWords);
    }
    //refreshTweetQueue();
  }

  this.createContainerDivs = function(container){
    let divstr = '';
    divstr += '<div class="container tweetWall-container" style="width:100%">';
    divstr +=   '<div id="left-col" class="col-xs-2"></div>';
    divstr +=   '<div id="center-col" class="col-xs-8" style="height: auto;">';
    divstr +=     '<div id="tweet_search_terms_text">';
    divstr +=       '<h1>test</h1>';
    divstr +=     '</div>';
    divstr +=     '<div id="vis"></div>';
    divstr +=   '</div>';
    divstr +=   '<div id="right-col" class="col-xs-2"></div>';
    divstr += '</div>';
    container.append(divstr);

    this.w = document.getElementById("center-col").offsetWidth;
    this.layout = d3.layout.cloud().timeInterval(10).size([tweet_cloud.w, tweet_cloud.h]).fontSize(function(t) {
      return tweet_cloud.fontSize(+t.value)
    }).text(function(t) {
      return t.key
    });//.on("word", function(e){ console.log(e) }).on("end", function(t,e){ console.log(t,e) });
    this.layout.rotate(function() {
        return 0
    }),
    this.dispatch = d3.dispatch("word","end");
    this.dispatch.on("word", function(n){progress(n)});
    this.dispatch.on("end", function(t,e){cloud_draw(t,e)});
    this.svg = d3.select("#vis").append("svg").attr("width", this.w).attr("height", this.h);
    this.background = this.svg.append("g"),
    this.vis = this.svg.append("g").attr("transform", "translate(" + [this.w >> 1, this.h >> 1] + ")");
  }

  this.addTweet = function(tweet){
    console.log("adding tweet");
    console.log(tweet);
    this.tweetQueue.push(tweet);
    this.tweetHistory.push(tweet);
    this.addTweetDiv(tweet);
  }

  this.addTweetDiv = function(data){
    var lc = $("#left-col");
    lc.append( this.createTweetDiv(data) );
  }

  this.showARandomTweet = function(){
      var index = Math.floor(this.tweetHistory.length * Math.random());
      this.parentContainer.append( this.createTweetDiv(this.tweetHistory[index]) );
      setTimeout(function(){
          var div = $( "#t_"+this.tweetHistory[index].id_str );
          div.css({"position": "absolute","left":"1600px","top":"800px","width":"900px"});
          div.children(".tweetHolder").css("backgroundColor","#000000");
          this.makeBig(div,"random");
      },10);
  }

  this.makeBig = function(elem,opts){
      elem.find(".tweetText").addClass("big");
      elem.find(".tweetUserName").addClass("big");
      elem.find(".tweetScreenName").addClass("big");
      var top = Math.round((768 - elem.outerHeight())/2);
      var topStr = top.toString() + "px";
      elem.animate( {
        left: "1550px",
        top: topStr,
        width: "1000px",
        height: "500px",
      }, 1000, function() {
        setTimeout( function(){
          elem.fadeOut(function(){
            tweet_cloud.parseText(tweet_cloud.tweetWords);
            elem.remove();
          });
        }, (opts==="random") ? 12000 : 9000);
      });
  }

  this.createTweetDiv = function(t){
    var divString = '';

    divString += '<div id="t_'+t.id_str+'" class="row">';
    divString +=    '<div class="col-xs-10 col-xs-offset-1 tweetHolder">';

    // avatar image
    divString +=        '<div class="row">';
    divString +=            '<div class="col-xs-2">';
    divString +=                '<img src="'+ t.user.profile_image_url + '" style="width:100%;"/>';
    divString +=            '</div>';

    divString +=            '<div class="col-xs-8" style="padding-left:0px;">';
    divString +=                '<span class="tweetUserName">';
    divString +=                    t.user.name;
    divString +=                '</span>';
    divString +=                '</br>';
    divString +=                '<span class="tweetScreenName">';
    divString +=                    '@'+t.user.screen_name;
    divString +=                '</span>';
    divString +=            '</div>';
    divString +=        '</div>';

    // if there's a picture
    if ( t.entities.media != undefined && t.entities.media[0].media_url != undefined ){
        divString +=    '<div class="row">';
        divString +=        '<div class="col-xs-6 col-xs-offset-3">'
        divString +=            '<img src="'+ t.entities.media[0].media_url + '" style="width:100%;max-height:350px;"/>';
        divString +=            '</br>';
        divString +=        '</div>';
        divString +=    '</div>';
    }

    // tweet content
    divString +=        '<span class="tweetText">';
    divString +=            (t.full_text != undefined ? t.full_text : t.text);
    divString +=        '</span>';
    divString +=    '</div>';
    divString += '</div>';

    return divString;
  }







  this.parseText = function(t) {
      this.tags = {};
      var e = {};
      t.split(wordSeparators).forEach(function(t) {
          discard.test(t) || (t = t.replace(punctuation, ""),
          stopWords.test(t.toLowerCase()) || (t = t.substr(0, this.maxLength),
          e[t.toLowerCase()] = t,
          tweet_cloud.tags[t = t.toLowerCase()] = (tweet_cloud.tags[t] || 0) + 1))
      });

      this.tags = d3.entries(this.tags).sort(function(t, e) {
          return e.value - t.value
      }),
      this.tags.forEach(function(t) {
          t.key = e[t.key]
      }),
      this.generate()
  }

  this.generate = function() {
    this.layout.font("Human Sans").spiral("archimedean"),
    this.fontSize = d3.scaleLog().range([10, 100]),
    this.tags.length && this.fontSize.domain([+this.tags[this.tags.length - 1].value || 1, +this.tags[0].value]),
    complete = 0,
    //statusText.style("display", null ),
    this.words = [];
    this.layout.stop().words(this.tags.slice(0, this.max = Math.min(this.tags.length, +"250"))).start();
  }
};

let progress = function(t) {
  //statusText.text(++complete + "/" + max)
}

let cloud_draw = function(t,e) {
    //statusText.style("display", "none"),
    tweet_cloud.scale = e ? Math.min(tweet_cloud.w / Math.abs(e[1].x - tweet_cloud.w / 2), tweet_cloud.w / Math.abs(e[0].x - tweet_cloud.w / 2), tweet_cloud.h / Math.abs(e[1].y - tweet_cloud.h / 2), tweet_cloud.h / Math.abs(e[0].y - tweet_cloud.h / 2)) / 2 : 1,
    domain = [
        d3.min(t, function(d){ return d.size;}),
        d3.max(t, function(d){ return d.size;})
    ];
    words = t;
    var n = tweet_cloud.vis.selectAll("text").data(words, function(t) {
        return t.text.toLowerCase()
    });
    n.transition().duration(1e3).attr("transform", function(t) {
        return "translate(" + [t.x, t.y] + ")rotate(" + t.rotate + ")"
    }).style("font-size", function(t) {
        return t.size + "px"
    }),
    n.enter().append("text").attr("text-anchor", "middle").attr("transform", function(t) {
        return "translate(" + [t.x, t.y] + ")rotate(" + t.rotate + ")"
    }).style("font-size", "1px").transition().duration(1e3).style("font-size", function(t) {
        return t.size + "px"
    }),
    n.style("font-family", function(t) {
        return t.font
    }).style("fill", function(t) {
        var c = Math.max(200, Math.floor(t.size*2.55));
        var hex = c.toString(16);
        hex = hex.length == 1 ? "0" + hex : hex;
        //var f = d3.scale.linear(t.size).domain([0,100]).range(["white","black"]);
        return "#"+hex+hex+hex;
        //return fill(t.size, domain)
    }).text(function(t) {
        return t.text
    });
    var a = tweet_cloud.background.append("g").attr("transform", tweet_cloud.vis.attr("transform"))
      , r = a.node();
    n.exit().each(function() {
        r.appendChild(this)
    }),
    a.transition().duration(1e3).style("opacity", 1e-6).remove(),
    tweet_cloud.vis.transition().delay(1e3).duration(750).attr("transform", "translate(" + [tweet_cloud.w >> 1, tweet_cloud.h >> 1] + ")scale(" + tweet_cloud.scale + ")").each("end", function(){
        //console.log("transition ended");
        //checkTweetQueue();
    });
}

const wordSeparators = /[ \f\n\r\t\v\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g;
const discard = /^(https?:|\/\/)/;
const stopWords = /^(&amp|retweet|rt|i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;
const unicodePunctuationRe = "!$%^&*-,-/:;?\\[-\\]{}\xa1\xa7\xab\xb6\xb7\xbb\xbf\u037e\u0387\u055a-\u055f\u0589\u058a\u05be\u05c0\u05c3\u05c6\u05f3\u05f4\u0609\u060a\u060c\u060d\u061b\u061e\u061f\u066a-\u066d\u06d4\u0700-\u070d\u07f7-\u07f9\u0830-\u083e\u085e\u0964\u0965\u0970\u0af0\u0df4\u0e4f\u0e5a\u0e5b\u0f04-\u0f12\u0f14\u0f3a-\u0f3d\u0f85\u0fd0-\u0fd4\u0fd9\u0fda\u104a-\u104f\u10fb\u1360-\u1368\u1400\u166d\u166e\u169b\u169c\u16eb-\u16ed\u1735\u1736\u17d4-\u17d6\u17d8-\u17da\u1800-\u180a\u1944\u1945\u1a1e\u1a1f\u1aa0-\u1aa6\u1aa8-\u1aad\u1b5a-\u1b60\u1bfc-\u1bff\u1c3b-\u1c3f\u1c7e\u1c7f\u1cc0-\u1cc7\u1cd3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205e\u207d\u207e\u208d\u208e\u2329\u232a\u2768-\u2775\u27c5\u27c6\u27e6-\u27ef\u2983-\u2998\u29d8-\u29db\u29fc\u29fd\u2cf9-\u2cfc\u2cfe\u2cff\u2d70\u2e00-\u2e2e\u2e30-\u2e3b\u3001-\u3003\u3008-\u3011\u3014-\u301f\u3030\u303d\u30a0\u30fb\ua4fe\ua4ff\ua60d-\ua60f\ua673\ua67e\ua6f2-\ua6f7\ua874-\ua877\ua8ce\ua8cf\ua8f8-\ua8fa\ua92e\ua92f\ua95f\ua9c1-\ua9cd\ua9de\ua9df\uaa5c-\uaa5f\uaade\uaadf\uaaf0\uaaf1\uabeb\ufd3e\ufd3f\ufe10-\ufe19\ufe30-\ufe52\ufe54-\ufe61\ufe63\ufe68\ufe6a\ufe6b\uff01-\uff03\uff05-\uff0a\uff0c-\uff0f\uff1a\uff1b\uff1f\uff20\uff3b-\uff3d\uff3f\uff5b\uff5d\uff5f-\uff65";
const punctuation = new RegExp("[" + unicodePunctuationRe + "]","g");


!function(t) {
    function e() {
        function t(t, n, a) {
            for (var r, o, s, l = ([{
                x: 0,
                y: 0
            }, {
                x: e[0],
                y: e[1]
            }],
            n.x), i = n.y, d = Math.sqrt(e[0] * e[0] + e[1] * e[1]), h = m(e), f = Math.random() < .5 ? 1 : -1, p = -f; (r = h(p += f)) && (o = ~~r[0],
            s = ~~r[1],
            !(Math.min(o, s) > d)); )
                if (n.x = l + o,
                n.y = i + s,
                !(n.x + n.x0 < 0 || n.y + n.y0 < 0 || n.x + n.x1 > e[0] || n.y + n.y1 > e[1]) && (!a || !u(n, t, e[0])) && (!a || c(n, a))) {
                    for (var y, g = n.sprite, v = n.width >> 5, x = e[0] >> 5, w = n.x - (v << 4), M = 127 & w, b = 32 - M, z = n.y1 - n.y0, k = (n.y + n.y0) * x + (w >> 5), T = 0; z > T; T++) {
                        y = 0;
                        for (var A = 0; v >= A; A++)
                            t[k + A] |= y << b | (v > A ? (y = g[T * v + A]) >>> M : 0);
                        k += x
                    }
                    return delete n.sprite,
                    !0
                }
            return !1
        }
        var e = [256, 256]
          , h = n
          , p = a
          , y = r
          , g = o
          , v = s
          , m = d
          , x = []
          , w = 1 / 0
          , b = d3.dispatch("word", "end")
          , z = null
          , k = {};
        return k.start = function() {
            function n() {
                for (var n, s = +new Date; +new Date - s < w && ++u < o && z; )
                    n = d[u],
                    n.x = e[0] * (Math.random() + .5) >> 1,
                    n.y = e[1] * (Math.random() + .5) >> 1,
                    l(n, d, u),
                    t(a, n, r) && (c.push(n),
                    tweet_cloud.dispatch.call("word",[n]),
                    r ? i(r, n) : r = [{
                        x: n.x + n.x0,
                        y: n.y + n.y0
                    }, {
                        x: n.x + n.x1,
                        y: n.y + n.y1
                    }],
                    n.x -= e[0] >> 1,
                    n.y -= e[1] >> 1);
                u >= o && (k.stop(),
                tweet_cloud.dispatch.call("end", [c,r]))
            }
            var a = f((e[0] >> 5) * e[1])
              , r = null
              , o = x.length
              , u = -1
              , c = []
              , d = x.map(function(t, e) {
                return {
                    text: h.call(this, t, e),
                    font: p.call(this, t, e),
                    rotate: g.call(this, t, e),
                    size: ~~y.call(this, t, e),
                    padding: s.call(this, t, e)
                }
            }).sort(function(t, e) {
                return e.size - t.size
            });
            return z && clearInterval(z),
            z = setInterval(n, 0),
            n(),
            k
        }
        ,
        k.stop = function() {
            return z && (clearInterval(z),
            z = null ),
            k
        }
        ,
        k.timeInterval = function(t) {
            return arguments.length ? (w = null == t ? 1 / 0 : t,
            k) : w
        }
        ,
        k.words = function(t) {
            return arguments.length ? (x = t,
            k) : x
        }
        ,
        k.size = function(t) {
            return arguments.length ? (e = [+t[0], +t[1]],
            k) : e
        }
        ,
        k.font = function(t) {
            return arguments.length ? (p = d3.functor(t),
            k) : p
        }
        ,
        k.rotate = function(t) {
            return arguments.length ? (g = d3.functor(t),
            k) : g
        }
        ,
        k.text = function(t) {
            return arguments.length ? (h = d3.functor(t),
            k) : h
        }
        ,
        k.spiral = function(t) {
            return arguments.length ? (m = M[t + ""] || t,
            k) : m
        }
        ,
        k.fontSize = function(t) {
            return arguments.length ? (y = d3.functor(t),
            k) : y
        }
        ,
        k.padding = function(t) {
            return arguments.length ? (v = d3.functor(t),
            k) : v
        }
        ,
        rebind(k, b, "on")
    }
    function n(t) {
        return t.text
    }
    function a() {
        return "serif"
    }
    function r(t) {
        return Math.sqrt(t.value)
    }
    function o() {
        return 30 * (~~(6 * Math.random()) - 3)
    }
    function s() {
        return 1
    }
    function l(t, e, n) {
        if (!t.sprite) {
            w.clearRect(0, 0, (g << 5) / m, v / m);
            var a = 0
              , r = 0
              , o = 0
              , s = e.length;
            for (n--; ++n < s; ) {
                t = e[n],
                w.save(),
                w.font = ~~((t.size + 1) / m) + "px " + t.font;
                var l = w.measureText(t.text + "m").width * m
                  , u = t.size << 1;
                if (t.rotate) {
                    var i = Math.sin(t.rotate * y)
                      , c = Math.cos(t.rotate * y)
                      , d = l * c
                      , h = l * i
                      , f = u * c
                      , p = u * i;
                    l = Math.max(Math.abs(d + p), Math.abs(d - p)) + 31 >> 5 << 5,
                    u = ~~Math.max(Math.abs(h + f), Math.abs(h - f))
                } else
                    l = l + 31 >> 5 << 5;
                if (u > o && (o = u),
                a + l >= g << 5 && (a = 0,
                r += o,
                o = 0),
                r + u >= v)
                    break;
                w.translate((a + (l >> 1)) / m, (r + (u >> 1)) / m),
                t.rotate && w.rotate(t.rotate * y),
                w.fillText(t.text, 0, 0),
                w.restore(),
                t.width = l,
                t.height = u,
                t.xoff = a,
                t.yoff = r,
                t.x1 = l >> 1,
                t.y1 = u >> 1,
                t.x0 = -t.x1,
                t.y0 = -t.y1,
                a += l
            }
            for (var x = w.getImageData(0, 0, (g << 5) / m, v / m).data, M = []; --n >= 0; ) {
                t = e[n];
                for (var l = t.width, b = l >> 5, u = t.y1 - t.y0, z = t.padding, k = 0; u * b > k; k++)
                    M[k] = 0;
                if (a = t.xoff,
                null == a)
                    return;
                r = t.yoff;
                for (var T = 0, A = -1, C = 0; u > C; C++) {
                    for (var k = 0; l > k; k++) {
                        var S = b * C + (k >> 5)
                          , I = x[(r + C) * (g << 5) + (a + k) << 2] ? 1 << 31 - k % 32 : 0;
                        z && (C && (M[S - b] |= I),
                        l - 1 > C && (M[S + b] |= I),
                        I |= I << 1 | I >> 1),
                        M[S] |= I,
                        T |= I
                    }
                    T ? A = C : (t.y0++,
                    u--,
                    C--,
                    r++)
                }
                t.y1 = t.y0 + A,
                t.sprite = M.slice(0, (t.y1 - t.y0) * b)
            }
        }
    }
    function u(t, e, n) {
        n >>= 5;
        for (var a, r = t.sprite, o = t.width >> 5, s = t.x - (o << 4), l = 127 & s, u = 32 - l, i = t.y1 - t.y0, c = (t.y + t.y0) * n + (s >> 5), d = 0; i > d; d++) {
            a = 0;
            for (var h = 0; o >= h; h++)
                if ((a << u | (o > h ? (a = r[d * o + h]) >>> l : 0)) & e[c + h])
                    return !0;
            c += n
        }
        return !1
    }
    function i(t, e) {
        var n = t[0]
          , a = t[1];
        e.x + e.x0 < n.x && (n.x = e.x + e.x0),
        e.y + e.y0 < n.y && (n.y = e.y + e.y0),
        e.x + e.x1 > a.x && (a.x = e.x + e.x1),
        e.y + e.y1 > a.y && (a.y = e.y + e.y1)
    }
    function c(t, e) {
        return t.x + t.x1 > e[0].x && t.x + t.x0 < e[1].x && t.y + t.y1 > e[0].y && t.y + t.y0 < e[1].y
    }
    function d(t) {
        var e = t[0] / t[1];
        return function(t) {
            return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)]
        }
    }
    function h(t) {
        var e = 4
          , n = e * t[0] / t[1]
          , a = 0
          , r = 0;
        return function(t) {
            var o = 0 > t ? -1 : 1;
            switch (Math.sqrt(1 + 4 * o * t) - o & 3) {
            case 0:
                a += n;
                break;
            case 1:
                r += e;
                break;
            case 2:
                a -= n;
                break;
            default:
                r -= e
            }
            return [a, r]
        }
    }
    function f(t) {
        for (var e = [], n = -1; ++n < t; )
            e[n] = 0;
        return e
    }
    var p, y = Math.PI / 180, g = 64, v = 2048, m = 1;
    if ("undefined" != typeof document)
        p = document.createElement("canvas"),
        p.width = 1,
        p.height = 1,
        m = Math.sqrt(p.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2),
        p.width = (g << 5) / m,
        p.height = v / m;
    else {
        var x = require("canvas");
        p = new x(g << 5,v)
    }
    var w = p.getContext("2d")
      , M = {
        archimedean: d,
        rectangular: h
    };
    w.fillStyle = "red",
    w.textAlign = "center",
    t.cloud = e
    d3.layout = {};
    d3.layout.cloud = e;
}("undefined" == typeof exports ? d3.layout || (d3.layout = {}) : exports);

d3.functor = function functor(v) {
  return typeof v === "function" ? v : function() {
    return v;
  };
};

// Copies a variable number of methods from source to target.
let rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}


Router.route('/', function () {
  this.render('videoWall', {data: {title: 'Video Wall'}});
});
Router.route('/videoWallController');
