<?php

include_once('osm_out.php');

if(!is_numeric($_GET['id'])) {
  exit;
}

$id = $_GET['id'];

$url = "http://www.openstreetmap.org/api/0.6/node/$id/history";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);

$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if($http_code != 200) {
  print "Error retrieving history: $http_code";
  exit;
}

$xml = simplexml_load_string($output);

$nodes = array();
$tag_keys = array();
foreach ($xml->node as $node_xml) {
  $version = (integer) $node_xml->attributes()->version;
  $node['version'] = $version;
  $node['lat'] = (double) $node_xml->attributes()->lat;
  $node['lon'] = (double) $node_xml->attributes()->lon;
  $node['changeset'] = (integer) $node_xml->attributes()->changeset;
  $node['user'] = (string) $node_xml->attributes()->user;
  $node['uid'] = (integer) $node_xml->attributes()->uid;
  $node['time'] = (string) $node_xml->attributes()->timestamp;

  $tags = array();
  foreach ($node_xml->tag as $tag_xml) {
    $k = (string) $tag_xml->attributes()->k;
    $v = (string) $tag_xml->attributes()->v;
    $tags[$k] = $v;
    $tag_keys[$k] = true;
  }
  $node['tags'] = $tags;
  
  $nodes[$version] = $node;
}
?>

<head>
  <title>Deep Diff of Node #<? echo $id ?></title>
  <link rel='stylesheet' type='text/css' media='screen,print' href='style.css'/>
  <script src="http://www.google.com/jsapi"></script>
  <script>
    google.load("jquery", "1");
  </script>
  <script>
  $(function() {
    $(".collapse").click(function() {
        var o = this;
        var p = $(this);
        while (!$(p).is("table")) {
            p = $(p).parent();
        }
        $(".collapse",p).each(function(i) {
            if (this == o) {
                $("tr",p).find("td:eq(" + (i+1) + ")").css("display","none");
            }
        });
        $(this).parent().css("display","none");
        $(p).siblings(".reset_collapse").html("<p><a href='#' class='show_all_collapsed'>Show All</a></p>").find(".show_all_collapsed").click(function(){
            $("th,td",p).css("display","");
            $(this).parent().remove();
            return false;
        });
        return false;
    });
  });
  </script>
</head>
<body>
  <h3>Node ID <? echo $id ?></h3>
  <hr />

  <div>
  <table>
    <tr>
      <td>&nbsp;</td>
      <?
foreach($nodes as $n) {
  print "<td>Ver {$n['version']} [<a href='#' class='collapse'>x</a>]</td>";
}
      ?>
    </tr>
    
    <tr>
      <td style='background:#aaa;' colspan='<? echo count($nodes) + 1 ?>'>Primitive Info</td>
    </tr>

    <? echo timeLine($nodes) ?>
    <? echo wayLine($nodes, 'changeset', true, "Changeset#") ?>
    <? echo wayLine($nodes, 'user', true, "User") ?>
    <? echo wayLine($nodes, 'lat', true, "Lat") ?>
    <? echo wayLine($nodes, 'lon', true, "Lon") ?>
    <tr>
      <td style='background:#aaa;' colspan='<? echo count($nodes) + 1 ?>'>License Status</td>
    </tr>
<? echo licenseLine($nodes) ?>
    <tr>
      <td style='background:#aaa;' colspan='<? echo count($nodes) + 1 ?>'>Tags</td>
    </tr>
    <?
foreach (array_keys($tag_keys) as $key) {
  print tagLine($nodes, $key, $key);
}
    ?>
  </table>
  <div class="reset_collapse"><!-- --></div>
  </div>
</body>
