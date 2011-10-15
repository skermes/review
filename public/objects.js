/* This file is for js objects that have a conceptual meaning for the review,
   but do not directly interact with the browser document/window.  For 
   objects that do have some presence in a page (such as Notes), the preferred
   technique is to have them return the required state to a calling function
   outside this file, or (when that would be impracticable) to have a callback
   function or document/window object passed in to methods that require it. */

function Position(x, y) {
    return { 
        x: x,
        y: y
    };
}

function Class(name) {
    return {
        add: function(elem) {
            var classes = elem.className.split(' ').filter(function(cls) { return cls.trim().length > 0; });
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
        },
        remove: function(elem) {
            var classes = elem.className.split(' ');
            elem.className = '';
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] != name) {
                    elem.className = elem.className +(elem.className.length > 0 ? ' ' : '') + classes[i];
                }    
            }
        }
    };
}

function Note(template, reportChange, unlinkNote, windowPosition, position) {
    var note = {
        element: template.cloneNode(true),        
    };    
    note.resize = function() {
        note.element.children[1].innerText = note.element.children[0].value;
    };
    note.position = function() {
        var rect = note.element.getBoundingClientRect();
        var wndw = windowPosition();
        return Position(wndw.x + rect.left,
                        wndw.y + rect.top);
    };
    note.saveText = function() {
        // This makes sure the note content is reflected in the HTML,
        // so that it's preserved when posted to the server.
        var value = note.element.children[0].value;
        if (value) {
            note.element.children[0].innerText = value;
        }
    };

    note.element.id = null;
    note.element.style.left = position.x + 'px';
    note.element.style.top = position.y + 'px';
    note.element.addEventListener('keydown', function(keyEvent) {
        reportChange();
        note.resize();
    });
    note.element.children[2].addEventListener('mouseup', function(upEvent) {
        unlinkNote(note);
    });
    note.element.addEventListener('mousedown', function(downEvent) {
        var noteOrigin = note.position();
        var mouseOrigin = Position(downEvent.clientX, downEvent.clientY);
        var moveHandler = function(dragEvent) {
            var offsetX = dragEvent.clientX - mouseOrigin.x;
            var offsetY = dragEvent.clientY - mouseOrigin.y;
            note.element.style.left = noteOrigin.x + offsetX + 'px';
            note.element.style.top = noteOrigin.y + offsetY + 'px';
        };
        var dragClass = Class('beingdragged');
        var upHandler = function(upEvent) {
            note.element.removeEventListener('mousemove', moveHandler);
            // arguments.callee is this function
            note.element.removeEventListener('mouseup', arguments.callee);
            dragClass.remove(note.element);
        };
        note.element.addEventListener('mousemove', moveHandler);
        note.element.addEventListener('mouseup', upHandler);
        dragClass.add(note.element);
    });

    note.resize();
    return note;
}