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
	initialize: function () { this.bindEvents(); },
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents: function () {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicity call 'app.receivedEvent(...);'
	onDeviceReady: function () {
		try {
			var parentElement = document.getElementById('deviceready');
			var listeningElement = parentElement.querySelector('.listening');
			var receivedElement = parentElement.querySelector('.received');

			listeningElement.setAttribute('style', 'display:none;');
			receivedElement.setAttribute('style', 'display:block;');

			app.receivedEvent('deviceready');

			var myUrl = 'http://lswebservices.byu.edu/holidays/HolidayService.svc/rest/GetHolidays/start/1-1-2013/end/1-1-2014';
			$.ajax({
				url: myUrl,
				dataType: 'jsonp',
				jsonp: 'callback',
				timeout: 5000,
				success: function (data, status) {
					//data loaded
					alert('success');
					alert(data);
				},
				error: function () {
					//error loading data
					alert('failure');
				}
			});

			//***********************************************************
			// If this is the first time running the app add a default 
			// flash card. Otherwise load the cards from local storage
			if (localStorage['first-run'] == null) {
				localStorage['first-run'] = false;
				var cards = [];
				var defaultQuestion =
				{
					'question': 'What is the answer to life, the universe, and everything?',
					'answer': '42',
					'options': ['World Peace', '42', 'Love', 'Bacon'],
					'imageURL': 'img/cloudSwirl.jpg',
				};
				cards.push(defaultQuestion);
				defaultQuestion =
				{
					'question': 'What is the answer to life, the universe, and everything?',
					'answer': '42',
					'options': [],
					'imageURL': 'img/cloudSwirl.jpg',
				};
				cards.push(defaultQuestion);

				localStorage['flashcards'] = JSON.stringify(cards);
			}

			window.addEventListener('orientationchange', doOnOrientationChange);

			//***********************************************************
			// Card List Page
			$('#cardList').on('pagebeforeshow', refreshCardList);

			//***********************************************************
			// Edit Card List Page
			$('#editCardList').on('pagebeforeshow', refreshEditCardList);


			//***********************************************************
			// Edit/Add Card Dialog
			//$('#btnNewCard').click(function () {
			//	setQuestionID(-1);
			//	$.mobile.changePage("#editCard", { transition: "slideup" });
			//});

			$('#editCard').on('pagebeforeshow', function () {
				var id = sessionStorage['questionID'];
				$('#divOptions').empty();
				if (id == -1) {
					$('#txtQuestion').val('');
					$('#txtAnswer').val('');
					$('#flipMultipleChoice').val("no");
					$('#divOptions, #btnAddOption').hide();
					$('#imgCapturedPhoto').attr('src', '');

					addOptionBox('');
					localStorage['tempFileURL'] = '';
					localStorage['fileDestinationURL'] = '';
				}
				else {
					var cards = JSON.parse(localStorage['flashcards']);
					var currentCard = cards[id];

					$('#txtQuestion').val(currentCard.question);
					$('#txtAnswer').val(currentCard.answer);
					$('#imgCapturedPhoto').attr('src', currentCard.imageURL);

					if (currentCard.options.length > 0) {
						$('#flipMultipleChoice').val("yes");
						$('#divOptions, #btnAddOption').show();

						for (var j = 0; j < currentCard.options.length; j++) {
							addOptionBox(currentCard.options[j]);
						}
					}
					else {
						$('#flipMultipleChoice').val("no");
						$('#divOptions, #btnAddOption').hide();
						addOptionBox('');
					}
				}
				$('#flipMultipleChoice').slider("refresh");
			});

			$('#flipMultipleChoice').on('change', function () {
				var choice = $('#flipMultipleChoice').val();
				$('#divOptions, #btnAddOption').toggle(choice != 'no');
			});


			$('#btnAddOption').click(function () { addOptionBox(''); });

			$('#btnSaveCard').click(function () {
				var id = sessionStorage['questionID'];
				var cards = JSON.parse(localStorage['flashcards']);
				var newCard =
				{
					'question': $('#txtQuestion').val(),
					'answer': $('#txtAnswer').val(),
					'options': [],
					'imageURL' : '', // default to false. If there is an image we'll set it later
				};

				var choice = $('#flipMultipleChoice').val();
				if (choice == 'yes') {
					$('.optionTextBox').each(function () {
						newCard.options.push($(this).val());
					});
				}

				if (id == -1) cards.push(newCard);
				else cards[id] = newCard;

				// save the new question to local storage
				localStorage['flashcards'] = JSON.stringify(cards);

				// copy the temp file to a more permanent location
				var finalID = id == -1 ? cards.length : id;
				localStorage['fileDestinationURL'] = id.toString() + '.jpg';
				if (localStorage['tempFileURL'] != '') {
					window.resolveLocalFileSystemURI(localStorage['tempFileURL'], copyPhotoToPersistent, fail);
				}

				// return to the question list. The list will be refreshed by the home page's
				// pagebeforeshow event.
				if (id == -1) $.mobile.changePage("#cardList", { transition: "slideup", reverse: "true" });
				else $.mobile.changePage("#editCardList", { transition: "slideup", reverse: "true" });
			});

			$('#btnCancelEditCard').click(function () {
				var id = sessionStorage['questionID'];
				if (id == -1) $.mobile.changePage("#cardList", { transition: "slideup", reverse: "true" });
				else $.mobile.changePage("#editCardList", { transition: "slideup", reverse: "true" });
			});

			//***********************************************************
			// Question Page
			$('.questionPage').on('pagebeforeshow', function (sender, args) {
				var cards = JSON.parse(localStorage['flashcards']);
				var id = sessionStorage['questionID'];
				$('.questionText').html(cards[id]['question']);

				if (cards[id].imageURL != '') {
					$('.photoDisplay').show();
					$('.photoDisplay, .fullScreenImage').attr('src', cards[id].imageURL);
				}
				else $('.photoDisplay').hide();

				var options = cards[id]['options'];
				if (options.length > 0) {
					// multiple choice
					$('.optionList').show();
					$('.freeResponseInput').hide();
					refreshOptionList(options);
				}
				else {// free response
					$('.freeResponseInput').show();
					$('.optionList').hide();
					var txtUserInput = $('.freeResponseInput').find('input');
					txtUserInput.parent().removeClass("ui-body-g").removeClass("ui-body-r");
					txtUserInput.val('');
				}
				setNavigationButtonVisibility(id, cards.length);
				localStorage['selectedAnswer'] = '';
				$('.answerSummaryDiv').hide();
				$('.userAnswer').html('');
				$('.actualAnswer').html('');
			});

			// swipe navigation for question pages.
			$('#question').on('swipeleft', function () {
				var id = parseInt(sessionStorage['questionID']);
				var cards = JSON.parse(localStorage['flashcards']);
				if (id < cards.length - 1) {
					incrementQuestionID();
					$.mobile.changePage("#question2", { transition: "slide", allowSamePageTransition: true });
				}
			});
			$('#question2').on('swipeleft', function () {
				var id = parseInt(sessionStorage['questionID']);
				var cards = JSON.parse(localStorage['flashcards']);
				if (id < cards.length - 1) {
					incrementQuestionID();
					$.mobile.changePage("#question", { transition: "slide", allowSamePageTransition: true });
				}
			});

			$('#question').on('swiperight', function () {
				var id = parseInt(sessionStorage['questionID']);
				var cards = JSON.parse(localStorage['flashcards']);
				if (id > 0) {
					decrementQuestionID();
					$.mobile.changePage("#question2", { transition: "slide",  reverse: true, allowSamePageTransition: true });
				}
			});
			$('#question2').on('swiperight', function () {
				var id = parseInt(sessionStorage['questionID']);
				var cards = JSON.parse(localStorage['flashcards']);
				if (id > 0) {
					decrementQuestionID();
					$.mobile.changePage("#question", { transition: "slide", reverse: true, allowSamePageTransition: true });
				}
			});

			$(".checkAnswerButton").click(function () {
				var currentPage = $.mobile.activePage;

				var cards = JSON.parse(localStorage['flashcards']);
				var id = sessionStorage['questionID'];
				var currentCard = cards[id];
				var userAnswer = '';
				var actualAnswer = cards[id].answer;
				if (currentCard.options.length > 0) {
					// multiple choice
					userAnswer = localStorage['selectedAnswer'];
					if (userAnswer == '') return;

					// if they get it wrong mark it as red
					if (userAnswer.toLowerCase() != actualAnswer.toLowerCase()) {
						$(".selectedAnswer").buttonMarkup({ theme: 'r' });
					};

					// highlight the correct answer
					$('.answerOptionButton').each(function () {
						var answer = $(this).find('a').html();
						if (answer.toLowerCase() == actualAnswer.toLowerCase()) {
							$(this).buttonMarkup({ theme: 'g' });
						}
					});

				}
				else {
					// free response
					var txtUserInput = currentPage.find('.freeResponseInput').find('input');
					userAnswer = txtUserInput.val();
					if (userAnswer == '') return;
					if (userAnswer.toLowerCase() == actualAnswer.toLowerCase()) {
						txtUserInput.parent().removeClass("ui-body-r").addClass("ui-body-g");
					}
					else {
						txtUserInput.parent().removeClass("ui-body-g").addClass("ui-body-r");
					}
				}
				$('.answerSummaryDiv').show();
				$('.userAnswer').html(userAnswer);
				$('.actualAnswer').html(actualAnswer);
			});

			$(".randomQuestionButton").click(function () {
				var cards = JSON.parse(localStorage['flashcards']);
				var id = sessionStorage['questionID'];
				do {
					var nextID = Math.floor(Math.random() * (cards.length));
				}
				while (nextID == id);
				sessionStorage['questionID'] = nextID;
			});


			$('#btnQuestionPrev, #btnQuestionPrev2').click(function () {
				decrementQuestionID();
			});

			$('#btnQuestionNext, #btnQuestionNext2').click(function () {
				incrementQuestionID();
			});

			//***********************************************************
			// Answer Page
			//$('#answer').on('pagebeforeshow', function (sender, args) {
			//	var cards = JSON.parse(localStorage['flashcards']);
			//	var id = sessionStorage['questionID'];
			//	$('#answerText').html(cards[id]['answer']);

			//	setNavigationButtonVisibility(id, cards.length);
			//});

			//$('#btnAnswerPrev').click(function () {
			//	decrementQuestionID();
			//});

			//$('#btnAnswerNext').click(function () {
			//	incrementQuestionID();
			//});


			//***********************************************************
			// Get Photo
			$('#btnTakePhoto').click(function () {
				capturePhoto(navigator.camera.PictureSourceType.CAMERA);
			});
			$('#btnChoosePhoto').click(function () {
				capturePhoto(navigator.camera.PictureSourceType.PHOTOLIBRARY);
			});
		}
		catch (err) { alert(err.message); }

		// Once we've finished loading switch to the home screen
		$.mobile.changePage("#cardList", { transition: "fade" });
	},

	receivedEvent: function (id) { console.log('Received Event: ' + id); }
};

function addOptionBox(optionText) {
	var txtOption = '<input type="text" class="optionTextBox" ';
	if (optionText != '') txtOption += 'value="' + optionText + '" ';
	txtOption += '/>';
	$('#divOptions').append(txtOption);
	$('.optionTextBox').textinput();
}

function decrementQuestionID() {
	var id = parseInt(sessionStorage['questionID']);
	sessionStorage['questionID'] = --id;
}

function incrementQuestionID() {
	var id = parseInt(sessionStorage['questionID']);
	sessionStorage['questionID'] = ++id;
}

function doOnOrientationChange() {
	//refreshCardList();
}

function refreshOptionList(options) {
	var optionList = $('.optionList');
	optionList.empty();
	for (var i = 0; i < options.length; i++) {
		var option = options[i];
		var listItem = '<li data-icon="false" class="answerOptionButton"><a>' + options[i] + '</li>';
		optionList.append(listItem);
	}
	$(".answerOptionButton").click(function () {
		$(".answerOptionButton").buttonMarkup({ theme: 'c' });
		$(".answerOptionButton").removeClass("selectedAnswer");
		$(this).buttonMarkup({ theme: 'b' });
		$(this).addClass("selectedAnswer");
		localStorage['selectedAnswer'] = $(this).find('a')[0].innerHTML;


		// Use this code for multi-select questions
		//var theme = $(this).attr("data-theme");
		//if (theme == 'c') $(this).buttonMarkup({ theme: 'b' });
		//else $(this).buttonMarkup({ theme: 'c' });
	});
	optionList.each(function () {
		if ($(this).hasClass('ui-listview')) {
			$(this).listview("refresh");
		}
	});
}

function refreshCardList() {
	var cards = JSON.parse(localStorage['flashcards']);
	var cardListView = $('#cardListView');
	cardListView.empty();

	for (var i = 0; i < cards.length; i++) {
		var card = cards[i];
		var text = cards[i]['question'];

		var linkButton = '<a href="#question" data-role="button" onclick="setQuestionID(' + i + ')" data-transition="slide">' + text + '</a>';
		var listItem = '<li>' + linkButton + '</li>';
		cardListView.append(listItem);
	}
	cardListView.listview("refresh");
}

function refreshEditCardList() {
	var cards = JSON.parse(localStorage['flashcards']);
	var cardListView = $('#editCardListView');
	cardListView.empty();

	for (var i = 0; i < cards.length; i++) {
		var card = cards[i];
		var text = cards[i]['question'];

		var linkButton = '<a href="#editCard" data-role="button" onclick="setQuestionID(' + i + ')" data-transition="slideup">' + text + '</a>';
		var deleteButton = '<a data-role="button" data-icon="trash" data-iconpos="notext" onclick="deleteQuestion(' + i + ');">Delete</a>';
		var listItem = '<li>' + linkButton + deleteButton + '</li>';
		cardListView.append(listItem);
	}
	cardListView.listview("refresh");
}

function deleteQuestion(id) {
	var cards = JSON.parse(localStorage['flashcards']);
	cards.splice(id, 1);
	localStorage['flashcards'] = JSON.stringify(cards);
	refreshEditCardList();
}

function setQuestionID(id) { sessionStorage['questionID'] = id; }

function setNavigationButtonVisibility(id, numCards) {

	// Hide prev button if we're on the first question
	$('#btnQuestionPrev, #btnQuestionPrev2').toggle(id != 0);

	// Hide next button if we're on the last question
	$('#btnQuestionNext, #btnQuestionNext2').toggle(id != numCards - 1);

	$('.randomQuestionButton').toggle(numCards != 1);
}

//***********************************************************
// Photo Capture methods

function capturePhoto(source) {
	try
	{
		navigator.camera.getPicture(onPhotoURISuccess, fail, {
			quality: 25,
			destinationType: Camera.DestinationType.FILE_URI,
			sourceType: source,
			targetWidth: 800,
			targetHeight: 800,
		});
	}
	catch (exception) { alert(exception.message); }
}

function onPhotoURISuccess(imageURI) {
	createFileEntry(imageURI);
}

function createFileEntry(imageURI) {
	window.resolveLocalFileSystemURI(imageURI, copyPhotoToTemp, fail);
}

function copyPhotoToTemp(fileEntry) {
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
		fileSys.root.getDirectory("photos", { create: true, exclusive: false }, function (dir) {
			
			var fileName = "temp.jpg";

			// Check if the file exists first. If so, delete it.
			dir.getFile(fileName, { create: false }, function (toDelete) {
				toDelete.remove(function () {
					fileEntry.copyTo(dir, fileName, onTempCopySuccess, fail);
				}, function () { alert('Failed to delete existing file'); });
			},
			function (e)
			{
				fileEntry.copyTo(dir, fileName, onTempCopySuccess, fail);
			});

		}, fail);
	}, fail);
}

function copyPhotoToPersistent(fileEntry) {
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
		fileSys.root.getDirectory("photos", { create: true, exclusive: false }, function (dir) {

			var fileName = localStorage['fileDestinationURL'];
			// Check if the file exists first. If so, delete it.
			dir.getFile(fileName, { create: false }, function (toDelete) {
				toDelete.remove(function () {
					fileEntry.copyTo(dir, fileName, onPersistentCopySuccess, fail);
				}, function () { alert('Failed to delete existing file'); });
			},
			function (e) { fileEntry.copyTo(dir, fileName, onPersistentCopySuccess, fail); });
		}, fail);
	}, fail);
}

function onTempCopySuccess(entry) {
	document.getElementById('imgCapturedPhoto').src = entry.fullPath + '?' + new Date().getTime();// append the time so we're guaranteed to get the latest version
	localStorage['tempFileURL'] = 'file://localhost/' + entry.fullPath;
}

function onPersistentCopySuccess(entry) {
	alert('file copied successfully to ' + entry.fullPath);
	var id = sessionStorage['questionID'];
	var cards = JSON.parse(localStorage['flashcards']);
	
	if (id == -1) id = cards.length - 1;

	cards[id].imageURL = entry.fullPath + '?' + new Date().getTime(); // append the time so we're guaranteed to get the latest version
	localStorage['flashcards'] = JSON.stringify(cards);
}

function fail(e) {
	var msg = '';

	switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
			msg = 'QUOTA_EXCEEDED_ERR';
			break;
		case FileError.NOT_FOUND_ERR:
			msg = 'NOT_FOUND_ERR';
			break;
		case FileError.SECURITY_ERR:
			msg = 'SECURITY_ERR';
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			msg = 'INVALID_MODIFICATION_ERR';
			break;
		case FileError.INVALID_STATE_ERR:
			msg = 'INVALID_STATE_ERR';
			break;
		case FileError.ENCODING_ERR:
			msg = "ENCODING_ERR: The URL is malformed";
			break;
		default:
			msg = e.code;
			break; 
	};

	alert('Error: ' + msg);
}
