var hist = require('../index.js');

var map = L.map('map').setView([51.505, -0.09], 13);

$(document).ready(function() {
    var hash = document.location.hash;
    if (hash) {
        var match = /^#\/(node|way|relation)\/(\d*)/.exec(hash);
        if (match) {
            $('#type').val(match[1]);
            $('#id').val(match[2]);
            $('#go').click();
        } else {
            document.location.hash = "";
        }
    }
});

$('#go').click(function() {
    var type = $('#type').val(),
        id = +$('#id').val();

    console.log("Getting history for " + type + " " + id);
    document.location.hash = "/" + type + "/" + id;

    hist.getObjectHistory(type, id, function(err, objects) {
        var html = "<table border='1'>",
            i, step, key,
            objectTags = {},
            object = objects[type][id];

        console.log(objects);

        html += "<tr><th>Version</th>";
        for (i = 0; i < object.length; i++) {
            step = object[i];
            html += "<th>" + step.version + "</th>";
        }
        html += "</tr>";

        html += "<tr><td>Time</td>";
        for (i = 0; i < object.length; i++) {
            step = object[i];
            html += "<td>" + step.timestamp.format("LLL") + "</td>";
        }
        html += "</tr>";

        html += "<tr><td>Changeset</td>";
        for (i = 0; i < object.length; i++) {
            step = object[i];
            html += "<td>" + step.changeset + "</td>";
        }
        html += "</tr>";

        html += "<tr><td>User</td>";
        for (i = 0; i < object.length; i++) {
            step = object[i];
            html += "<td>" + step.user + "</td>";
        }
        html += "</tr>";

        html += "<tr><th>Tags</th>";
        for (i = 0; i < object.length; i++) {
            html += "<th></th>";
        }
        html += "</tr>";

        for (i = 0; i < object.length; i++) {
            for (key in object[i].tags) {
                if (object[i].tags.hasOwnProperty(key)) {
                    objectTags[key] = null;
                }
            }
        }

        for (key in objectTags) {
            html += "<tr><td>" + key + "</td>";
            for (i = 0; i < object.length; i++) {
                step = object[i];
                tagValue = step.tags[key];
                html += "<td>" + (tagValue === undefined ? "" : tagValue) + "</td>";
            }
            html += "</tr>";
        }

        html += "</table>";
        $('#history').html(html);
    });
});
