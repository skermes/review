var uniqueUrl = false;
var dirty = false;

function addClass(name, elem) {
	var classes = elem.className.split(' ').filter(function(cls) { return cls.trim().length > 0; });
	//alert('adding ' + name + ' to [' + classes + ']');
	var alreadyHere = false;
	for (var i = 0; i < classes.length; i++) {
		if (classes[i] == name) {
			alreadyHere = true;
			break;
		}	
	}
	if (!alreadyHere) {
		elem.className += (classes.length > 0 ? ' ' : '') + name;
	}
}

function removeClass(name, elem) {
	var classes = elem.className.split(' ');
	//alert('removing ' + name + ' from [' + classes + ']');
	elem.className = '';
	for (var i = 0; i < classes.length; i++) {
		if (classes[i] != name) {
			elem.className = elem.className +(elem.className.length > 0 ? ' ' : '') + classes[i];
		}	
	}
}

function startDrag(note, startEvent) {
	var noteOriginX = parseInt(note.style.left.substring(0, note.style.left.length - 2));
	var noteOriginY = parseInt(note.style.top.substring(0, note.style.top.length - 2));
	var moveHandler = function(dragEvent) { drag(note, dragEvent, startEvent.clientX, startEvent.clientY, noteOriginX, noteOriginY); };
	var upHandler = function(upEvent) { endDrag(note, moveHandler); };
	document.addEventListener('mousemove', moveHandler);
	document.addEventListener('mouseup', upHandler);
	addClass('beingdragged', note);
}

function drag(note, event, mouseOriginX, mouseOriginY, noteOriginX, noteOriginY) {
	var offsetX = (event.clientX - mouseOriginX);
	var offsetY = (event.clientY - mouseOriginY);
	note.style.left = noteOriginX + offsetX + 'px';
	note.style.top = noteOriginY + offsetY + 'px';
}

function endDrag(note, moveHandler) {
	document.removeEventListener('mousemove', moveHandler);
	// arguments.callee is this function
	document.removeEventListener('mouseup', arguments.callee);
	removeClass('beingdragged', note);
}

function resizeNote(note) {
	note.children[1].innerText = note.children[0].value;
}

function addNote(x, y) {
	var newNote = document.getElementById('noteprototype').cloneNode(true);
	newNote.id = '';
	addClass('note', newNote);
	newNote.style.left = x + 'px';
	newNote.style.top = y + 'px';
	newNote.addEventListener('keydown', function() {
		dirty = true;
		resizeNote(newNote);
	});
	newNote.addEventListener('mousedown', function(downEvent) { startDrag(newNote, downEvent); });
	resizeNote(newNote);
	document.body.appendChild(newNote);
	newNote.children[0].focus();
	dirty = true;
}

function updateServer() {
	if (dirty) {
		if (!uniqueUrl) {
			var id = (new Date()).getTime();
			history.pushState(null, id + ' review', '/' + id);
			uniqueUrl = id;
		}

		var notes = document.getElementsByClassName('note');
		for (var i = 0; i < notes.length; i++) {
			var value = notes[i].children[0].value;
			if (value) {
				notes[i].children[0].innerText = value;	
			}			
		}

		var data = new FormData();
		data.append('diff', document.body.innerHTML)

		var request = new XMLHttpRequest();
		request.open('POST', '/' + uniqueUrl, true);
		request.send(data)
		
		dirty = false;
	}
}

document.addEventListener('dblclick', function(event) {
	var x = event.clientX;
	var y = window.pageYOffset + event.clientY;
	addNote(x, y);
});

setInterval('updateServer();', 10000);
