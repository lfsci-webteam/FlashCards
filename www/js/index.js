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
	initialize: function () {
		this.bindEvents();
	},
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

			//***********************************************************
			// If this is the first time running the app add a default 
			// flash card. Otherwise load the cards from local storage
			localStorage.clear();
			if (window.localStorage['first-run'] == null) {
				window.localStorage['first-run'] = false;
				var cards = [];
				var defaultQuestion =
				{
					'question': 'What is the answer to life, the universe, and everything?',
					'answer': 42,
					'options': ['Peace', '42', 'Love', 'Bacon'],
				};
				cards.push(defaultQuestion);
				defaultQuestion =
				{
					'question': 'What is the answer to life, the universe, and everything?',
					'answer': 42,
					'options': [],
				};
				cards.push(defaultQuestion);

				window.localStorage['flashcards'] = JSON.stringify(cards);
			}

			window.addEventListener('orientationchange', doOnOrientationChange);
			$('#home').on('pagebeforeshow', refreshCardList);

			//***********************************************************
			// New Card Dialog
			$('#btnNewCard').click(function () {
				$('#txtQuestion').val('');
				$('#txtAnswer').val('');
				$.mobile.changePage("#newCard", { transition: "slideup" });
			});

			$('#newCard').on('pagebeforeshow', function () {
				$('#flipMultipleChoice').val("no");
				$('#flipMultipleChoice').slider("refresh");
				$('#divOptions, #btnAddOption').hide();
				$('.optionTextBox').remove();
				addOptionBox();
			});

			$('#flipMultipleChoice').on('change', function () {
				var choice = $('#flipMultipleChoice').val();
				if (choice == 'no') {
					$('#divOptions, #btnAddOption').hide();
				}
				else {
					$('#divOptions, #btnAddOption').show();
				}
			});


			$('#btnAddOption').click(function () {
				addOptionBox();
			});

			$('#btnSaveNewCard').click(function () {
				var cards = JSON.parse(localStorage['flashcards']);
				var newCard =
				{
					'question': $('#txtQuestion').val(),
					'answer': $('#txtAnswer').val(),
					'options': [],
				};

				var choice = $('#flipMultipleChoice').val();
				if (choice == 'yes') {
					$('.optionTextBox').each(function () {
						newCard.options.push($(this).val());
					});
				}

				cards.push(newCard);

				// save the new question to local storage
				window.localStorage['flashcards'] = JSON.stringify(cards);

				// return to the question list. The list will be refreshed by the home page's
				// pagebeforeshow event.
				$.mobile.changePage("#home", { transition: "slideup", direction: "reverse" });
			});

			//***********************************************************
			// Question Page
			$('.questionPage').on('pagebeforeshow', function (sender, args) {
				var cards = JSON.parse(localStorage['flashcards']);
				var id = sessionStorage['questionID'];
				$('.questionText').html(cards[id]['question']);
				var options = cards[id]['options'];
				if (options.length > 0) {
					// multiple choice
					$('.optionList').show();
					$('.freeResponseInput').hide();
					refreshOptionList(options);
				}
				else {
					// free response
					$('.freeResponseInput').show();
					$('.optionList').hide();
				}
				setNavigationButtonVisibility(id, cards.length);
				window.localStorage['selectedAnswer'] = '';
				$('.answerSummaryDiv').hide();
				$('.userAnswer').html('');
				$('.actualAnswer').html('');
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
					if (userAnswer == '')
						return;

					// if they get it wrong mark it as red
					if (userAnswer != actualAnswer) {
						$(".selectedAnswer").buttonMarkup({ theme: 'r' });
					};

					// highlight the correct answer
					$('.answerOptionButton').each(function () {
						var answer = $(this).find('a').html();
						if (answer == actualAnswer) {
							$(this).buttonMarkup({ theme: 'g' });
						}
					});

				}
				else {
					// free response
					var txtUserInput = currentPage.find('.freeResponseInput').find('input');
					userAnswer = txtUserInput.val();
					if (userAnswer == '')
						return;
					if (userAnswer == actualAnswer) {
						txtUserInput.parent().removeClass("ui-body-c").removeClass("ui-body-r").addClass("ui-body-g");
					}
					else {
						txtUserInput.parent().removeClass("ui-body-c").removeClass("ui-body-g").addClass("ui-body-r");
					}
				}
				$('.answerSummaryDiv').show();
				$('.userAnswer').html(userAnswer);
				$('.actualAnswer').html(actualAnswer);
			});


			//@bug: slide transition to same page makes page disappear
			//$('#question').on('pageshow', function (sender, args) {
			//	//$(this).addClass('ui-page-active');
			//});

			// since we're transitioning to the same page we need to manually call the 
			// changepage function for the next and prev buttons on the question page
			$('#btnQuestionPrev, #btnQuestionPrev2').click(function () {
				decrementQuestionID();
				//$.mobile.changePage("#question", { transition: "slide", reverse: true, allowSamePageTransition : true });
			});

			$('#btnQuestionNext, #btnQuestionNext2').click(function () {
				incrementQuestionID();
				//$.mobile.changePage("#question", { transition: "slide", allowSamePageTransition: true });
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
		}
		catch (err) {
			alert(err.message);
		}

		// Once we've finished loading switch to the home screen
		$.mobile.changePage("#home", { transition: "fade" });
	},

	receivedEvent: function (id) {
		console.log('Received Event: ' + id);
	}
};

function addOptionBox() {
	var txtOption = '<input type="text" class="optionTextBox" />';
	$('#divOptions').append(txtOption);
	$('.optionTextBox').textinput();
}

function decrementQuestionID() {
	var id = parseInt(sessionStorage['questionID']);
	id -= 1;
	sessionStorage['questionID'] = id;
}

function incrementQuestionID() {
	var id = parseInt(sessionStorage['questionID']);
	id += 1;
	sessionStorage['questionID'] = id;
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
		window.localStorage['selectedAnswer'] = $(this).find('a')[0].innerHTML;


		// Use this code for multi-select questions
		//var theme = $(this).attr("data-theme");
		//if (theme == 'c')
		//	$(this).buttonMarkup({ theme: 'b' });
		//else
		//	$(this).buttonMarkup({ theme: 'c' });
	});
	optionList.each(function () {
		if ($(this).hasClass('ui-listview')) {
			$(this).listview("refresh");
		}
	});
}

function refreshCardList() {
	var cards = JSON.parse(localStorage['flashcards']);
	var cardList = $('#cardList');
	cardList.empty();

	for (var i = 0; i < cards.length; i++) {
		var card = cards[i];
		var text = cards[i]['question'];

		var deleteButton = '';
		if (true)
			//if (sessionStorage['editMode'] == true)
		{
			deleteButton = '<a data-iconpos="notext" onclick="deleteQuestion(' + i + ')" data-rel="external">Delete</a>';
		}
		var listItem = '<li><a href="#question" onclick="setQuestionID(' + i + ')" data-transition="slide">' + text + '</a>' + deleteButton + '</li>';
		cardList.append(listItem);
	}
	cardList.listview("refresh");
}

function deleteQuestion(id) {
	var cards = JSON.parse(localStorage['flashcards']);
	cards.splice(id, 1);
	window.localStorage['flashcards'] = JSON.stringify(cards);
	refreshCardList();
}
function setQuestionID(id) {
	sessionStorage['questionID'] = id;
}

function setNavigationButtonVisibility(id, numCards) {

	// Hide prev button if we're on the first question
	if (id == 0)
		$('#btnQuestionPrev, #btnQuestionPrev2').hide();
	else
		$('#btnQuestionPrev, #btnQuestionPrev2').show();

	// Hide next button if we're on the last question
	if (id == numCards - 1)
		$('#btnQuestionNext, #btnQuestionNext2').hide();
	else
		$('#btnQuestionNext, #btnQuestionNext2').show();
}

//setTimeout(function () {
//	$.mobile.changePage("#home", { transition: "fade" });

//	$('#question').on('pagebeforechange', function (event, data) {
//		alert(JSON.stringify(data, null, 4));
//		$('#questionText').html('Hey');
//	});

//}, 2000);

