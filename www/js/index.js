/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
		
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
         var parentElement = document.getElementById('deviceready');
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        app.receivedEvent('deviceready');
		
		//$('#home').on('pagecreate',function(event){
  	//	setTimeout(function() { $.mobile.changePage("#question", { transition: "slide" }); }, 1000);
	//});
		try
		{
			$.mobile.changePage("#question", { transition: "slide" });
		}
		catch(err)
		{
			alert(err.message);
		}
		if (window.localStorage['first-run'] == null)
		{
			window.localStorage['first-run'] = false;
			var questions = [];
			var answers = [];
			questions.push('What is the answer to life, the universe, and everything?');
			answers.push(42);
			
			window.localStorage['questions'] = JSON.stringify(questions);
			window.localStorage['answers'] = JSON.stringify(answers);		
		}
		
		var questions = JSON.parse(window.localStorage['questions']);
		var answers = JSON.parse(window.localStorage['answers']);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
       
		console.log('Received Event: ' + id);
		
    }
};
