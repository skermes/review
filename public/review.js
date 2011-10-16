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
	if (keyEvent.keyCode == 74) { // j
		var currentCenter = windowPosition().y + window.innerHeight / 2;
		var closestDistance = Number.MAX_VALUE;

		for (var i = 0; i < controller.notes.length; i++) {
			var note = controller.notes[i];			
			var distance = Math.floor(note.position().y + (note.size().height / 2) - currentCenter);
			if (distance > 0 && distance < closestDistance) {
				closestDistance = distance;
			}
		}

		if (closestDistance < Number.MAX_VALUE) {
			window.scrollBy(0, closestDistance);
		}
	}
});
