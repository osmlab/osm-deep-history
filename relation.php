<?php

include_once('osm_out.php');

if(!is_numeric($_GET['id'])) {
  exit;
}

$id = $_GET['id'];

$url = "http://www.openstreetmap.org/api/0.6/relation/$id/history";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, "curl/deep_history_viewer (http://osm.mapki.com/history/)");
$output = curl_exec($ch);

$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if($http_code != 200) {
  print "Error retrieving history: $http_code";
  exit;
}

$xml = simplexml_load_string($output);

$relations = array();
$tag_keys = array();
$relation_refs = array();
foreach ($xml->relation as $way_xml) {
  $version = (integer) $way_xml->attributes()->version;
  $way['changeset'] = (integer) $way_xml->attributes()->changeset;
  $way['user'] = (string) $way_xml->attributes()->user;
  $way['uid'] = (integer) $way_xml->attributes()->uid;
  $way['time'] = (string) $way_xml->attributes()->timestamp;

  $tags = array();
  foreach ($way_xml->tag as $tag_xml) {
    $k = (string) $tag_xml->attributes()->k;
    $v = (string) $tag_xml->attributes()->v;
    $tags[$k] = $v;
    $tag_keys[$k] = true;
  }
  $way['tags'] = $tags;

  $members = array();
  foreach ($way_xml->member as $member_xml) {
    $role = (string) $member_xml->attributes()->role;
    $type = (string) $member_xml->attributes()->type;
    $ref = (string) $member_xml->attributes()->ref;
    $relation_refs["$type,$ref"] = true;
    $members["$type,$ref"] = $role;
  }
  $way['members'] = $members;
  
  $relations[$version] = $way;
}

?>

<head>
  <title>Deep Diff of Relation #<? echo $id ?></title>
  <link rel='stylesheet' type='text/css' media='screen,print' href='style.css'/>
</head>
<body>
  <h3>Relation ID <? echo $id ?></h3>
  <hr />

  <table>
    <tr>
      <td style='background:#aaa;' colspan='<? echo count($relations) + 1 ?>'>Primitive Info</td>
    </tr>

    <? echo timeLine($relations) ?>
    <? echo wayLine($relations, 'changeset', true, "Changeset#", "http://osm.org/browse/changeset/") ?>
    <? echo wayLine($relations, 'user', true, "User", "http://osm.org/user/") ?>
    <tr>
      <td style='background:#aaa;' colspan='<? echo count($relations) + 1 ?>'>License Status <small>(Last updated: <? echo date ("d-M-Y H:i", filemtime("users_agreed.txt")) ?>)</small></td>
    </tr>
<? echo licenseLine($relations) ?>
    <tr>
      <td style='background:#aaa;' colspan='<? echo count($relations) + 1 ?>'>Tags</td>
    </tr>
    <?
foreach (array_keys($tag_keys) as $key) {
  print tagLine($relations, $key, $key);
}
    ?>
    <tr>
      <td style='background:#aaa;' colspan='<? echo count($relations) + 1 ?>'>Members</td>
    </tr>
    <?
foreach (array_keys($relation_refs) as $key) {
  list($type, $ref) = split(',', $key);
  print memberLine($relations, $type, $ref);
}
    ?>
  </table>
</body>
