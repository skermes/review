var uniqueUrl = false;
var dirty = false;

function addNote(x, y) {
	var newNote = document.getElementById('noteprototype').cloneNode(true);
	newNote.id = '';
	newNote.className = 'note';
	newNote.style.left = x + 'px';
	newNote.style.top = y + 'px';
	newNote.addEventListener('keydown', function() {
		dirty = true;
	});
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
