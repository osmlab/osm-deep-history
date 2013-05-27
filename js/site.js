var hist = require('../index.js');

$('#go').click(function() {
    var type = $('#type').val(),
        id = +$('#id').val();

    console.log("Getting history for " + type + " " + id);
    document.location.hash = "/" + type + "/" + id;

    hist.getObjectHistory(type, id, function(err, objects) {
        var html = "<table border='1'>",
            i, step, key,
            objectTags = {};

        console.log(objects);

        html += "<tr><th>Version</th>";
        for (i = 0; i < objects.length; i++) {
            step = objects[i];
            html += "<th>" + step.version + "</th>";
        }
        html += "</tr>";

        html += "<tr><td>Time</td>";
        for (i = 0; i < objects.length; i++) {
            step = objects[i];
            html += "<td>" + step.timestamp.format("LLL") + "</td>";
        }
        html += "</tr>";

        html += "<tr><td>Changeset</td>";
        for (i = 0; i < objects.length; i++) {
            step = objects[i];
            html += "<td>" + step.changeset + "</td>";
        }
        html += "</tr>";

        html += "<tr><td>User</td>";
        for (i = 0; i < objects.length; i++) {
            step = objects[i];
            html += "<td>" + step.user + "</td>";
        }
        html += "</tr>";

        html += "<tr><th>Tags</th>";
        for (i = 0; i < objects.length; i++) {
            html += "<th></th>";
        }
        html += "</tr>";

        for (i = 0; i < objects.length; i++) {
            for (key in objects[i].tags) {
                if (objects[i].tags.hasOwnProperty(key)) {
                    objectTags[key] = null;
                }
            }
        }

        for (key in objectTags) {
            html += "<tr><td>" + key + "</td>";
            for (i = 0; i < objects.length; i++) {
                step = objects[i];
                tagValue = step.tags[key];
                html += "<td>" + (tagValue === undefined ? "" : tagValue) + "</td>";
            }
            html += "</tr>";
        }

        html += "</table>";
        $('#history').html(html);
    });
});
