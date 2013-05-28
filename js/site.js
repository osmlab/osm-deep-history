var hist = require('../index.js');

var map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
var overlays = L.featureGroup([]).addTo(map);

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

var dataColumn = function(row_name, data, key, value_transform) {
    var transform = value_transform || function(keyval) { return keyval; };
    var prev = null;

    var html = "<tr><td class='first_column'>" + row_name + "</td>";
    for (var i = 0; i < data.length; i++) {
        var val = transform(data[i][key]);

        var clazz = '';
        if (prev == val) {
            clazz = 'unchanged';
        } else if (!prev && val && val != prev) {
            clazz = 'added';
        } else if (prev && !val) {
            clazz = 'removed';
        } else if (val && prev != val) {
            clazz = 'changed';
        }

        html += "<td class='" + clazz + "'>" + val + "</td>";
        prev = val;
    }
    html += "</tr>";

    return html;
};

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

        overlays.clearLayers();

        html += "<tr class='row_header'><th class='first_column'>Version</th>";
        for (i = 0; i < object.length; i++) {
            step = object[i];
            html += "<th>" + step.version + "</th>";
        }
        html += "</tr>";

        html += dataColumn('Time', object, 'timestamp', function(time) { return time.format('LLL'); });
        html += dataColumn('Changeset', object, 'changeset');
        html += dataColumn('User', object, 'user');

        if (type == 'node') {
            for (i = 0; i < object.length; i++) {
                if (object[i].visible) {
                    overlays.addLayer(L.circleMarker([object[i].lat, object[i].lon]));
                }
            }
            map.fitBounds(overlays.getBounds());
            $('#map').show();
            map.invalidateSize();
        } else {
            $('#map').hide();
            map.invalidateSize();
        }

        html += "<tr class='row_header'><th class='first_column'>Tags</th>";
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
            html += dataColumn(key, object, 'tags', function(tags) { return (tags[key] === undefined ? "" : tags[key]); });
        }

        html += "</table>";
        $('#history').html(html);
    });
});
