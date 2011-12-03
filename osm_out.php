<?

function color($prev, $curr) {
  if($prev == "----" and $curr == "----") {
    return "notpresent";
  } else if($prev == "----" and $curr != "----") {
    return "new";
  } else if($prev != "----" and $curr != "----") {
    if($prev == $curr) {
      return "unchanged";
    } else {
      return "changed";
    }
  } else if($prev != "----" and $curr == "----") {
    return "removed";
  }
}

function refLine($ways, $ref) {
  $ret = "<tr>\n";
  $previousVal = "----";
  $i = 0;
  
  $ret .= "<td style='background:#ccc;'><a href='node.php?id=$ref'>$ref</a></td>";

  foreach ($ways as $way) {
    $refs = $way['refs'];
    if(!array_key_exists($ref, $refs)) {
      $currentVal = "----";
      $ret .= "<td class='$class'>&nbsp;</td>";
    } else {
      $currentVal = $ref[$ref];
    }
    $class = color($previousVal, $currentVal);
    $ret .= "<td class='$class'>&nbsp;</td>";
    $previousVal = $currentVal;
  }
  $ret .= "</tr>\n";
  return $ret;
}

function memberLine($relations, $type, $ref) {
  $ret = "<tr>";
  $previousVal = "----";
  $i = 0;

  $ret .= "<td style='background:#ccc;'><img src='$type.png'/><a href='$type.php?id=$ref'>$ref</a></td>";

  foreach ($relations as $relation) {
    $members = $relation['members'];
    if(!array_key_exists("$type,$ref", $members)) {
      $currentVal = "----";
      $class = color($previousVal, $currentVal);
      $ret .= "<td class='$class'>&nbsp;</td>";
    } else {
      $currentVal = $members["$type,$ref"];
      $class = color($previousVal, $currentVal);
      if($currentVal == "") {
        $ret .= "<td class='$class empty'>(empty)</td>";
      } else {
        $ret .= "<td class='$class'>$currentVal</td>";
      }
    }
    $previousVal = $currentVal;
  }
  $ret .= "</tr>\n";
  return $ret;
}

function tagLine($ways, $key, $title) {
  $ret = "<tr>\n";
  $previousVal = "----";
  $i = 0;
  
  $ret .= "<td style='background:#ccc;'>$title</td>";

  foreach ($ways as $way) {
    $tags = $way['tags'];
    if(!array_key_exists($key, $tags)) {
      $currentVal = "----";
      $class = color($previousVal, $currentVal);
      $ret .= "<td class='$class'>&nbsp;</td>";
    } else {
      $currentVal = $way['tags'][$key];
      $shortVal = $currentVal;
      $class = color($previousVal, $currentVal);
      if(strlen($currentVal) > 20) {
        $shortVal = substr($currentVal, 0, 20) . "&#8230;";
        $ret .= "<td class='$class'><abbr title='$currentVal'>$shortVal</abbr></td>";
      } else {
        $ret .= "<td class='$class'>$currentVal</td>";
      }
    }
    $previousVal = $currentVal;
  }
  $ret .= "</tr>\n";
  return $ret;
}

function timeLine($ways) {
  $ret = "<tr>\n";
  $ret .= "<td style='background:#ccc;'>Time</td>";
  foreach ($ways as $way) {
    $currentVal = $way['time'];
    $ret .= "<td style='background:#ccc;'>$currentVal</td>";
  }
  $ret .= "</tr>\n";
  return $ret;
}

function wayLine($ways, $val, $useColor=true, $title) {
  $ret = "<tr>\n";
  $previousVal = "----";
  $ret .= "<td style='background:#ccc;'>$title</td>";
  foreach ($ways as $way) {
    $currentVal = $way[$val];
    $class = color($previousVal, $currentVal);
    $ret .= "<td class='$class'>$currentVal</td>";
    $previousVal = $currentVal;
  }
  $ret .= "</tr>\n";
  return $ret;
}
?>

