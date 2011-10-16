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
    		// parentBranch and reviewBranch are defined in the haml
    		var id = parentBranch.toLowerCase() + '-' +
    		         reviewBranch.toLowerCase() + '-' +
    		         // This gives us around 37 reviews of the same branches
    		         // before we have > 50% chance of id collision
    		         Math.floor(Math.random() * 100000);
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
