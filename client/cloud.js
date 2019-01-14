console.log("import cloud!");

import d3 from 'd3';



console.log(d3);

let TWEET_CLOUD = function(){
  console.log("inside tweet cloud");
  this.tweetHistory = [];
  this.tweetQueue = [];
  this.tweetWords = "";

  this.createContainerDivs = function(container){
    container.append('<div class="container" style="width:100%"><div id="left-col" class="col-xs-2"></div><div id="center-col" class="col-xs-8" style="height: auto;"></div><div id="right-col" class="col-xs-2"></div></div>');
  }

  this.addTweet = function(tweet){
    this.tweetQueue.push(tweet);
    this.tweetHistory.push(tweet);
    console.log(this.tweetQueue);
    console.log(this.tweetHistory);
    this.addTweetDiv(tweet);
  }

  this.addTweetDiv = function(data){
    var lc = $("#left-col");
    lc.append( createTweetDiv(data) );
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
}
