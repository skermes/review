function windowPosition() {
	return Position(window.pageXOffset, window.pageYOffset);
}

function ReviewController() {
    var controller = {
        reviewId: null,
        dirty: false,
        notes: []
    };
    controller.noteChanged = function() {
        controller.dirty = true;
    };
    controller.removeNote = function(note) {
        document.body.removeChild(note.element);
        controller.noteChanged();
    };

    controller.addNote = function(position) {
        var template = document.getElementById('notetemplate');
        var note = Note.create(template, controller.noteChanged, 
                               controller.removeNote, windowPosition,
                               position);
        document.body.appendChild(note.element);
        note.element.children[0].focus();
        controller.dirty = true;
        controller.notes.push(note);
    };
    controller.updateServer = function() {
    	if (!controller.dirty) { return; }
    	if (!controller.reviewId) {
    		var id = (new Date()).getTime();
    		history.pushState(null, id + ' review', '/' + id);
    		controller.reviewId = id;
    	}

    	for (var i = 0; i < controller.notes.length; i++) {
    		controller.notes[i].saveText();
    	}

    	var data = new FormData();
    	data.append('diff', document.body.innerHTML);
    	var request = new XMLHttpRequest();
    	request.open('POST', '/' + controller.reviewId, true);
    	request.send(data);
    	controller.dirty = false;
    };
    controller.initAfterLoad = function() {
    	var existingNotes = document.getElementsByClassName('note');
	    for (var i = 0; i < existingNotes.length; i++) {
	    	// Only the template note has an id
	    	if (existingNotes[i].id) { continue; }
	    	controller.notes.push(Note.open(existingNotes[i], controller.noteChanged,
	    								    controller.removeNote, windowPosition));
	    }
    };    

    return controller;
}

var controller = ReviewController();
document.addEventListener('dblclick', function(click) {
	var wndw = windowPosition();
	controller.addNote(Position(wndw.x + click.clientX, 
								wndw.y + click.clientY));
});
setInterval('controller.updateServer();', 10000);
document.addEventListener('readystatechange', function(readyEvent) {
	if (document.readyState == 'complete') {
		controller.initAfterLoad();
		document.removeEventListener(arguments.callee);
	}
});
document.addEventListener('keyup', function(keyEvent) {
	var targetTag = keyEvent.target.tagName.toLowerCase();
	if (targetTag == 'textarea' || targetTag == 'input') {
		return;
	}

	var closestNote = function(distance) {
		var closest = null
		var closestDistance = Number.MAX_VALUE;

		for (var i = 0; i < controller.notes.length; i++) {
			var dist = distance(controller.notes[i]);;
			if (dist > 0 && dist < closestDistance) {
				closestDistance = dist;
				closest = controller.notes[i];
			}
		}

		return closest;
	};

	if (keyEvent.keyCode == 74) { // j
		var currentCenter = windowPosition().y + window.innerHeight / 2;
		var calc = function(note) {
			return Math.floor(note.position().y + (note.size().height / 2) - currentCenter);
		};
		var targetNote = closestNote(calc);
		
		if (targetNote) {
			window.scrollBy(0, calc(targetNote));
			// A quick focus/blur trigger the animation
			// without giving the note keyboard control
			targetNote.element.children[0].focus();
			targetNote.element.children[0].blur();
		}
	}
	else if (keyEvent.keyCode == 75) { // k
		var currentCenter = windowPosition().y + window.innerHeight / 2;
		var calc = function(note) {
			return Math.floor(currentCenter - (note.position().y + (note.size().height / 2)));
		};
		var targetNote = closestNote(calc);

		if (targetNote) {
			window.scrollBy(0, -calc(targetNote));
			// A quick focus/blur trigger the animation
			// without giving the note keyboard control
			targetNote.element.children[0].focus();
			targetNote.element.children[0].blur();
		}
	}
});
